var surgeSDK    = require("surge-sdk")
var helpers     = require("../../util/helpers")

/**
 * surge plan --web     browser checkout link (Stripe Checkout)
 * surge plan --manage  browser billing link (Stripe Billing Portal)
 *
 * Prints a 48h link and exits; without either flag this is a pass-through.
 */

module.exports = function(req, next){
  if (!req.argv.web && !req.argv.manage) return next()

  var sdk = surgeSDK({
    endpoint: req.endpoint.format()
  })

  var method = req.argv.manage ? "billingLink" : "upgradeLink"

  sdk[method]({ user: "token", pass: req.creds.token }, function(error, reply){
    helpers.space()
    if (error || !reply || !reply.url){
      var msg = (error && error.messages && error.messages[0]) || "could not create link"
      helpers.trunc("Error".red + (" - " + msg).grey)
      helpers.space()
      process.exit(1)
    }
    if (req.argv.manage){
      helpers.trunc("Manage your plan, card, and invoices in your browser:".grey)
    } else {
      helpers.trunc("Upgrade in your browser (link valid 48 hours):".grey)
    }
    helpers.space()
    helpers.trunc(("   " + reply.url).underline)
    helpers.space()
    process.exit()
  })
}
