
var request     = require("request")
var url         = require("url")
var helpers     = require("./util/helpers")
var path        = require("path")
var fs          = require("fs")
var os          = require("os")
var parseUrl    = require("url-parse-as-address")

module.exports = function(req, next, abort){
  
  var options = {
    'url': url.resolve(req.endpoint, "plans"),
    'method': 'get',
    'auth': {
      'user': "token",
      'pass': req.creds.token,
      'sendImmediately': true
    }
  }

  request(options, function(e, r, obj){
    //console.log("PLANS", JSON.parse(obj))
    if (r.statusCode == 200) req.plans = JSON.parse(obj)  
    return next()
  })

}
