
var helpers     = require("./util/helpers")
var parseUrl    = require("url-parse-as-address")

module.exports = function(req, next, abort){

  var plus = function(domain){
    var url = new URL(domain + '/subscription', req.endpoint)
    var authorization = `Basic ${
      Buffer.from(`token:${req.creds.token}`).toString('base64')
    }`
    var options = {
      headers: { authorization }
    }

    fetch(url, options).then(async function(r) {
      var payload = await r.json()

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
        var uri = new URL(domain + "/subscription", req.endpoint)
        var body = new FormData()
        body.set('plan', payload.plan)
        body.set('token', token)
        fetch(uri, {
          method: "PUT",
          headers: { authorization },
          body
        }).then(async function(r) {
          if (r.status == 201) {
            if (token === null){
              helpers.space()
            } 
            var sub = await r.json()
            helpers.log(helpers.smart("plan:").grey + " " + sub.plan.name)
            helpers.space()
            helpers.trunc(("You are now upgraded to " + sub.plan.name + "!").green)
            helpers.space()
          } else if (r.status == 200) {
            var sub = await r.json()
            helpers.log(helpers.smart("plan:").grey + " " + sub.plan.name)
            helpers.space()
            helpers.trunc(("No charge created. You are already upgraded to " + sub.plan.name + "!").green)
            helpers.space()
          } else {
            helpers.trunc(r.status)
          }
        })
      })
      //process.exit()
    })

  }

  return plus(parseUrl(req.domain).hostname)

}
