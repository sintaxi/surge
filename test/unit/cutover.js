var should = require('should')
var path = require('path')
var { execFileSync } = require('child_process')

var root = path.join(__dirname, '..', '..')

// the sdk hands middleware the response body only — feed cutover the body
// the api sends (no status field) and check what it prints
var run = function (body) {
  var script = `
    var sdkPath = require.resolve("surge-sdk")
    require.cache[sdkPath] = { exports: function(){ return {
      cutover: function(domain, rev, auth, cb){ cb(null, ${JSON.stringify(body)}) }
    }}}
    var skin = require("./lib/util/skin")
    var cutover = require("./lib/middleware/cutover")
    skin({ endpoint: { format: function(){ return "https://x" } }, domain: "foo.com", argv: { _: ["1790874836393"] }, creds: { token: "t" } }, [cutover])
  `
  return execFileSync(process.execPath, ['-e', script], { cwd: root, encoding: 'utf8' })
}

var revision = function (rev) {
  return { rev: rev, preview: rev + "--foo-com.surge.sh", email: "a@b.c", publicFileCount: 1, publicTotalSize: 10 }
}

describe('cutover', function () {

  it('reports the cutover when the serving rev changed', function () {
    var out = run({ domain: "foo.com", revision: revision(1790874836393), former: revision(1790874674100), instances: [] })
    out.should.match(/now serving revision/)
    out.should.not.match(/Unchanged/)
  })

  it('reports the cutover when nothing was serving before', function () {
    var out = run({ domain: "foo.com", revision: revision(1790874836393), former: null, instances: [] })
    out.should.match(/now serving revision/)
  })

  it('reports unchanged when the rev was already serving', function () {
    var out = run({ domain: "foo.com", revision: revision(1790874836393), former: revision(1790874836393), instances: [] })
    out.should.match(/Unchanged/)
    out.should.not.match(/now serving revision/)
  })

})
