var helpers = require("../util/helpers")
var surgeSDK = require("surge-sdk")

module.exports = function(req, next){

  var sdk = surgeSDK({
    endpoint: req.endpoint.format(),
    defaults: helpers.defaults
  })

  sdk.status(req.domain, { user: "token", pass: req.creds.token }, function(error, reply){
    if (error) return next(error)
    helpers.space()

    if (reply.status === "live"){
      var scheme = reply.https ? "https://" : "http://"
      helpers.trunc((req.domain).underline + " is " + "live".green + (" - " + scheme + req.domain).grey)
      return next()
    }

    if (reply.status === "securing"){
      helpers.trunc((req.domain).underline + " is " + "securing".yellow + " - provisioning the certificate. No action needed.".grey)
      return next()
    }

    // waiting on dns — the one action there ever is
    helpers.trunc((req.domain).underline + " is " + "waiting on dns".yellow + " - point your DNS at surge:".grey)
    helpers.space()
    helpers.trunc(("  CNAME     " + reply.records.cname).grey)
    helpers.trunc(("  A (apex)  " + reply.records.a.join(", ")).grey)
    return next()
  })

}
