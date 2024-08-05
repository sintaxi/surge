
var helpers      = require("../util/helpers")
var surgeSDK     = require("surge-sdk")

module.exports = function(req, next){

  var sdk = surgeSDK({
    endpoint: req.endpoint.format(),
    defaults: helpers.defaults
  })

  var domain  = req.argv["_"][0]
  var rev     = req.argv["_"][1] || null
  
  sdk.audit(domain, { user: "token", pass: req.creds.token }, function(error, response){
    helpers.space()
    if (!response){
      if (!domain){
        helpers.trunc("domain required".grey)
      } 
      return next()
    } else {
      helpers.displayAudit(response)
      return next()
    }
  })
  
}