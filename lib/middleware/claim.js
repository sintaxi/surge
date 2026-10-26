var helpers  = require("../util/helpers")
var surgeSDK = require("surge-sdk")

// surge claim <code> - takes the domain a transfer code names into the
// signed-in account (plans/transfer.md). The code names the domain, so
// nothing else is typed; moving it into an org is the next command

module.exports = function(req, next){

  var bin  = req.configuration.name
  var sdk  = surgeSDK({ endpoint: req.endpoint.format() })
  var auth = { user: "token", pass: req.creds.token }
  var code = req.argv["_"][0] != null ? String(req.argv["_"][0]).trim() : null

  var abort = function(msg){
    helpers.space()
    helpers.trunc("Aborted".yellow + (" - " + msg).grey)
    helpers.space()
    process.exit(1)
  }

  if (!code) return abort("claim takes a transfer code - `" + bin + " claim <code>`.")

  sdk.claim(code, auth, function(error, rsp){
    if (error) return abort((error.messages && error.messages[0]) || "could not claim with that code")
    helpers.space()
    helpers.trunc("Success".green + (" - " + rsp.domain.underline + " is now yours.").grey)
    var orgs = rsp.orgs || []
    if (orgs.length){
      helpers.trunc(("To put it in an org: " + bin + " " + rsp.domain + " transfer " + (orgs.length === 1 ? orgs[0] : "<org>")).grey)
    }
    return next()
  })

}
