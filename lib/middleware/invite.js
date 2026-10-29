
var helpers = require("../util/helpers.js")
var surgeSDK = require("surge-sdk")

// collaborator invites are closed (plans/b2b.md): orgs share domains now,
// and the api answers every email as "not sent" with what to do instead.
// grants made before stay, and `revoke` still removes them

module.exports = function(req, next){

  var sdk = surgeSDK({
    endpoint: req.endpoint.format(),
    defaults: helpers.defaults
  })

  var args = helpers.parseDomainsEmails(req.argv["_"])
  if (req.domain && args.domains.indexOf(req.domain) === -1) args.domains.unshift(req.domain)

  var abort = function(msg){
    helpers.space()
    helpers.trunc("Aborted".yellow + (" - " + msg).grey)
    helpers.space()
    process.exit(1)
  }

  sdk.invite(args.domains[0] || null, args, { user: "token", pass: req.creds.token }, function(error, rsp){
    if (error) return abort((error.messages && error.messages[0]) || error.message || "could not invite")
    var invites = (rsp && rsp.invites) || []
    var refused = invites.length && invites.every(function(i){ return i.status === "not sent" })
    if (refused) return abort(invites[0].invite)
    helpers.displayInvites(rsp)
    return next()
  })

}
