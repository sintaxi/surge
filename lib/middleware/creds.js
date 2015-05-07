var path        = require("path")
var fs          = require("fs")
var netrc       = require("netrc")
var localCreds  = require("./util/creds.js")
var helpers     = require("./util/helpers.js")

module.exports = function(req, next){
  req.creds = localCreds(req.argv.endpoint).get()

  if (req.creds == null && req.argv["_"].length === 0) {
    helpers
      .log("    Welcome to " + "Surge".bold + "!")
      .log("    Please login or create an account by entering your email and password:")
      .hr()
  }

  next()
}
