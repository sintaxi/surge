var helpers     = require("./util/helpers.js")

module.exports = function(req, next){
  if (req.creds == null) {
    helpers.log("    Welcome to " + "Surge".bold + "! (" + req.config.platform +")" )
    helpers.log("    Please login or create an account by entering your email and password:").hr()
  } else {
    helpers.log("    Welcome to " + "Surge".bold + "! (" + req.config.platform +")" )
    helpers.hr()
  }
  next()
}