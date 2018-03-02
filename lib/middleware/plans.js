
var request     = require("request")
var url         = require("url")
var helpers     = require("./util/helpers")
var path        = require("path")
var fs          = require("fs")
var os          = require("os")
var parseUrl    = require("url-parse-as-address")

module.exports = function(req, next, abort){
  
  var plansUrl = req.domain
    ? url.resolve(req.endpoint, path.join(req.domain, "plans"))
    : url.resolve(req.endpoint, "plans")

  var headers = {}
  if (req.argv.promo) headers.promo = req.argv.promo

  var options = {
    'url': plansUrl,
    'method': 'get',
    'headers': headers,
    'auth': {
      'user': "token",
      'pass': req.creds.token,
      'sendImmediately': true
    }
  }

  request(options, function(e, r, obj){
    if (r.statusCode == 200){
      req.plans = JSON.parse(obj)
    } 
    return next()
  })

}
