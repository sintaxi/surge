
var request     = require("request")
var url         = require("url")
var helpers     = require("../util/helpers")
var path        = require("path")
var fs          = require("fs")
var os          = require("os")
var parseUrl    = require("url-parse-as-address")

module.exports = function(req, next, abort){

  var plus = function(domain){
    var options = {
      'url': url.resolve(req.endpoint, domain + "/subscription"),
      'method': 'get',
      'auth': {
        'user': "token",
        'pass': req.creds.token,
        'sendImmediately': true
      }
    }

    request(options, function(e, r, obj){
      if (e) throw e

      var payload = JSON.parse(obj)

      var msg = "      Project requires the ".blue  + payload.plan.name.yellow + " plan. ".blue + ("$" + (payload.plan.amount / 100) + "/mo").yellow + " (cancel anytime).".blue

      helpers.space()
      if (payload.hasOwnProperty("perks")) {
        helpers.log(msg += " This plan provides...".blue)
        payload.perks.forEach(function(perk){
          helpers.log(("          - " + perk).blue)
        })
      } else {
        helpers.log(msg)
      }

      helpers.payment(req, payload["stripe_pk"], payload.card)(function(token){
        var uri = url.resolve(req.endpoint, domain + "/subscription")
        request({
          uri: uri,
          method: "PUT",
          auth: {
            'user': 'token',
            'pass': req.creds.token,
            'sendImmediately': true
          },
          form: {
            plan: payload.plan,
            token: token
          }
        }, function(e,r,b){
          if (r.statusCode == 201) {
            if (token === null){
              helpers.space()
            } 
            var sub = JSON.parse(b)
            helpers.log(helpers.smart("plan:").grey + " " + sub.plan.name)
            helpers.space()
            helpers.trunc(("You are now upgraded to " + sub.plan.name + "!").green)
            helpers.space()
          } else if (r.statusCode == 200) {
            var sub = JSON.parse(b)
            helpers.log(helpers.smart("plan:").grey + " " + sub.plan.name)
            helpers.space()
            helpers.trunc(("No charge created. You are already upgraded to " + sub.plan.name + "!").green)
            helpers.space()
          } else {
            helpers.trunc(r.statusCode)
          }
        })
      })
      //process.exit()
    })

  }

  return plus(parseUrl(req.domain).hostname)

}
