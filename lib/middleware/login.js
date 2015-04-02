var path = require("path")

module.exports = function(req, next){
  if (req.argv.hasOwnProperty("_") && req.argv["_"]["0"] === "login") {
    var filePath = path.join(process.env[(/^win/.test(process.platform)) ? 'USERPROFILE' : 'HOME'], ".netrc")
    console.log("    Logged in as " + req.creds.email.green + ".")
    //console.log("Your access token stored in " + filePath.grey + " file")
    console.log()
    process.exit()
  } else {
    next()
  }
}
