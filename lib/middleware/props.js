var helpers = require("../util/helpers.js")
var surgeSDK = require("surge-sdk")

module.exports = function(req, next){

  var sdk = surgeSDK({
    endpoint: req.endpoint.format(),
    defaults: helpers.defaults
  })

  var domain = req.argv["_"][0]

  sdk.props(domain, req.argv, { user: "token", pass: req.creds.token }, function(error, rsp){
    if (error) {
      helpers.space()
      process.exit(1)
    } else {
      console.log(rsp)
      return next()
    }
  })

}