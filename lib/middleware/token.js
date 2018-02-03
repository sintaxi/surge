var path = require("path")
var helpers = require("./util/helpers")

module.exports = function(req, next){
  //console.log(req.authed)
  console.log()
  helpers.trunc(req.creds.token.grey)
  next()
}