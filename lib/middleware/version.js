var pkg = require("../../package.json")

module.exports = function(req, next){
  if (req.argv.version || req.argv.V) {
    console.log(pkg.version)
  } else {
    next()
  }
}
