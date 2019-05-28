var path        = require("path")
var fs          = require("fs")
var netrc       = require("netrc")
var localCreds  = require("./util/creds.js")
var helpers     = require("./util/helpers.js")

module.exports = function(req, next){
  req.passintoken = req.argv.token || process.env['SURGE_TOKEN'] || process.env['TRAVIS_SURGE_TOKEN'] || null

  if (req.passintoken){
    req.creds = { email: "token", token: req.passintoken }
  } else {
    req.creds = localCreds(req.endpoint).get()  
  }

  next()
}
