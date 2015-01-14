var path        = require("path")
var fs          = require("fs")
var netrc       = require("netrc")
var localCreds  = require("./util/creds.js")

module.exports = function(req, next){
  req.creds = localCreds(req.argv.endpoint).get()

  if (req.creds == null) {
    console.log("TODO: No such token Message")
  }

  next()
}
