var helpers  = require("../util/helpers")
var surgeSDK = require("surge-sdk")

// surge scrap <code> - cancels a code (plans/b2b.md, 2026-10-28): an org
// invite, by any member of its org, or a transfer code, by whoever may
// make one for its domain. The code says which, so nothing else is typed

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

  if (!code) return abort("scrap takes a code - `" + bin + " scrap <code>`.")

  sdk.scrap(code, auth, function(error, rsp){
    if (error) return abort((error.messages && error.messages[0]) || error.message || "could not scrap that code")
    helpers.space()
    var what = rsp.scrapped === "invite"
      ? "the invite to " + rsp.org.slug
      : "the transfer code for " + rsp.domain.underline
    helpers.trunc("Success".green + (" - scrapped " + what + ". It no longer works.").grey)
    return next()
  })

}
