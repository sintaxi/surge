
var helpers      = require("../util/helpers")
var surgeSDK     = require("surge-sdk")

module.exports = function(req, next){

  var sdk = surgeSDK({
    endpoint: req.endpoint.format(),
    defaults: helpers.defaults
  })

  var domain  = req.argv["_"][0]
  var rev     = req.argv["_"][1] || null
  
  if (req.argv.i){
    // helpers.revisionSelector(req, function(errors, answers){
    //   if (!answers) return next()
    //   if (answers.revision.current){
    //     helpers.trunc("No change".green + " - Selected revision is already current".grey )
    //     return next()
    //   } else {
    //     return helpers.cutto(req.argv["_"][0], answers.revision.rev, next)
    //   }
    // })
  } else {
    helpers.space()
    sdk.bust(domain, { user: "token", pass: req.creds.token }, function(error, response){
      // response.confirmed = ["sfo-11", "jfk-08", "ams-14"]
      // response.unconfirmed = ["yyz-16"]
      //console.log(error, response)
      if (error){
        helpers.space()
        helpers.trunc("Error".red + (" - " + error.messages.join(", ")).grey)
        helpers.space()
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
  
}