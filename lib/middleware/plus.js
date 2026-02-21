
var axios       = require("axios")
var url         = require("url")
var helpers     = require("../util/helpers")
var parseUrl    = require("url-parse-as-address")

module.exports = function(req, next, abort){

  var plus = function(domain){
    var endpoint = req.endpoint.format ? req.endpoint.format() : req.endpoint
    var subscriptionUrl = url.resolve(endpoint, domain + "/subscription")

    axios.get(subscriptionUrl, {
      auth: { username: "token", password: req.creds.token }
    }).then(function(response) {
      var payload = response.data

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
        var params = new URLSearchParams()
        params.append('plan', JSON.stringify(payload.plan))
        if (token) params.append('token', token)

        axios.put(subscriptionUrl, params, {
          auth: { username: 'token', password: req.creds.token }
        }).then(function(response) {
          var sub = response.data
          if (token === null){
            helpers.space()
          }
          helpers.log(helpers.smart("plan:").grey + " " + sub.plan.name)
          helpers.space()
          helpers.trunc(("You are now upgraded to " + sub.plan.name + "!").green)
          helpers.space()
        }).catch(function(error) {
          if (error.response && error.response.status == 200) {
            var sub = error.response.data
            helpers.log(helpers.smart("plan:").grey + " " + sub.plan.name)
            helpers.space()
            helpers.trunc(("No charge created. You are already upgraded to " + sub.plan.name + "!").green)
            helpers.space()
          } else {
            helpers.trunc(error.response ? error.response.status : error.message)
          }
        })
      })
    }).catch(function(error) {
      throw error
    })

  }

  return plus(parseUrl(req.domain).hostname)

}
