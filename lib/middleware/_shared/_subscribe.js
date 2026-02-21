
var surgeSDK    = require("surge-sdk")
var helpers     = require("../../util/helpers")

module.exports = function(req, next, abort){

  var sdk = surgeSDK({
    endpoint: req.endpoint.format ? req.endpoint.format() : req.endpoint,
    defaults: helpers.defaults
  })

  var fields = {
    plan: req.selectedPlan.id
  }

  if (req.paymentToken){
    fields.token = req.paymentToken
  }

  if (req.domain) {
    fields.domain = req.domain
  }

  sdk.plan(fields, { user: 'token', pass: req.creds.token }, function(error, result){
    if (error) {
      helpers.space()
      helpers.trunc(("Error: " + (error.status || "unknown")).red)
      helpers.space()
    } else {
      helpers.space()
      helpers.trunc("Success".green + (" - " + result.msg).grey)
      helpers.space()
    }
  })

}
