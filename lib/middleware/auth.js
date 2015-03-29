var request     = require("request")
var localCreds  = require("./util/creds.js")
var helpers     = require("./util/helpers.js")
var prompt      = helpers.prompt
var os          = require('os')
var url         = require("url")
var parseUrl    = require("url-parse-as-address")

module.exports = function(req, next){

  var auth = function(req, next){
    // TODO: check that the creds are good
    // if (req.creds) return next()
    // helpers.log("please authenticate or signup by providing email and password".green)

    prompt.start()

    var schema = {
      properties: {
        password: {
          description: "           password:",
          required: true,
          hidden: true
        }
      }
    }

    if (req.authed) {
      next()
    } else {
      prompt.get(schema, function (err, result) {
        helpers.fetchToken(req.argv.endpoint)(req.email, result.password, function(err, obj){
          if (err) {
            console.log()
            helpers.log("    Error".yellow, "-", err["messages"].join(". "))
            console.log()
            if (err["details"]["email"]) process.exit(1)
            auth(req, next)
          } else {
            req.creds = localCreds(req.argv.endpoint).set(obj.email, obj.token)
            next()
          }
        })
      })
    }

  }

  auth(req, next)

}
