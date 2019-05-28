var helpers     = require("./util/helpers.js")

module.exports = function(req, next){

  if (req.creds == null) {
    helpers.trunc(("Welcome to " + (req.config.name || "Surge").underline + "!").blue + (" (" + req.config.platform +")").grey)
  }

  return next()
}