
var helpers  = require("../util/helpers")
var surgeSDK = require("surge-sdk")

module.exports = function(req, next){

  var sdk = surgeSDK({
    endpoint: req.endpoint.format(),
    defaults: helpers.defaults
  })

  var domain = req["argv"]["_"][0]

  sdk.rollfore(domain, { user: "token", pass: req.creds.token }, function(error, response){
    if (error){
      helpers.space()
      helpers.log("   " + "Error".red + (" - " + error.messages.join(", ")).grey)
      helpers.space()
    }else{
      var success = response.status && response.status == 201
      helpers.space()
      if (success){
        helpers.log("   ⟳ Forward".green)
        helpers.displayRevisionBasicInfo(response.revision, domain)
        helpers.displayRegions(response)
        helpers.log("   Done!".green + (" - " + domain.underline + " now serving revision " + response.revision.preview.underline).grey)
      }else{
        helpers.log("   ⟳ Forward (failed)".yellow)
        helpers.displayRevisionBasicInfo(response.revision, req["argv"]["_"][0])
        helpers.log("   Unchanged".yellow + (" - " + domain.underline + " already serving " + response.revision.preview.underline).grey)
      }
      return next()
    }
  })
  
}