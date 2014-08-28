var prompt      = require("./util/prompt")
var pkg     = require('../../package.json')

module.exports = function(req, next){
  console.log()
  console.log("  Surge pre-flight...")
  console.log()
  console.log("      authenticated:".white, !!req.creds ? req.creds.email.green : "Not Found")
  console.log("       project path:".white, req.argv.project.green)
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
      console.log("Deployment aborted.")
      console.log()
      process.exit()
    }
    return next()
  })

}

