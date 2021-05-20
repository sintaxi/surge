
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
      helpers.trunc("Error".red + (" - " + error.messages.join(", ")).grey)
      helpers.space()
    }else{
      if (response.revision && response.former && (response.revision.rev !== response.former.rev)){
        var success = true
      }
      helpers.space()
      if (success){
        helpers.trunc("⟳ Forward".green)
        //helpers.displayRevisionBasicInfo(response.revision, domain)
        helpers.displayRollforeInfo(response, domain)
        helpers.displayServers(response.instances)
        helpers.trunc("Done!".green + (" - " + domain.underline + " now serving revision " + response.revision.preview.underline).grey)
      }else{
        helpers.trunc("⟳ Forward (redundant)".yellow)
        helpers.displayRevisionBasicInfo(response.revision, req["argv"]["_"][0])
        helpers.displayServers(response.instances)
        helpers.trunc("Unchanged".yellow + (" - " + domain.underline + " already serving " + response.revision.preview.underline).grey)
      }
      return next()
    }
  })
  
}