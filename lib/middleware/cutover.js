
var helpers = require("../util/helpers")
var cutto = require("./cut/cutto")

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
        helpers.trunc("Error".red + (" - " + error.messages.join(", ")).grey)
        helpers.space()
      }else{
        var success = response.status && response.status == 201
        helpers.space()
        if (success){
          helpers.trunc("⤮ Cutover".green)
          helpers.displayRevisionBasicInfo(response.revision, response.domain)
          helpers.displayServers(response.instances)
          helpers.trunc("Done".green + (" - " + domain.underline + " now serving revision " + response.revision.preview.underline).grey)
        }else{
          helpers.trunc("⤮ Cutover".yellow)
          helpers.displayRevisionBasicInfo(response.revision, response.domain)
          helpers.trunc("Unchanged".yellow + (" - already serving " + response.revision.preview.underline).grey)
        }
        return next()
      }
    })
  }
  
}