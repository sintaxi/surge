var helpers     = require("./util/helpers")
var localCreds  = require("./util/creds.js")
var path = require("path")

module.exports = function(req, next){
  if (req.argv["_"] && req.argv["_"]["0"] === "logout") {
    var creds = localCreds(req.argv.endpoint).set(null)
    helpers.log("     Token removed from " + path.join(process.env.HOME || process.env.HOMEPATH, ".netrc") + " file")
    helpers.log()
    process.exit()
  } else {
    next()
  }
}