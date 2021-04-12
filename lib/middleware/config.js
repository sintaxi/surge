var helpers = require("../util/helpers.js")
var surgeSDK = require("surge-sdk")

module.exports = function(req, next){

  var sdk = surgeSDK({
    endpoint: req.endpoint.format(),
    defaults: helpers.defaults
  })

  var domain = req.argv["_"][0]

  if (!domain) {
    helpers.space()
    helpers.trunc("Error".red + (" - domain required".grey))
    return next()
  }
  
  sdk.settings(domain, req.argv, { user: "token", pass: req.creds.token }, function(error, rsp){
    if (error) {
      helpers.space()
      if (error.hasOwnProperty("message")){
        helpers.trunc("Error".red + (" - " + error.message).grey)
      }else{
        error.messages.forEach(function(m){
          helpers.trunc("Error".red + (" - " + m).grey)
        })
      }
      helpers.space()  
      process.exit(1)
    } else {
      helpers.displayConfig(rsp)
      return next()
    }
  })

}