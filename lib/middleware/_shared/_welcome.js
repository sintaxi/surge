var helpers     = require("../../util/helpers.js")

module.exports = function(req, next){

  if (req.creds == null) {
    helpers.space()
    helpers.trunc(("Welcome to " + (req.configuration.name || "Surge").underline + "!").blue + (" (" + req.configuration.platform +")").grey)
  }

  return next()
}