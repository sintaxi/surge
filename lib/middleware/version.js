var pkg = require("../../package.json")
var helpers = require("./util/helpers.js")

module.exports = function(req, next){
  if (req.argv.version || req.argv.V) {
    helpers.space()
    helpers.trunc(("v" + pkg.version).grey)
    helpers.space()
  } else {
    next()
  }
}
