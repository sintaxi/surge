
var request     = require("request")
var url         = require("url")
var helpers     = require("./util/helpers")
var path        = require("path")
var fs          = require("fs")
var os          = require("os")
var parseUrl    = require("url-parse-as-address")

module.exports = function(req, next, abort){
  if (req.argv["_"][0] !== "plus") return next()
  var label = "             domain:".grey

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

      helpers.log()
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
            if (token === null) console.log()
            var sub = JSON.parse(b)
            console.log("               plan:".grey, sub.plan.name)
            console.log()
            console.log(("      You are now upgraded to " + sub.plan.name + "!").green)
            console.log()
          } else if (r.statusCode == 200) {
            var sub = JSON.parse(b)
            console.log("               plan:".grey, sub.plan.name)
            console.log()
            console.log(("      No charge created. You are already upgraded to " + sub.plan.name + "!").green)
            console.log()
          } else {
            console.log(r.statusCode)
          }
        })
      })
      //process.exit()
    })

  }

  var domain = req.argv.domain || req.argv["_"][1]
  if (helpers.validDomain(domain)) {
    helpers.log(label, domain)                // Display without protocol
    return plus(parseUrl(domain).hostname)    // #110
  } else {
    try {
      domain = fs.readFileSync(path.join(process.cwd(), "CNAME")).toString()
      domain = domain.split(os.EOL)[0].trim()
    } catch(e) {}
    getDomain(domain)
  }


  function getDomain(suggestion){
    req.read({
      silent: false,
      prompt: label,
      default: suggestion,
      edit: true,
    }, function(err, domain){
      if (domain === undefined) return abort("Please try again with a valid domain name.")
      if (err || !helpers.validDomain(domain)) {
        console.log("                    ", "Please enter valid domain name…".grey)
        return getDomain(domain)
      }
      req.domain = domain
      return plus(domain)
    })
  }

}
