var path = require("path")

module.exports = function(req, next){
  if (req.argv.hasOwnProperty("_") && req.argv["_"]["0"] === "login") {
    console.log()
    console.log("    Logged in as " + req.creds.email + ".\n    Your access token stored in " + path.join(process.env[(/^win/.test(process.platform)) ? 'USERPROFILE' : 'HOME'], ".netrc") + " file")
    console.log()
    process.exit()
  } else {
    next()
  }
}
