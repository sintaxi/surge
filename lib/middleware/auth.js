var request     = require("request")
var localCreds  = require("./util/creds.js")
var helpers     = require("./util/helpers.js")
var os          = require('os')
var url         = require("url")
var parseUrl    = require("url-parse-as-address")
var read        = require("read")

module.exports = function(req, next, abort){

  var label = "           password:".grey

  var auth = function(){
    read({
      prompt: label,
      silent: true,
      edit: false
    }, function(err, password){
      if (password === undefined) return abort()
      helpers.fetchToken(req.argv.endpoint)(req.email, password, function(err, obj){
        if (err) {

          //helpers.log().log("    Invalid".yellow, "-".grey, err["messages"].join(". ").grey).log()

          if (err.hasOwnProperty("details") && err["details"].hasOwnProperty("email")) process.exit(1)
          return auth()
        } else {
          req.creds = localCreds(req.argv.endpoint).set(obj.email, obj.token)
          return next()
        }
      })
    })
  }

  if (req.authed) {
    console.log("              token:".grey, "*****************".grey)
    return next()
  } else {
    return auth()
  }

}
