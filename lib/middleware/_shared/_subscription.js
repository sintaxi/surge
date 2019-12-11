
var request     = require("request")
var url         = require("url")
var helpers     = require("../../util/helpers")
var path        = require("path")
var fs          = require("fs")
var os          = require("os")
var parseUrl    = require("url-parse-as-address")

module.exports = function(req, next, abort){

  var subscribeUrl = req.domain
    ? url.resolve(req.endpoint, path.join(req.domain, "plan"))
    : url.resolve(req.endpoint, "plan")

  var options = {
    'url': subscribeUrl,
    'method': 'get',
    'auth': {
      'user': "token",
      'pass': req.creds.token,
      'sendImmediately': true
    }
  }

  request(options, function(e, r, obj){
    //console.log("SUBSCRIPTION", JSON.parse(obj))
    if (r.statusCode == 200){
      var obj = JSON.parse(obj)
      req.card = obj.card
      req.subscription = obj.subscription
      req.stripe_pk = obj.stripe_pk
    } else {
      console.log(obj)
    }
    return next()
  })

}
