var helpers     = require("./util/helpers")
var localCreds  = require("./util/creds.js")
var path = require("path")

module.exports = function(req, next){
  var creds = localCreds(req.argv.endpoint || req.config.endpoint || 'surge.' + req.config.platform).set(null)

  if (req.creds) {
    var filePath = path.join(process.env[(/^win/.test(process.platform)) ? 'USERPROFILE' : 'HOME'], ".netrc")
    helpers.log("    Token removed from " + filePath.grey + " file.")
  } else {
    helpers.log("    Not currently authenticated.")
  }

  next()

}
