var request     = require("request")
var localCreds  = require("./util/creds.js")
var helpers     = require("./util/helpers.js")
var prompt      = helpers.prompt
var os          = require('os')
var url         = require("url")
var parseUrl    = require("url-parse-as-address")
var read = require("read")

module.exports = function(req, next){
  var label = "           password:".grey

  var auth = function(req, next){
    read({
      prompt: label,
      silent: true,
      output: process.stdout
    }, function(err, answer){
      if (answer === undefined) throw new Error('Abort')
      helpers.fetchToken(req.argv.endpoint)(req.email, answer, function(err, obj){
        if (err) {
          helpers.log("            invalid:".yellow, err["messages"].join(". ").grey)
          if (err.hasOwnProperty("details") && err["details"].hasOwnProperty("email")) process.exit(1)
          auth(req, next)
        } else {
          req.creds = localCreds(req.argv.endpoint).set(obj.email, obj.token)
          next()
        }
      })
    })
  }

  if (req.authed) {
    console.log("        token found:".grey, "*****************".grey)
    next()
  } else {
    auth(req, next)
  }

}
