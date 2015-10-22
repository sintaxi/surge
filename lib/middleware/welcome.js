var helpers     = require("./util/helpers.js")

module.exports = function(req, next){
  if (req.creds == null) {
    helpers.log("    Welcome to " + (req.config.name || "Surge").bold + "! (" + req.config.platform +")" )
    if (req.config.name) {
      helpers.log("    Powered by Surge".grey).hr()
    }
    helpers.log("    Please login or create an account by entering your email and password:").hr()
  } else {
    if(req.config.name){
      helpers.log("    " + req.config.name.bold + " - " + (req.config.platform || "surge.sh"))
      helpers.log("    Powered by Surge".grey)
    } else {
      helpers.log("    Surge".bold + " - surge.sh")
    }
    helpers.hr()
  }
  next()
}