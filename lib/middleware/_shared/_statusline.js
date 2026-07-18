var helpers = require("../../util/helpers")
var surgeSDK = require("surge-sdk")

// post-publish nicety: when a custom domain is not live yet, say so and
// show the one action. never interferes with the publish result — any
// error here is swallowed. checking the status also heals: the api kicks
// cert issuance when it observes dns landed without a fresh cert.
module.exports = function(req, next){
  var domain = req.domain
  var platform = (req.configuration && req.configuration.platform) || "surge.sh"

  // platform subdomains are trivially live — not worth a round trip
  if (!domain || domain.toLowerCase().slice(-(platform.length + 1)) === "." + platform) return next()

  var sdk = surgeSDK({
    endpoint: req.endpoint.format(),
    defaults: helpers.defaults
  })

  sdk.status(domain, { user: "token", pass: req.creds.token }, function(error, reply){
    if (error || !reply || reply.status === "live") return next()
    helpers.space()

    if (reply.status === "securing"){
      helpers.trunc("securing".yellow + (" - provisioning the certificate for " + domain + ". No action needed.").grey)
      return next()
    }

    helpers.trunc("waiting on dns".yellow + (" - " + domain + " is not pointed at surge yet:").grey)
    helpers.trunc(("     CNAME     " + reply.records.cname).grey)
    helpers.trunc(("     A (apex)  " + reply.records.a.join(", ")).grey)
    return next()
  })
}
