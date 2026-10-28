var should = require('should')
var path = require('path')
var { execFileSync } = require('child_process')

var root = path.join(__dirname, '..', '..')

// rollback and rollfore print the edge table only when the serving rev
// moved; a redundant one prints what's serving and nothing else, like cutover
var run = function (verb, body) {
  var script = `
    var sdkPath = require.resolve("surge-sdk")
    require.cache[sdkPath] = { exports: function(){ return {
      ${verb}: function(domain, auth, cb){ cb(null, ${JSON.stringify(body)}) }
    }}}
    var skin = require("./lib/util/skin")
    var mw = require("./lib/middleware/${verb}")
    skin({ endpoint: { format: function(){ return "https://x" } }, domain: "foo.com", argv: { _: [] }, creds: { token: "t" } }, [mw])
  `
  var out = execFileSync(process.execPath, ['-e', script], { cwd: root, encoding: 'utf8' })
  return out.replace(/\u001b\[\d+m/g, "")
}

var revision = function (rev) {
  return { rev: rev, preview: rev + "--foo--com.surge.sh", email: "a@b.c", publicFileCount: 1, publicTotalSize: 10 }
}

var instances = [
  { type: "HTTP", domain: "sfo.surge.sh", location: "US, San Francisco", ip: "138.197.235.123", provider: "D.Ocean", confirmation: true }
]

;["rollback", "rollfore"].forEach(function (verb) {
  describe(verb, function () {

    it('shows the edge table when the serving rev moved', function () {
      var out = run(verb, { revision: revision(1790874836393), former: revision(1790874674100), instances: instances })
      out.should.match(/now serving revision/)
      out.should.match(/sfo\.surge\.sh/)
    })

    it('leaves the edge table out when nothing changed', function () {
      var out = run(verb, { revision: revision(1790874836393), former: revision(1790874836393), instances: instances })
      out.should.match(/Unchanged/)
      out.should.match(/already serving 1790874836393--foo--com\.surge\.sh/)
      out.should.not.match(/sfo\.surge\.sh/)
    })

  })
})
