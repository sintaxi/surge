var pkg     = require('../../package.json')
var helpers = require("./util/helpers")
var prompt  = helpers.prompt

module.exports = function(req, next){

  console.log()
  console.log("      authenticated:".white, !!req.creds ? req.creds.email.green : "Not Found")
  console.log("            project:".white, req.project.green)
  console.log("             domain:".white, req.domain.green)
  console.log()

  prompt.get({ name: "confirm", message: "Are you sure you wish to deploy?".white, default: "Y/n" }, function(err, result){
    if (
      result.confirm === false ||
      result.confirm == 'no' ||
      result.confirm == 'No' ||
      result.confirm == 'NO' ||
      result.confirm == 'n'
    ){
      helpers.log("Deployment aborted.")
      process.exit(1)
    }
    return next()
  })

}

