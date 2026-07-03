var should = require('should')
var path = require('path')
var { execFileSync } = require('child_process')

var root = path.join(__dirname, '..', '..')

// skin's error channel and default abort both call process.exit,
// so each case runs in a subprocess and asserts on output + exit code
var run = function (script) {
  try {
    var out = execFileSync(process.execPath, ['-e', script], { cwd: root, encoding: 'utf8' })
    return { code: 0, out: out }
  } catch (e) {
    return { code: e.status, out: (e.stdout || '') + (e.stderr || '') }
  }
}

var SKIN = 'var skin = require("./lib/util/skin");'

describe('skin', function () {

  it('runs all layers and exits 0 on the happy path', function () {
    var r = run(SKIN + 'skin({}, [function(req,next){ console.log("one"); next() }, function(req,next){ console.log("two"); next() }])')
    r.code.should.equal(0)
    r.out.should.match(/one[\s\S]*two/)
  })

  it('next({messages}) prints every message, exits 1, and stops the chain', function () {
    var r = run(SKIN + 'skin({}, [function(req,next){ next({ messages: ["bad domain", "bad token"] }) }, function(req,next){ console.log("UNREACHED"); next() }])')
    r.code.should.equal(1)
    r.out.should.match(/Error.*bad domain/)
    r.out.should.match(/Error.*bad token/)
    r.out.should.not.match(/UNREACHED/)
  })

  it('next(Error) prints the message and exits 1', function () {
    var r = run(SKIN + 'skin({}, [function(req,next){ next(new Error("ECONNREFUSED 127.0.0.1")) }])')
    r.code.should.equal(1)
    r.out.should.match(/Error.*ECONNREFUSED/)
  })

  it('next(string) prints the message and exits 1', function () {
    var r = run(SKIN + 'skin({}, [function(req,next){ next("no response from server") }])')
    r.code.should.equal(1)
    r.out.should.match(/Error.*no response from server/)
  })

  it('default abort prints the message and exits 1', function () {
    var r = run(SKIN + 'skin({}, [function(req,next,abort){ abort("Not initiated.") }])')
    r.code.should.equal(1)
    r.out.should.match(/Aborted.*Not initiated/)
  })

  it('routes a middleware api error ({messages}) through the channel', function () {
    var r = run(`
      var sdkPath = require.resolve("surge-sdk")
      require.cache[sdkPath] = { exports: function(){ return {
        rollback: function(domain, auth, cb){ cb({ messages: ["revision not found"] }) }
      }}}
      var skin = require("./lib/util/skin")
      var rollback = require("./lib/middleware/rollback")
      skin({ endpoint: { format: function(){ return "https://x" } }, argv: { _: ["foo.com"] }, creds: { token: "t" } }, [rollback])
    `)
    r.code.should.equal(1)
    r.out.should.match(/Error.*revision not found/)
  })

  it('prints a middleware transport error cleanly (no TypeError)', function () {
    var r = run(`
      var sdkPath = require.resolve("surge-sdk")
      require.cache[sdkPath] = { exports: function(){ return {
        rollback: function(domain, auth, cb){ cb(new Error("socket hang up")) }
      }}}
      var skin = require("./lib/util/skin")
      var rollback = require("./lib/middleware/rollback")
      skin({ endpoint: { format: function(){ return "https://x" } }, argv: { _: ["foo.com"] }, creds: { token: "t" } }, [rollback])
    `)
    r.code.should.equal(1)
    r.out.should.match(/Error.*socket hang up/)
    r.out.should.not.match(/TypeError/)
  })

})
