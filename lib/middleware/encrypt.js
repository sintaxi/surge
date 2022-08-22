
var helpers     = require("../util/helpers.js")
var surgeSDK    = require("surge-sdk")
var surgeStream = require("surge-stream")

module.exports = function(req, next){

  var progress = {}
  var progressDone = {}
  var ts = new Date().toJSON()

  var sdk = surgeSDK({
    endpoint: req.endpoint.format(),
    defaults: helpers.defaults
  }, surgeStream)


  var domain = req.argv["_"][0]

  sdk.encrypt(domain, {
    "user":"token",
    "pass": req.creds.token
  }, {
    "version" : req.pkg.version,
    "cmd": req.configuration.cmd,
    "timestamp": ts
  }, req.argv)


  /**
   * display progress bars
   *
   *
   */  

  .on("progress", function(payload){
    try {

      // we have two different display for the progress bars
      var displays = {
        "upload": helpers.smart('upload:').grey + ' [:bar] :percent',
       "encrypt": helpers.smart('encryption:').grey + ' [:bar] :percent'
      }

      // create progress bar (if one doesnt exist)
      progress[payload.id] = progress[payload.id] || new ProgressBar(displays[payload.id], {
        complete: '=', incomplete: ' ', width: 25, total: payload.total
      })

      // clear file name on last update
      var file = payload.written >= payload.total ? "" : payload.file

      // refresh view
      if (!progressDone[payload.id]){
        if (payload.written / payload.total === 1) progressDone[payload.id] = true
        if (payload.written > payload.total) progressDone[payload.id] = true
        progress[payload.id].update(payload.written / payload.total)
      }

    } catch(e){}

  })


  /**
   * success
   *
   * the cert application is complete
   *
   */

  // .on("success", function(){
  //   helpers.space()
  //   if (req.argv.stage){
  //     helpers.trunc("Success!".green + (" - Preveiw available at " + (req.info.metadata.preview).underline).grey)
  //   } else {
  //     helpers.trunc("Success!".green + (" - Published to ").grey)  
  //   }
  //   helpers.space()
  //   return next()
  // })


  /**
   * unauthenticated
   *
   */

  .on("info", function(payload){
    req.info = payload
    helpers.displayCertInfo(payload, { short: false, showEmpty: true })
    helpers.space()
    // helpers.displayServers(payload.instances)
    // helpers.displayPreview(payload)
    //helpers.displayPublishInfo(payload)
  })


  /**
   * collect
   *
   * payload includes information needed to subscribe to a plan that will then accept the upload
   *
   */

  .on("collect", function(payload){
    var msg = ("   " + payload.plan.name.underline + " plan requred. ").grey + ("$" + (payload.plan.amount / 100) + "/mo with a " + payload.plan.trial_period_days + " day trial").underline.grey
    helpers.log()
    if (payload.hasOwnProperty("perks")) {
      helpers.log(msg += "\n\n     Includes...".blue)
      payload.perks.forEach(function(perk){ helpers.log(("       - " + perk).blue); })
      helpers.log()
    } else {
      helpers.log(msg)
    }
    req.plan = payload.plan.name
    helpers.payment(req, payload.stripe_pk, payload.card)(function(paymentToken){
      sdk.plan({ 
        "plan": payload.plan.id, 
        "token": paymentToken, 
        "timestamp": ts 
      }, { "user": "token", "pass": req.creds.token }, function(errors, rsp){
        if (errors) {
          helpers.space()
          helpers.trunc("Error".red + " - troubles switching plan".grey)
          helpers.space()
        }else{
          helpers.space()
          helpers.trunc(rsp.msg.grey)
          helpers.space()
        }
      })
    })
  })


  /**
   * unauthenticated
   *
   */

  .on("unauthenticated", function(payload){
    helpers.space()
    helpers.trunc("Aborted".yellow + (" - local token has expired and cleared. please try again.").grey)
    helpers.space()
    localCreds(req.argv.endpoint).set(null)
    process.exit(1)
  })


  /**
   * forbidden
   *
   */

  .on("forbidden", function(payload){
    helpers.space()
    helpers.trunc("Aborted".yellow + (" - you do not have permission to publish to " + domain.underline).grey)
    helpers.space()
    process.exit(1)
  })

}