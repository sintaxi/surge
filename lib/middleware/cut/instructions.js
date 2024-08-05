
var helpers     = require("../util/helpers")

module.exports = function(req, next){
  helpers.trunc("cut instructions")
  return next()
}
