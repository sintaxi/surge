var path        = require("path")
var fs          = require("fs")
var netrc       = require("netrc")
var localCreds  = require("./util/creds.js")
var helpers     = require("./util/helpers.js")

module.exports = function(req, next){
  req.creds = localCreds(req.argv.endpoint || req.config.endpoint || "surge." + req.config.platform).get()
  next()
}
