var helpers     = require("../util/helpers")
var localCreds  = require("../util/creds.js")
var path = require("path")

module.exports = function(req, next){
  var creds = localCreds(req.endpoint).set(null)

  if (req.creds) {
    var filePath = path.join(process.env[(/^win/.test(process.platform)) ? 'USERPROFILE' : 'HOME'], ".netrc")
    helpers.trunc(("Success").green + (" - Token removed from " + filePath.underline + " file.").grey)
  } else {
    helpers.trunc("Not Authenticated.".grey)
  }

  next()

}
