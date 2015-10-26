var path = require("path")
var helpers = require("./util/helpers")

module.exports = function(req, next){
  helpers.log("              token: ".grey + req.creds.token)
  next()
}