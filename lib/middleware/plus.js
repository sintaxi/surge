
var helpers     = require("../util/helpers")
var parseUrl    = require("url-parse-as-address")
var surgeSDK    = require("surge-sdk")

module.exports = function(req, next, abort){

  var sdk = surgeSDK({
    endpoint: req.endpoint.format ? req.endpoint.format() : req.endpoint,
    defaults: helpers.defaults
  })

  var domain = parseUrl(req.domain).hostname
  var auth   = { user: "token", pass: req.creds.token }

  sdk.subscription(domain, auth, function(error, payload){
    if (error) return next(error)

    // stripe Plan/Price objects no longer carry a display name
    var planName = payload.plan.name || payload.plan.nickname || payload.plan.id

    var msg = "      Project requires the ".blue  + planName.yellow + " plan. ".blue + ("$" + (payload.plan.amount / 100) + "/mo").yellow + " (cancel anytime).".blue

    helpers.space()
    if (payload.hasOwnProperty("perks")) {
      helpers.log(msg += " This plan provides...".blue)
      payload.perks.forEach(function(perk){
        helpers.log(("          - " + perk).blue)
      })
    } else {
      helpers.log(msg)
    }

    helpers.payment(req, payload["stripe_pk"], payload.card)(function(token){
      var fields = { plan: payload.plan.id }
      if (token) fields.token = token

      sdk.plan(domain, fields, auth, function(errors, rsp){
        if (errors) {
          helpers.space()
          helpers.trunc("Error".red + " - troubles switching plan".grey)
          helpers.space()
        } else {
          if (token === null) helpers.space()
          helpers.space()
          helpers.trunc(rsp.msg.grey)
          helpers.space()
        }
      })
    })
  })

}
