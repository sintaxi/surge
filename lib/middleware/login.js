var path = require("path")
var helpers = require("../util/helpers")

module.exports = function(req, next){
  helpers.log()
  helpers.trunc( "Success".green + (" - Logged in as " + req.creds.email.underline + ".").grey)
  next()

  //helpers.log("              token: ".grey + req.creds.token)

}
