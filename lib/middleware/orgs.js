var Table = require("cli-table3")
var helpers = require("../util/helpers")
var surgeSDK = require("surge-sdk")

// target-first inside the namespace, like `surge <proj> <verb>`:
//
//   surge orgs                                        every org you belong to
//   surge orgs <org>                                  an org: its name, your role
//   surge orgs <org> create [--name <name>]
//   surge orgs <org> rename [<slug>] [--name <name>]
//   surge orgs <org> remove                           refused while it holds domains
//   surge orgs <org> join <code>                      as whoever is signed in
//
//   surge orgs <org> members                          members and pending invites
//   surge orgs <org> members <email>                  one of them
//   surge orgs <org> members <email> invite [--admin] emails a one-time code
//   surge orgs <org> members <email> revoke           withdraw, remove, or leave
//   surge orgs <org> members <email> mkadmin|rmadmin
//
// an invite goes to an email, and any account holding its code can join:
// the email is where it goes, not who has to accept it
//
// every writing command names its org: there is no current org. `list` is
// a silent alias of the bare form, and a reserved slug (rolodex) so it can
// never also be an org

var table = function(){
  return new Table({
    chars: { 'top': '' , 'top-mid': '' , 'top-left': '' , 'top-right': ''
           , 'bottom': '' , 'bottom-mid': '' , 'bottom-left': '' , 'bottom-right': ''
           , 'left': '  ' , 'left-mid': '' , 'mid': '' , 'mid-mid': ''
           , 'right': '' , 'right-mid': '' , 'middle': ' ' },
    style: { 'padding-left': 0, 'padding-right': 2 }
  })
}

var day = function(iso){
  return iso ? iso.split("T")[0] : "—"
}

module.exports = function(req, next){

  var argv = req.argv
  var bin  = req.configuration.name
  var target = argv["_"][0] != null ? String(argv["_"][0]) : null
  var verb = argv["_"][1] != null ? String(argv["_"][1]) : null
  var name = argv.name != null && argv.name !== true ? String(argv.name) : null

  // no status handlers: their 403/404 lines are about domains, and an
  // org's refusals carry their own message
  var sdk = surgeSDK({ endpoint: req.endpoint.format() })
  var auth = { user: "token", pass: req.creds.token }

  var success = function(msg, note){
    helpers.space()
    helpers.trunc("Success".green + (" - " + msg).grey)
    if (note) helpers.trunc(note.grey)
    return next()
  }

  // surge orgs
  if (target === null || (target === "list" && verb === null)){
    return sdk.orgs(auth, function(error, orgs){
      if (error) return next(error)
      helpers.space()
      // nothing to list yet: the way in instead
      if (orgs.length === 0){
        helpers.trunc(("Empty").grey)
        require("./help").orgsUsage(bin)
        return next()
      }
      var t = table()
      orgs.forEach(function(org){
        t.push([org.slug, org.name === org.slug ? "" : org.name, org.role.grey, day(org.created_at).grey])
      })
      helpers.log(t.toString())
      return next()
    })
  }

  // surge orgs <org>
  if (verb === null){
    return sdk.org(target, auth, function(error, org){
      if (error) return next(error)
      var count = org.members.length
      helpers.space()
      helpers.trunc(org.slug.underline + (org.name !== org.slug ? "  " + org.name : ""))
      helpers.trunc(("you are " + (org.role === "admin" ? "an admin" : "a member") + " · " + count + (count === 1 ? " member" : " members") + " · since " + day(org.created_at)).grey)
      return next()
    })
  }

  // surge orgs <org> create [--name <name>]
  if (verb === "create"){
    var args = { slug: target }
    if (name) args.name = name
    return sdk.orgCreate(args, auth, function(error, org){
      if (error) return next(error)
      return success("Created org " + org.slug + ". You're its admin.")
    })
  }

  // surge orgs <org> rename [<slug>] [--name <name>]
  if (verb === "rename"){
    var slug = argv["_"][2]
    if (slug == null && !name) return next({ messages: ["give the org a new slug or --name - `" + bin + " orgs " + target + " rename <slug>`"] })
    var changes = {}
    if (slug != null) changes.slug = String(slug)
    if (name) changes.name = name
    return sdk.orgRename(target, changes, auth, function(error, org){
      if (error) return next(error)
      var renamed = changes.slug && target !== org.slug && target !== org.id
      return renamed
        ? success("Renamed " + target + " to " + org.slug + ".", target + " stays reserved for this org for 30 days.")
        : success("Saved " + org.slug + (org.name !== org.slug ? " (" + org.name + ")" : "") + ".")
    })
  }

  var article = function(role){ return role === "admin" ? "an admin" : "a member" }

  // one member, or a pending invite, in a line or two
  var describe = function(m){
    helpers.space()
    helpers.trunc(m.email.underline)
    var line = m.pending
      ? "invited as " + article(m.role) + (m.invited_by ? " by " + m.invited_by : "") + " · expires " + day(m.expires_at)
      : m.role + (m.bot ? " · bot" : "") + (m.invited_as ? " · invited as " + m.invited_as : "")
    helpers.trunc(line.grey)
  }

  // surge orgs <org> join <code>
  if (verb === "join"){
    var code = argv["_"][2]
    if (code == null) return next({ messages: ["the invite's code must be present - `" + bin + " orgs " + target + " join <code>`"] })
    return sdk.orgJoin(target, String(code), auth, function(error, org){
      if (error) return next(error)
      return org.already
        ? success("You're already in " + org.slug + ".", "The code is used up, and nothing changed.")
        : success("Joined " + org.slug + " as " + article(org.role) + ".")
    })
  }

  // surge orgs <org> members [<email> [invite|revoke|mkadmin|rmadmin]]
  if (verb === "members"){
    var who = argv["_"][2] != null ? String(argv["_"][2]) : null
    var act = argv["_"][3] != null ? String(argv["_"][3]) : null

    if (who === null){
      return sdk.orgMembers(target, auth, function(error, list){
        if (error) return next(error)
        helpers.space()
        var t = table()
        list.forEach(function(m){
          var note = m.pending
            ? "invited · expires " + day(m.expires_at)
            : [m.bot ? "bot" : null, m.invited_as ? "invited as " + m.invited_as : null].filter(Boolean).join(" · ")
          t.push([m.email, m.role.grey, note.grey])
        })
        helpers.log(t.toString())
        return next()
      })
    }

    if (act === null){
      return sdk.orgMember(target, who, auth, function(error, m){
        if (error) return next(error)
        describe(m)
        return next()
      })
    }

    if (act === "invite"){
      return sdk.orgInvite(target, who, argv.admin ? "admin" : "member", auth, function(error, m){
        if (error) return next(error)
        return success("Invited " + m.email + " to " + target + " as " + article(m.role) + ".",
          "The email carries a one-time code that joins from any account. It expires " + day(m.expires_at) + ".")
      })
    }

    if (act === "revoke"){
      return sdk.orgRevoke(target, who, auth, function(error, m){
        if (error) return next(error)
        if (m.pending) return success("Withdrew the invite to " + m.email + ". Its code no longer works.")
        if (m.email === req.account.email) return success("You left " + target + ".")
        return success("Removed " + m.email + " from " + target + ".")
      })
    }

    if (act === "mkadmin" || act === "rmadmin"){
      return sdk.orgRole(target, who, act === "mkadmin" ? "admin" : "member", auth, function(error, m){
        if (error) return next(error)
        return success(m.email + (m.pending ? "'s invite is now for " : " is now ") + article(m.role) + " of " + target + ".")
      })
    }

    helpers.space()
    helpers.trunc("Aborted".yellow + (" - `" + act + "` is not a " + bin + " orgs members command. Try `" + bin + " orgs`.").grey)
    helpers.space()
    return process.exit(1)
  }

  // surge orgs <org> remove
  if (verb === "remove"){
    return sdk.orgRemove(target, auth, function(error, org){
      if (error){
        if (!error.domains) return next(error)
        helpers.space()
        helpers.trunc("Error".red + (" - " + error.messages[0]).grey)
        error.domains.forEach(function(domain){ helpers.trunc("  " + domain) })
        helpers.space()
        return process.exit(1)
      }
      return success("Removed org " + org.slug + ".", org.slug + " is free for anyone to use.")
    })
  }

  helpers.space()
  helpers.trunc("Aborted".yellow + (" - `" + verb + "` is not a " + bin + " orgs command. Try `" + bin + " orgs`.").grey)
  helpers.space()
  return process.exit(1)

}
