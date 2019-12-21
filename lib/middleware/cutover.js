
var helpers = require("../util/helpers")
var cutto = require("./cut/cutto")
var interactive  = require("./cut/interactive.js")

module.exports = function(req, next){
  
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
    return helpers.cutto(req.argv["_"][0], req.argv["_"][1], next)
  }
  
}