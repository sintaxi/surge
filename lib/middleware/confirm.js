var pkg     = require('../../package.json')
var helpers = require("./util/helpers")
var prompt  = helpers.prompt

module.exports = function(req, next){

  console.log()
  console.log("      authenticated:", !!req.creds ? req.creds.email.green : "Not Found")
  console.log("            project:", req.project.green)
  console.log("             domain:", req.domain.green)
  console.log()

  prompt.get({ name: "confirm", message: "Are you sure you wish to deploy?", default: "Y/n" }, function(err, result){
    if (
      result.confirm === false ||
      result.confirm == 'no' ||
      result.confirm == 'No' ||
      result.confirm == 'NO' ||
      result.confirm == 'n'
    ){
      helpers.log()
      helpers.log("    Deployment aborted.")
      helpers.log()
      process.exit(1)
    }
    return next()
  })

}

