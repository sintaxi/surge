
var url         = require("url")
var helpers     = require("../../util/helpers")
var surgeSDK    = require("surge-sdk")

module.exports = function(req, next, abort){

  var sdk = surgeSDK({
    endpoint: req.endpoint.format(),
    defaults: helpers.defaults
  })

  if (!req.paymentToken){
    helpers.log()
    if (req.card){
      helpers.trunc("Success".green + " - Using existing card.".grey)
    } else {
      helpers.trunc("Aborted".yellow + " - No card set.".grey)
    }
    helpers.space()
  } else {

    var fields = {}

    if (req.paymentToken){
      fields.token = req.paymentToken
    }

    sdk.card(fields, { user: "token", pass: req.creds.token }, function(error, obj){
      if (error){
        helpers.space()
        helpers.trunc("Error ".red + " - " + (obj.message || obj.msg).grey)
        helpers.space()
        process.exit(1)
      }else{
        helpers.space()
        helpers.trunc(("Success".green + " - ".grey + obj.msg.grey))
        helpers.space()
        process.exit()
      }
    })
  }
}
