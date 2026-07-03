
var helpers      = require("../util/helpers")
var surgeSDK     = require("surge-sdk")

module.exports = function(req, next){

  var sdk = surgeSDK({
    endpoint: req.endpoint.format(),
    defaults: helpers.defaults
  })

  var domain  = req.argv["_"][0]
  var rev     = req.argv["_"][1] || null

  helpers.space()
  sdk.bust(domain, { user: "token", pass: req.creds.token }, function(error, response){
    // response.confirmed = ["sfo-11", "jfk-08", "ams-14"]
    // response.unconfirmed = ["yyz-16"]
    if (error){
      return next(error)
    }else{
      var success = response.status && response.status == 200
      helpers.space()
      if (success){
        helpers.trunc("⦿ Busting cache".green + " " + domain.underline.grey)
        helpers.displayServers(response.instances)
      }else{
        helpers.trunc("⦿ Bust".yellow + " " + domain.grey)
        helpers.displayServers(response.instances)
        helpers.trunc("Cache not Busted".yellow)
      }
      return next()
    }
  })

}
