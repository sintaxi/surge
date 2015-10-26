var path = require("path")
var helpers = require("./util/helpers")

module.exports = function(req, next){
  helpers.log()
  helpers.log("    Logged in as " + req.creds.email.green + ".")
  next()

  //helpers.log("              token: ".grey + req.creds.token)

}
