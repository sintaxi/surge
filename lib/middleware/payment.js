
var request     = require("request")
var url         = require("url")
var helpers     = require("./util/helpers")
var path        = require("path")
var fs          = require("fs")
var os          = require("os")
var parseUrl    = require("url-parse-as-address")

module.exports = function(req, next, abort){

  var subscriptionUrl = url.resolve(req.endpoint, "subscription")

  var collect = function(){

    request({
      'url': subscriptionUrl,
      'method': 'get',
      'auth': {
        'user': "token",
        'pass': req.creds.token,
        'sendImmediately': true
      }
    }, function(e, r, obj){
      if (e) throw e
      var subscription = JSON.parse(obj)

      helpers.payment(req, subscription["stripe_pk"], subscription.card || null)(function(token){
        request({
          uri: subscriptionUrl,
          method: "PUT",
          auth: {
            'user': 'token',
            'pass': req.creds.token,
            'sendImmediately': true
          },
          form: {
            plan: subscription.plan,
            token: token
          }
        }, function(e,r,b){
          if (r.statusCode == 201) {
            if (token === null) console.log()
            var sub = JSON.parse(b)
            console.log()
            console.log(("      You are now upgraded to " + sub.plan.name + "!").green)
            console.log()
          } else if (r.statusCode == 200) {
            var sub = JSON.parse(b)
            console.log()
            console.log(("      No charge created. You are already upgraded to " + sub.plan.name + "!").green)
            console.log()
          } else {
            console.log(r.statusCode)
          }
        })
      })
    })

  }

  return collect()

}
