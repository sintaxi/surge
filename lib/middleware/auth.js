var request     = require("request")
var localCreds  = require("./util/creds.js")
var helpers     = require("./util/helpers.js")
var os          = require('os')
var url         = require("url")
var parseUrl    = require("url-parse-as-address")

module.exports = function(req, next, abort){

  var authenticateAndSave = function(callback){
    if (req.creds){
      helpers.space()  
    }
    helpers.trunc("Login (or create surge account) by entering email & password.".grey)
    helpers.space()
    helpers.loginForm(req, function(creds){
      localCreds(req.endpoint).set(creds.email, creds.token)
      req.creds = creds
      return accountOrAuthenticate(callback)
    })
  }

  var accountOrAuthenticate = function(callback){
    helpers.fetchAccount(req.endpoint)(req.creds.email, req.creds.token, function(error, account){
      if (account){
        req.account = account
        return callback()
      } else {
        if (req.passintoken){
          helpers.space()
          helpers.trunc("Invalid token")
          helpers.space()
          process.exit(1)
        } else {
          return authenticateAndSave(callback)  
        }
      }
    })
  }

  if (req.creds){
    return accountOrAuthenticate(next)  
  } else {
    return authenticateAndSave(next)
  }

}
