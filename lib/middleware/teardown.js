
var url         = require("url")
var helpers     = require("../util/helpers")
var path        = require("path")
var fs          = require("fs")
var os          = require("os")
var parseUrl    = require("url-parse-as-address")
var surgeSDK    = require("surge-sdk")

module.exports = function(req, next, abort){

  var sdk = surgeSDK({
    endpoint: req.endpoint.format(),
    defaults: helpers.defaults
  })

  var remove = function(domain){
    sdk.teardown(domain, { user: "token", pass: req.creds.token }, function(error, info){
      if (error) {
        helpers.space()
        helpers.trunc("Aborted".yellow + (" - Unable to remove " + domain.underline + ".").grey)
        helpers.space()
        process.exit(1)
      } else {
        helpers.space()
        helpers.trunc("Success".green + (" - " + domain.underline + " has been removed.").grey)
        helpers.space()
        process.exit()
      }
    })
  }

  return remove(parseUrl(req.domain).host)

}
