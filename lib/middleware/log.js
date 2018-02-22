var helpers = require("./util/helpers")

module.exports = function(req, next){
  helpers.show()
  return next()
}