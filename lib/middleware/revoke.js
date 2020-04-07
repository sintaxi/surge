
var helpers = require("../util/helpers.js")
var surgeSDK = require("surge-sdk")

module.exports = function(req, next){

  var sdk = surgeSDK({
    endpoint: req.endpoint.format(),
    defaults: helpers.defaults
  })

  helpers.log("REVOKE:", req.argv)
  helpers.log({ user: "token", pass: req.creds.token })

  sdk.revoke(req.argv["_"], { user: "token", pass: req.creds.token }, function(error, rsp){
    if (error) {
      helpers.space()
      process.exit(1)
    } else {
      return next()
    }
  })

}
