var helpers     = require("./util/helpers")
var localCreds  = require("./util/creds.js")

module.exports = function(req, next){
  if (req.argv["_"] && req.argv["_"]["0"] === "logout") {
    var creds = localCreds(req.argv.endpoint).set(null)
    helpers.log()
    helpers.log("       Token removed from ~/.netrc file")
    helpers.log()
    process.exit()
  } else {
    next()
  }
}