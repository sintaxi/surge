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
  return out.split("\n").map(function (l) { return l.replace(/\s+$/, "") }).filter(function (l) { return l.trim() })
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

  it('orgs lists every org with its members and their roles', function () {
    var out = run("orgs", [], {
      orgs: { rsp: [
        { slug: "acme", name: "Acme Inc", role: "admin", created_at: "2026-10-20T00:00:00.000Z" },
        { slug: "foo", name: "foo", role: "member", created_at: "2026-10-28T00:00:00.000Z" }
      ] },
      orgMembers: { rsp: [
        { email: "a@b.c", role: "admin", pending: false },
        { email: "jane@acme.com", role: "member", pending: false, bot: "grok" },
        { hint: "tiger", role: "member", pending: true, invited_by: "a@b.c", expires_at: "2026-11-04T00:00:00.000Z" }
      ] }
    })
    var rows = lines(out)
    rows[0].should.match(/^\s+acme\s+Acme Inc\s+since 2026-10-20$/)
    rows[1].should.match(/^\s+a@b\.c\s+admin\s+you$/)
    rows[2].should.match(/^\s+jane@acme\.com\s+member\s+bot$/)
    rows[3].should.match(/^\s+tiger…\s+member\s+invited · by a@b\.c · expires 2026-11-04$/)
    rows[4].should.match(/^\s+foo\s+since 2026-10-28$/)
    rows.should.have.lengthOf(8)
  })

  var two = [{ email: "a@b.c", role: "admin", pending: false }, { email: "jane@acme.com", role: "member", pending: false }]
  var alone = [{ email: "a@b.c", role: "admin", pending: false }, { hint: "tiger", role: "member", pending: true }]

  it('orgs <org> leave removes you', function () {
    run("orgs", ["acme", "leave"], { orgMembers: { rsp: two }, orgRevoke: { rsp: { email: "a@b.c", role: "member", pending: false } } })
      .should.match(/Success - You left acme\./)
    run("orgs", ["acme", "leave"], { orgMembers: { rsp: two }, orgRevoke: { error: { messages: ["an org needs at least one admin"], status: 409 } } })
      .should.match(/an org needs at least one admin/)
  })

  it('orgs <org> leave as the last member removes the org', function () {
    var out = run("orgs", ["acme", "leave"], { orgMembers: { rsp: alone }, orgRemove: { rsp: { slug: "acme", name: "acme" } } })
    out.should.match(/Success - You left acme\. You were its last member, so it's removed\./)
    out.should.match(/acme is free for anyone to use\./)
  })

  it('orgs <org> leave as the last member is refused like remove while it holds domains', function () {
    var out = run("orgs", ["acme", "leave"], { orgMembers: { rsp: alone }, orgRemove: { error: { messages: ["org still holds 1 domain - transfer or tear them down first"], domains: ["docs.acme.com"], status: 409 } } })
    out.should.match(/Error - org still holds 1 domain - transfer or tear them down first/)
    out.should.match(/docs\.acme\.com/)
  })

  it('claim joins an org with an invite', function () {
    var out = run("claim", ["tiger73azqrk"], { claim: { rsp: { org: { slug: "acme", name: "Acme" }, role: "member", already: false } } })
    out.should.match(/Success - joined acme as a member\./)
  })

  it('claim still takes a domain with a transfer code', function () {
    var out = run("claim", ["tiger73azqrk"], { claim: { rsp: { domain: "foo.com", owner: { account: "a@b.c" }, orgs: [] } } })
    out.should.match(/Success - foo\.com is now yours\./)
  })

  // with someone at the terminal, claim checks first and asks
  var ask = function (check, answer, argv) {
    var script = `
      var sdkPath = require.resolve("surge-sdk")
      require.cache[sdkPath] = { exports: function(){ return {
        // claim(code, creds, cb) claims; claim(code, { check }, creds, cb) checks
        claim: function(code, opts, creds, cb){
          if (cb) return cb(null, ${JSON.stringify(check)})
          creds(null, { org: { slug: "acme", name: "Acme" }, role: "member", already: false })
        }
      }}}
      var skin = require("./lib/util/skin")
      var claim = require("./lib/middleware/claim")
      skin({ configuration: { name: "surge" }, endpoint: { format: function(){ return "https://x" } }, argv: ${JSON.stringify(argv || { _: ["tiger73azqrk"] })}, creds: { token: "t" } }, [claim])
    `
    var out
    try { out = execFileSync(process.execPath, ['-e', script], { cwd: root, encoding: 'utf8', input: answer, env: Object.assign({}, process.env, { SURGE_INTERACTIVE: "1", CI: "", FORCE_COLOR: "1" }) }) }
    catch (e) { out = (e.stdout || '') + (e.stderr || '') }
    return out.replace(/\u001b\[\d+m/g, "")
  }

  var invite = { check: true, kind: "invite", org: { slug: "acme", name: "Acme Inc" }, role: "member", by: "fred@acme.com", expires_at: "2026-11-04T00:00:00.000Z", member: false }
  var transfer = { check: true, kind: "transfer", domain: "docs.acme.com", from: { account: "fred@acme.com" }, by: "fred@acme.com", expires_at: "2026-11-04T00:00:00.000Z", yours: false }

  it('claim shows an invite and joins on yes', function () {
    var out = ask(invite, "y\n")
    out.should.match(/   Adds you as a member to the 'acme' org \(Acme Inc\)\.\n   From fred@acme\.com · expires 2026-11-04\n   Would you like to join\? \(y\/N\)/)
    out.should.match(/Success - joined acme as a member\./)
  })

  it('claim shows a transfer and claims nothing on no', function () {
    var out = ask(transfer, "\n")
    out.should.match(/   Makes you the owner of docs\.acme\.com\.\n   From fred@acme\.com · expires 2026-11-04\n   Would you like to claim it\? \(y\/N\)/)
    out.should.match(/Aborted - nothing claimed\. The code still works\./)
    out.should.not.match(/Success/)
  })

  it('claim stops before spending an invite to an org you are in', function () {
    var out = ask(Object.assign({}, invite, { member: true }), "y\n")
    out.should.match(/Aborted - you're already in acme\. The code still works for someone else\./)
    out.should.not.match(/join\?/)
  })

  it('claim --yes does not ask', function () {
    var out = ask(invite, "", { _: ["tiger73azqrk"], yes: true })
    out.should.not.match(/\(y\/N\)/)
    out.should.match(/Success - joined acme as a member\./)
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

  // collaborator invites are closed: orgs share domains now
  it('invite says invites are closed and points at orgs', function () {
    var msg = "invites are closed - orgs share domains now: `surge orgs <org> create`, then `surge example.com transfer <org>`"
    var out = run("invite", ["example.com", "jane@example.com"], { invite: { rsp: { invites: [{ domain: "example.com", email: "jane@example.com", invite: msg, status: "not sent" }] } } })
    lines(out).should.eql(["   Aborted - " + msg])
  })

})
