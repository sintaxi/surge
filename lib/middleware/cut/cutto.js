
var helpers     = require("../util/helpers")

module.exports = function(req, next){
  helpers.trunc("cut cutto " + req.argv["_"][1])

  return next()
}
