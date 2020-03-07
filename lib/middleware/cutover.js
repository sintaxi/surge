
var helpers = require("../util/helpers")
var cutto = require("./cut/cutto")
var interactive  = require("./cut/interactive.js")

var surgeSDK = require("surge-sdk")

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
    sdk.cutover(domain, rev, { user: "token", pass: req.creds.token }, function(error, response){
      if (error){
        helpers.space()
        helpers.log("   " + "Error".red + (" - " + error.messages.join(", ")).grey)
        helpers.space()
      }else{
        var success = response.status && response.status == 201
        helpers.space()
        if (success){
          helpers.log("   ⤮ Cutover".green)
          helpers.displayRevisionBasicInfo(response.revision, response.domain)
          helpers.displayRegions(response)
          helpers.log("   Done".green + (" - " + domain.underline + " now serving revision " + [response.revision.rev, response.domain].join(".").underline).grey)
        }else{
          helpers.log("   ⤮ Cutover".yellow)
          helpers.displayRevisionBasicInfo(response.revision, response.domain)
          helpers.log("   Unchanged".yellow + (" - " + domain.underline + " already serving " + [response.revision.rev, response.domain].join(".").underline).grey)
        }
        return next()
      }
    })
  }
  
}