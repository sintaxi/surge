var should = require('should')
var path = require('path')
var { execFileSync } = require('child_process')

var root = path.join(__dirname, '..', '..')

// invites and transfers are codes (2026-10-28): `orgs <org> invite`
// prints one, `claim` joins or takes with any, `scrap` cancels any
var run = function (mw, argv, stubs) {
  var script = `
    var sdkPath = require.resolve("surge-sdk")
    var stubs = ${JSON.stringify(stubs)}
    require.cache[sdkPath] = { exports: function(){
      var out = {}
      Object.keys(stubs).forEach(function(name){
        out[name] = function(){ var cb = arguments[arguments.length - 1]; var s = stubs[name]; cb(s.error || null, s.rsp) }
      })
      return out
    }}
    var skin = require("./lib/util/skin")
    var mw = require("./lib/middleware/${mw}")
    skin({ configuration: { name: "surge" }, endpoint: { format: function(){ return "https://x" } }, argv: { _: ${JSON.stringify(argv)} }, creds: { token: "t" }, account: { email: "a@b.c" } }, [mw])
  `
  var out
  try { out = execFileSync(process.execPath, ['-e', script], { cwd: root, encoding: 'utf8' }) }
  catch (e) { out = (e.stdout || '') + (e.stderr || '') }
  return out.replace(/\u001b\[\d+m/g, "")
}

var lines = function (out) {
  return out.split("\n").filter(function (l) { return l.trim() })
}

describe('codes', function () {

  it('orgs <org> invite prints only the code', function () {
    var out = run("orgs", ["acme", "invite"], { orgInvite: { rsp: { code: "tiger73azqrk", hint: "tiger", role: "member", expires_at: "2026-11-04T00:00:00.000Z" } } })
    lines(out).should.eql(["   Invite Code: tiger73azqrk"])
  })

  it('members <email> invite says invites are codes now', function () {
    var out = run("orgs", ["acme", "members", "fred@foo.com", "invite"], {})
    out.should.match(/invites are codes now, for you to send - `surge orgs acme invite`/)
  })

  it('lists a pending invite by its hint', function () {
    var out = run("orgs", ["acme", "members"], { orgMembers: { rsp: [
      { email: "fred@foo.com", role: "admin", pending: false },
      { hint: "tiger", role: "member", pending: true, invited_by: "fred@foo.com", expires_at: "2026-11-04T00:00:00.000Z" }
    ] } })
    out.should.match(/tiger…\s+member\s+invited · by fred@foo\.com · expires 2026-11-04/)
  })

  it('claim joins an org with an invite', function () {
    var out = run("claim", ["tiger73azqrk"], { claim: { rsp: { org: { slug: "acme", name: "Acme" }, role: "member", already: false } } })
    out.should.match(/Success - joined acme as a member\./)
  })

  it('claim still takes a domain with a transfer code', function () {
    var out = run("claim", ["tiger73azqrk"], { claim: { rsp: { domain: "foo.com", owner: { account: "a@b.c" }, orgs: [] } } })
    out.should.match(/Success - foo\.com is now yours\./)
  })

  it('scrap cancels an invite or a transfer code', function () {
    run("scrap", ["tiger73azqrk"], { scrap: { rsp: { scrapped: "invite", org: { slug: "acme", name: "Acme" } } } })
      .should.match(/Success - scrapped the invite to acme\. It no longer works\./)
    run("scrap", ["tiger73azqrk"], { scrap: { rsp: { scrapped: "transfer", domain: "foo.com" } } })
      .should.match(/Success - scrapped the transfer code for foo\.com\. It no longer works\./)
  })

  it('scrap says why it was refused', function () {
    run("scrap", ["tiger00aaaaa"], { scrap: { error: { messages: ["that code isn't valid"], status: 404 } } })
      .should.match(/Aborted - that code isn't valid/)
  })

})
