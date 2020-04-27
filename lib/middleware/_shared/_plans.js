
var url         = require("url")
var helpers     = require("../../util/helpers")
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

  var headers = {}
  if (req.argv.promo) headers.promo = req.argv.promo
  
  sdk.plans(req.domain, headers, { user: "token", pass: req.creds.token }, function(error, plans){
    req.plans = plans  
    return next()
  })

}
