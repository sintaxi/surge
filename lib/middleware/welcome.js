var helpers     = require("./util/helpers.js")

module.exports = function(req, next){
  if (req.creds == null) {
    helpers.trunc(("Welcome to " + (req.config.name || "Surge").underline + "!").blue + (" (" + req.config.platform +")").grey)
    if (req.config.name) {
      helpers.trunc("Powered by Surge".grey).hr()
    }
    helpers.trunc("Login (or create surge account) by entering email & password.".grey).hr()
  } else {
    if(req.config.name){
      helpers.trunc("" + req.config.name.bold + "("+ req.config.platform +") - " + (req.config.platform || "surge.sh"))
      helpers.trunc("Powered by Surge".grey)
    } else {
      helpers.trunc(("Running as " + req.creds.email.underline).grey)
      //helpers.log("    Surge (surge.sh)".grey + (" - as " + req.creds.email.underline).grey)
    }
    helpers.hr()
  }
  next()
}