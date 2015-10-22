var request     = require("request")
var localCreds  = require("./util/creds.js")
var helpers     = require("./util/helpers.js")
var os          = require('os')
var url         = require("url")
var parseUrl    = require("url-parse-as-address")

module.exports = function(req, next){
  if (req.creds) {
    req.authed = true
    next()
    // helpers.fetchToken(req.argv.endpoint)("token", req.creds.token, function(err, obj){
    //   if (err) {
    //     localCreds(req.argv.endpoint).set(null)
    //     req.creds  = null
    //     req.authed = false
    //     next()
    //     //auth(req, next)
    //   } else {
    //     req.creds  = localCreds(req.argv.endpoint).set(obj.email, obj.token)
    //     req.authed = true
    //     next()
    //   }
    // })
  } else {
    next()
  }

}
