var helpers = require("../util/helpers")
var surgeSDK = require("surge-sdk")

module.exports = function(req, next){

  var sdk = surgeSDK({
    endpoint: req.endpoint.format(),
    defaults: helpers.defaults
  })

  // who owns it, for anyone who holds it (plans/transfer.md); a domain
  // you don't hold just doesn't get the line
  var owned = null
  var ownerLine = function(){
    if (!owned || !owned.owner) return
    var o = owned.owner
    if (o === "someone else") return helpers.trunc(("owned by someone else").grey)
    if (o.org) return helpers.trunc(("owned by " + o.org.slug + (o.org.name && o.org.name !== o.org.slug ? " (" + o.org.name + ")" : "")).grey)
    if (o.account) return helpers.trunc(("owned by you (" + o.account + ")").grey)
  }

  // no default handlers here: their 403 would end status for a domain
  // that only isn't held
  var plain = surgeSDK({ endpoint: req.endpoint.format() })
  plain.owner(req.domain, { user: "token", pass: req.creds.token }, function(error, reply){
    owned = error ? null : reply
    show()
  })

  var show = function(){
  sdk.status(req.domain, { user: "token", pass: req.creds.token }, function(error, reply){
    if (error) return next(error)
    helpers.space()
    var done = next
    next = function(){ ownerLine(); return done.apply(null, arguments) }

    if (reply.status === "live"){
      var scheme = reply.https ? "https://" : "http://"
      helpers.trunc((req.domain).underline + " is " + "live".green + (" - " + scheme + req.domain).grey)
      return next()
    }

    // published, waiting only on the account's email verification
    if (reply.status === "ready"){
      helpers.trunc((req.domain).underline + " is " + "ready".yellow + " - serves once you verify your email (`surge verify` resends the link)".grey)
      return next()
    }

    if (reply.status === "securing"){
      helpers.trunc((req.domain).underline + " is " + "securing".yellow + " - provisioning the certificate. No action needed.".grey)
      return next()
    }

    // waiting on dns — the one action there ever is
    helpers.trunc((req.domain).underline + " is " + "waiting on dns".yellow + " - point your DNS at surge:".grey)
    helpers.space()
    helpers.trunc(("  CNAME     " + reply.records.cname).grey)
    helpers.trunc(("  A (apex)  " + reply.records.a.join(", ")).grey)
    return next()
  })
  }

}
