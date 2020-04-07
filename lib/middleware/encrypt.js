
var helpers = require("../util/helpers.js")
var surgeSDK = require("surge-sdk")

module.exports = function(req, next){

  var sdk = surgeSDK({
    endpoint: req.endpoint.format(),
    defaults: helpers.defaults
  })

  helpers.log("ENCRYPT:", req.argv)
  helpers.log({ user: "token", pass: req.creds.token })

  sdk.encrypt(req.domain, { user: "token", pass: req.creds.token }, function(error, rsp){
    return next()
  })
  
}