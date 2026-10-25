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
