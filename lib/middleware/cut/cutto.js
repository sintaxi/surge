
var helpers = require("../../util/helpers")

module.exports = function(req, next){
  helpers.space()
  return helpers.cutto(req.argv["_"][0], req.argv["_"][1], next)
}
