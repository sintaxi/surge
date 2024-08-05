
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
    helpers.revisionSelector(req, function(errors, answers){
      if (!answers) return next()

      if (answers.revision.current){
        helpers.trunc("No change".green + " - Selected revision is already current".grey )
        return next()
      } else {
        return helpers.cutto(req.argv["_"][0], answers.revision.rev, next)
      }

    })
  } else {
    helpers.space()
    sdk.discard(domain, rev, { user: "token", pass: req.creds.token }, function(error, response){
      if (error){
        helpers.space()
        helpers.log("   " + "Error".red + (" - " + error.messages.join(", ")).grey)
        helpers.space()
      }else{
        if (response){
          // display discard information
          helpers.space()
          helpers.log("   ✂ Discarded".green + (" " + response.revision.preview.underline).grey)
          helpers.space()
          
          // display change
          if (response.uncached.change){
            helpers.space()
            if (response.uncached.change == "rollfore"){
              helpers.log("   ⟳ Rollfore".green)
              helpers.displayRevisionBasicInfo(response.revision, response.domain)
            } else if (response.uncached.change == "rollback"){
              helpers.log("   ⟲ Rollback".green)
              helpers.displayRevisionBasicInfo(response.revision, response.domain)
            } else if (response.uncached.change == "offline"){
              helpers.log("   ⤫ Offline".green)
            } 
            helpers.space()
          }

          // display regions
          helpers.space()
          //helpers.displayRegions(response)
          helpers.displayServers(response.instances)
          helpers.space()

          if (response.uncached.change){
            helpers.space()
            if (response.uncached.change == "rollfore"){
              helpers.log("   Done".green + (" - " + response.domain.underline + " rolled forward to revision " + response.revision.preview.underline).grey)
            } else if (response.uncached.change == "rollback"){
              helpers.log("   Done".green + (" - " + response.domain.underline + " rolled back to revision " + response.revision.preview.underline).grey)
            } else if (response.uncached.change == "offline"){
              helpers.log("   Done".green + (" - No revisions to serve. Project now offline.").grey)
            } 
            helpers.space()
          } else {
            helpers.log("   Done".green + (" - " + response.domain.underline + " still serving " + response.revision.preview.underline).grey)
          }

        }else{
          helpers.space()
          helpers.log("   Unchanged".yellow + (" - No revisions discarded.").grey)
          helpers.space()
        }
        return next()
      }
    })
  }
  
}