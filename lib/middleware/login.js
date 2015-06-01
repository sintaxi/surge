var path = require("path")
var helpers = require("./util/helpers")

module.exports = function(req, next){
  if (req.argv.hasOwnProperty("_") && (req.argv["_"]["0"] === "login" || req.argv["_"]["0"] === "token")) {
    var filePath = path.join(process.env[(/^win/.test(process.platform)) ? 'USERPROFILE' : 'HOME'], ".netrc")
    if (req.argv["_"]["0"] === "login") {
      helpers.log()
      helpers.log("    Logged in as " + req.creds.email.green + ".")
    } else if(req.argv["_"]["0"] === "token") {
      helpers.log("              token: ".grey + req.creds.token)
    }
    //helpers.log("Your access token stored in " + filePath.grey + " file")
    helpers.log()
    process.exit()
  } else {
    next()
  }
}
