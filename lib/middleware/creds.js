var path        = require("path")
var fs          = require("fs")
var netrc       = require("netrc")
var localCreds  = require("./util/creds.js")
var helpers     = require("./util/helpers.js")

module.exports = function(req, next){
  req.creds = localCreds(req.argv.endpoint).get()

  if (req.creds == null) {
    helpers
      .log("")
      .log("              Welcome to " + "Surge".bold + "!")
      .log("")
      .log("              We just need a couple of details")
      .log("              to deploy your project.")
      .hr()
  }

  next()
}
