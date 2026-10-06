
var helpers = require("../util/helpers")
var surgeSDK = require("surge-sdk")

module.exports = function(req, next){

  var sdk = surgeSDK({
    endpoint: req.endpoint.format(),
    defaults: helpers.defaults
  })

  var domain  = req.domain
  var rev     = req.argv["_"][0] || null

  helpers.space()
  sdk.cutover(domain, rev, { user: "token", pass: req.creds.token }, function(error, response){
    if (error){
      return next(error)
    }else{
      // the sdk hands back the body only (never the status code), so the
      // outcome comes from what was serving before — same as rollback
      var success = !response.former || String(response.former.rev) !== String(response.revision.rev)
      helpers.space()
      if (success){
        helpers.trunc("⤮ Cutover".green)
        helpers.displayRevisionBasicInfo(response.revision, response.domain)
        helpers.displayServers(response.instances)
        helpers.trunc("Done".green + (" - " + domain.underline + " now serving revision " + response.revision.preview.underline).grey)
      }else{
        helpers.trunc("⤮ Cutover".yellow)
        helpers.displayRevisionBasicInfo(response.revision, response.domain)
        helpers.trunc("Unchanged".yellow + (" - already serving " + response.revision.preview.underline).grey)
      }
      return next()
    }
  })

}
