var Table = require("cli-table3")
var helpers = require("../util/helpers")
var surgeSDK = require("surge-sdk")

// target-first inside the namespace, like `surge <proj> <verb>`:
//
//   surge orgs                                        every org you belong to, with its members
//   surge orgs <org>                                  an org: its name, your role
//   surge orgs <org> create [--name <name>]
//   surge orgs <org> rename [<slug>] [--name <name>]
//   surge orgs <org> remove                           refused while it holds domains
//   surge orgs <org> invite [--admin]                 prints a one-time code
//   surge orgs <org> leave                            refused for the last admin
//   surge orgs <org> join <code>                      as whoever is signed in
//
//   surge orgs <org> members                          members and pending invites
//   surge orgs <org> members <email>                  one member
//   surge orgs <org> members <email> revoke           remove a member
//   surge orgs <org> members <email> mkadmin|rmadmin
//
// an invite is a code and nothing is emailed: whoever invites sends it,
// and any account holding it joins with `surge claim <code>` (`join` is
// the older spelling). `surge scrap <code>` cancels one
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

  var article = function(role){ return role === "admin" ? "an admin" : "a member" }

  // a member, or a pending invite (no name: its code's first word stands in)
  var row = function(m){
    var note = m.pending
      ? ["invited", m.invited_by ? "by " + m.invited_by : null, "expires " + day(m.expires_at)].filter(Boolean).join(" · ")
      : [req.account && m.email === req.account.email ? "you" : null, m.bot ? "bot" : null, m.invited_as ? "invited as " + m.invited_as : null].filter(Boolean).join(" · ")
    return ["  " + (m.email || (m.hint + "…").grey), m.role.grey, note.grey]
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
      // each org's members, fetched together, printed in the orgs' order
      var rosters = new Array(orgs.length), left = orgs.length
      var print = function(){
        var t = table()
        orgs.forEach(function(org, i){
          if (i > 0) t.push(["", "", ""])
          t.push([org.slug + (org.name !== org.slug ? "  " + org.name.grey : ""), "", ("since " + day(org.created_at)).grey])
          rosters[i].forEach(function(m){ t.push(row(m)) })
        })
        helpers.log(t.toString())
        return next()
      }
      orgs.forEach(function(org, i){
        sdk.orgMembers(org.slug, auth, function(error, list){
          rosters[i] = error ? [] : list
          if (--left === 0) print()
        })
      })
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


  // one member, or a pending invite, in a line or two
  var describe = function(m){
    helpers.space()
    helpers.trunc(m.email.underline)
    var line = m.pending
      ? "invited as " + article(m.role) + (m.invited_by ? " by " + m.invited_by : "") + " · expires " + day(m.expires_at)
      : m.role + (m.bot ? " · bot" : "") + (m.invited_as ? " · invited as " + m.invited_as : "")
    helpers.trunc(line.grey)
  }

  // surge orgs <org> invite [--admin] - the code and nothing else, like
  // transfer: it's what gets copied or read out
  if (verb === "invite"){
    return sdk.orgInvite(target, argv.admin ? "admin" : null, auth, function(error, invite){
      if (error) return next(error)
      helpers.space()
      helpers.trunc("Invite Code: ".grey + invite.code)
      return next()
    })
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

  // surge orgs <org> members [<email> [revoke|mkadmin|rmadmin]]
  if (verb === "members"){
    var who = argv["_"][2] != null ? String(argv["_"][2]) : null
    var act = argv["_"][3] != null ? String(argv["_"][3]) : null

    if (who === null){
      return sdk.orgMembers(target, auth, function(error, list){
        if (error) return next(error)
        helpers.space()
        var t = table()
        list.forEach(function(m){ t.push(row(m)) })
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

    // invites stopped going to an email (2026-10-28)
    if (act === "invite"){
      return next({ messages: ["invites are codes now, for you to send - `" + bin + " orgs " + target + " invite`"] })
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

  // removing the org: refused while it holds domains, which are listed
  var removeOrg = function(done){
    sdk.orgRemove(target, auth, function(error, org){
      if (error){
        if (!error.domains) return next(error)
        helpers.space()
        helpers.trunc("Error".red + (" - " + error.messages[0]).grey)
        error.domains.forEach(function(domain){ helpers.trunc("  " + domain) })
        helpers.space()
        return process.exit(1)
      }
      return done(org)
    })
  }

  // surge orgs <org> leave - yourself. The last member leaving removes the
  // org, as `remove` does (decided 2026-10-28): nobody would be left to act
  // for it or its domains
  if (verb === "leave"){
    return sdk.orgMembers(target, auth, function(error, list){
      if (error) return next(error)
      var others = list.filter(function(m){ return !m.pending && m.email !== req.account.email })
      if (others.length === 0){
        return removeOrg(function(org){
          return success("You left " + org.slug + ". You were its last member, so it's removed.", org.slug + " is free for anyone to use.")
        })
      }
      sdk.orgRevoke(target, req.account.email, auth, function(error){
        if (error) return next(error)
        return success("You left " + target + ".")
      })
    })
  }

  // surge orgs <org> remove
  if (verb === "remove"){
    return removeOrg(function(org){
      return success("Removed org " + org.slug + ".", org.slug + " is free for anyone to use.")
    })
  }

  helpers.space()
  helpers.trunc("Aborted".yellow + (" - `" + verb + "` is not a " + bin + " orgs command. Try `" + bin + " orgs`.").grey)
  helpers.space()
  return process.exit(1)

}
