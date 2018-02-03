var request     = require("request")
var localCreds  = require("./util/creds.js")
var helpers     = require("./util/helpers.js")
var os          = require('os')
var url         = require("url")
var parseUrl    = require("url-parse-as-address")

module.exports = function(req, next, abort){

  var authenticateAndSave = function(callback){
    helpers.loginForm(req, function(creds){
      req.creds = localCreds(req.endpoint).set(creds.email, creds.token)
      return callback()
    })
  }

  var accountOrAuthenticate = function(callback){
    helpers.fetchAccount(req.endpoint)(req.creds.email, req.creds.token, function(error, account){
      if (account){
        req.account = account
        return callback()
      } else {
        return authenticateAndSave(function(callback){
          return accountOrAuthenticate(callback)
        })
      }
    })
  }

  if (req.creds){
    return accountOrAuthenticate(next)  
  } else {
    return authenticateAndSave(function(){
      return next()
    })
  }

}
