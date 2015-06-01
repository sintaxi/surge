var helpers     = require("./util/helpers")
var localCreds  = require("./util/creds.js")
var path = require("path")

module.exports = function(req, next){
  if (req.argv["_"] &&  ["logout", "login", "token"].indexOf(req.argv["_"]["0"]) !== -1) {

    var creds = localCreds(req.argv.endpoint).set(null)
    if (req.argv["_"]["0"] == "login" || req.argv["_"]["0"] == "token") {
      delete req.creds
      helpers.log("    Login or create and account by entering an email/password.")
      helpers.log()
      next()
    } else {
      var filePath = path.join(process.env[(/^win/.test(process.platform)) ? 'USERPROFILE' : 'HOME'], ".netrc")
      helpers.log("    Token removed from " + filePath.grey + " file.")
      helpers.log()
      process.exit()
    }

  } else {
    next()
  }
}
