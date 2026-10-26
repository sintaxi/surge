var helpers  = require("../util/helpers")
var parseUrl = require("url-parse-as-address")
var surgeSDK = require("surge-sdk")

// moving a domain's owner (plans/transfer.md):
//
//   surge <domain> transfer            a code whoever claims it takes it with
//   surge <domain> transfer <org>      into an org you're in
//   surge <domain> transfer <email>    to your own account, out of an org
//   surge transfer <domain> <org>      the verb-first spelling
//
// the code is the only way to hand a domain to another person: they run
// `surge claim <code>`. A new code each time; the last stops working

module.exports = function(req, next){

  var bin    = req.configuration.name
  var sdk    = surgeSDK({ endpoint: req.endpoint.format() })
  var auth   = { user: "token", pass: req.creds.token }
  var domain = parseUrl(req.domain).host
  var to     = req.argv["_"][0] != null ? String(req.argv["_"][0]) : null

  var abort = function(error, fallback){
    var why = error && error.messages && error.messages[0]
    helpers.space()
    helpers.trunc("Aborted".yellow + (" - " + (why || fallback)).grey)
    helpers.space()
    process.exit(1)
  }

  var label = function(owner){
    if (!owner) return "?"
    if (owner.org) return owner.org.name && owner.org.name !== owner.org.slug ? owner.org.slug + " (" + owner.org.name + ")" : owner.org.slug
    return owner.account + " (your account)"
  }

  if (to === null){
    return sdk.transferCode(domain, auth, function(error, rsp){
      if (error) return abort(error, "could not make a transfer code for " + domain)
      helpers.space()
      helpers.trunc("Success".green + (" - transfer code for " + domain.underline + " - whoever runs this takes the domain:").grey)
      helpers.space()
      helpers.log("    " + bin + " claim " + rsp.code)
      helpers.space()
      helpers.trunc(("Expires " + String(rsp.expires_at).split("T")[0] + ". Nothing moves until it's used; a new code replaces this one.").grey)
      return next()
    })
  }

  sdk.transfer(domain, to, auth, function(error, rsp){
    if (error) return abort(error, "could not transfer " + domain)
    helpers.space()
    if (rsp.unchanged){
      helpers.trunc("Success".green + (" - " + domain.underline + " already belongs to " + label(rsp.owner) + ".").grey)
      return next()
    }
    helpers.trunc("Success".green + (" - " + domain.underline + " transferred to " + label(rsp.owner) + ".").grey)
    var notes = []
    if (rsp.owner && rsp.owner.org) notes.push("Every member of " + rsp.owner.org.slug + " can publish to it and tear it down.")
    if (rsp.from && rsp.from.org) notes.push("Members of " + rsp.from.org.slug + " no longer reach it, and have been emailed.")
    notes.push("Serving is unchanged.")
    ;(rsp.collaborators || []).forEach(function(email){
      notes.push(email + " still publishes here as a collaborator" + (rsp.owner && rsp.owner.org ? " - invite them to " + rsp.owner.org.slug : "") + ".")
    })
    if (rsp.limits) notes.push(rsp.limits + ".")
    notes.forEach(function(n){ helpers.trunc(n.grey) })
    return next()
  })

}
