var path = require("path")
var helpers = require("../util/helpers")

module.exports = function(req, next){
  //console.log(req.authed)
  helpers.space()
  helpers.trunc(req.creds.token.grey)
  next()
}