var should = require('should')
var path = require('path')
var { execFileSync } = require('child_process')

var root = path.join(__dirname, '..', '..')

// the sdk hands middleware the response body only — feed bust the body the
// api sends (no status field) and check what it prints
var run = function (body) {
  var script = `
    var sdkPath = require.resolve("surge-sdk")
    require.cache[sdkPath] = { exports: function(){ return {
      bust: function(domain, auth, cb){ cb(null, ${JSON.stringify(body)}) }
    }}}
    var skin = require("./lib/util/skin")
    var bust = require("./lib/middleware/bust")
    skin({ endpoint: { format: function(){ return "https://x" } }, domain: "foo.com", argv: { _: [] }, creds: { token: "t" } }, [bust])
  `
  return execFileSync(process.execPath, ['-e', script], { cwd: root, encoding: 'utf8' })
}

describe('bust', function () {

  it('reports the bust on a successful reply', function () {
    var out = run({ instances: [], confirmed: ["sfo-11", "jfk-08"], unconfirmed: [] })
    out.should.match(/Busting cache/)
    out.should.not.match(/not Busted/)
  })

})
