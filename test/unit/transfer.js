var should = require('should')
var path = require('path')
var { execFileSync } = require('child_process')

var root = path.join(__dirname, '..', '..')

// bare `transfer` prints the code and nothing else
var run = function (argv, body) {
  var script = `
    var sdkPath = require.resolve("surge-sdk")
    require.cache[sdkPath] = { exports: function(){ return {
      transferCode: function(domain, auth, cb){ cb(null, ${JSON.stringify(body)}) }
    }}}
    var skin = require("./lib/util/skin")
    var transfer = require("./lib/middleware/transfer")
    skin({ endpoint: { format: function(){ return "https://x" } }, domain: "foo.com", argv: { _: ${JSON.stringify(argv)} }, creds: { token: "t" } }, [transfer])
  `
  return execFileSync(process.execPath, ['-e', script], { cwd: root, encoding: 'utf8' })
}

describe('transfer', function () {

  it('prints only the transfer code', function () {
    var out = run([], { domain: "foo.com", code: "tiger73azqrk", expires_at: "2026-11-04T04:25:03.518Z" })
    var lines = out.replace(/\u001b\[\d+m/g, "").split("\n").filter(function (l) { return l.trim() })
    lines.should.eql(["   Transfer Code: tiger73azqrk"])
  })

})

describe('transfer refused', function () {

  // the api's permission check answers { message } with no messages list
  it('says why when the api sends message alone', function () {
    var script = `
      var sdkPath = require.resolve("surge-sdk")
      require.cache[sdkPath] = { exports: function(){ return {
        transferCode: function(domain, auth, cb){ cb({ message: "You don't have permission to alter this domain.", status: 403 }) }
      }}}
      var skin = require("./lib/util/skin")
      var transfer = require("./lib/middleware/transfer")
      skin({ endpoint: { format: function(){ return "https://x" } }, domain: "foo.com", argv: { _: [] }, creds: { token: "t" } }, [transfer])
    `
    var out
    try { execFileSync(process.execPath, ['-e', script], { cwd: root, encoding: 'utf8' }) } catch (e) { out = e.stdout; e.status.should.equal(1) }
    out.replace(/\u001b\[\d+m/g, "").should.match(/Aborted - You don't have permission to alter this domain\./)
  })

})
