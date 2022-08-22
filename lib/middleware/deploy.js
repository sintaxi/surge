
var helpers     = require('../util/helpers')
var localCreds  = require("../util/creds.js")
var surge       = require('../surge')
var surgeSDK    = require("surge-sdk")
var surgeStream = require("surge-stream")
var ProgressBar = require("progress")
var fs = require("fs")


module.exports = function(req, next){
  
  var progress = {}
  var progressDone = {}
  var ts = new Date().toJSON()


  var sdk = surgeSDK({
    endpoint: req.endpoint.format(),
    defaults: helpers.defaults
  }, surgeStream)


  /**
   * progress
   *
   * payload includes upload progress
   *
   */

  sdk.publish(req.project, req.domain, {
    "user":"token",
    "pass": req.creds.token
  }, {
    "version" : req.pkg.version,
    "file-count": req.fileCount,
    "project-size": req.projectSize,
    "cmd": req.configuration.cmd,
    "timestamp": ts,
    "stage": req.argv.s,
    "message": req.argv.m,
    "add": req.argv.a,
    "rem": req.argv.r,
    "ssl": req.ssl
  }, req.argv)


  /**
   * progress
   *
   * payload includes upload progress
   *
   */

  .on("progress", function(payload){
    try {

      // we have two different display for the progress bars
      var displays = {
        "upload": helpers.smart('upload:').grey + ' [:bar] :percent',
           "cdn": helpers.smart('CDN:').grey + ' [:bar] :percent',
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
   * regionInfo
   *
   * payload includes information about surge edgenode regions
   *
   *   {
   *     nsDomain: "surge.world",
   *     regions: {
   *       "yyz":{ "ip": "159.203.50.177",   "country": "CA",  "city": "Toronto" },
   *       "jfk":{ "ip": "159.203.159.100",  "country": "US",  "city": "New York" },
   *       "sfo":{ "ip": "138.197.235.123",  "country": "US",  "city": "San Francisco" },
   *       "lhr":{ "ip": "46.101.67.123",    "country": "GB",  "city": "London" },
   *       "ams":{ "ip": "188.166.132.94",   "country": "NL",  "city": "Amsterdam" },
   *       "fra":{ "ip": "138.68.112.220",   "country": "DE",  "city": "Frankfurt" },
   *       "sgp":{ "ip": "139.59.195.30",    "country": "SG",  "city": "Singapore" },
   *       "blr":{ "ip": "139.59.50.135",    "country": "IN",  "city": "Bangalore" }
   *     }
   *   }
   *
   */

  // .on("progress", function(d){
  //   console.log(JSON.stringify(d))
  // })

  .on("info", function(payload){
    req.info = payload
    // helpers.displayServers(payload.instances)
    // helpers.displayPreview(payload)
    helpers.displayPublishInfo(payload)
  })


  /**
   * users
   *
   * payload includes list of collaborators
   *
   */  

  .on("users", function(payload){
    helpers.log(helpers.smart("users:").grey, payload.users.join(", "))
  })


  /**
   * cert
   *
   * payload includes information about SSL certificate
   *
   */  

  // .on("cert", function(payload){
  //   try{
  //     helpers.log(helpers.smart("encryption:").grey + " " + payload.data.issuer + " - " + (payload.data.altnames || []).join(", ") + ( " (" + payload.data.expiresInWords + ")").grey)
  //   } catch(e){
  //     helpers.space()
  //     helpers.log(helpers.smart("Error").red + (" - " + "please report error to support@surge.sh").grey)
  //     helpers.space()
  //   }
  // })

  .on("ssl", function(payload){
    payload.certs.forEach(function(cert){
      helpers.log(helpers.smart("CA:").grey + " " + (cert.issuer) + ( " (exp. " + cert.expInDays + " days)").grey)  
    })
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
    helpers.trunc("Aborted".yellow + (" - you do not have permission to publish to " + req.domain.underline).grey)
    helpers.space()
    process.exit(1)
  })


  /**
   * error (depricated)
   *
   * payload includes information needed to display compile errors to user
   *
   */

  .on("error", function(payload){
    console.log()
    console.log()
    helpers.log("   Processing Error:".yellow, payload.error.filename).log()
    console.log(helpers.stacktrace(payload.error.stack, { lineno: payload.error.lineno }))
    helpers.log()
    console.log("  ", payload.error.message)
    console.log()
    req.status = req.status || "Compile Error"
    process.exit(1)
  })


  /**
   * fail
   *
   * the deployment has failed
   *
   */

  .on("fail", function(obj){
    console.log()
    console.log()
    helpers.trunc("Error".red + " - Deployment did not succeed.".grey)
    helpers.space()
    process.exit(1)
  })


  /**
   * success
   *
   * the deployment has failed
   *
   */

  .on("success", function(){
    helpers.space()
    if (req.argv.stage){
      helpers.trunc("Success!".green + (" - Preveiw available at " + (req.info.metadata.preview).underline).grey)
    } else {
      helpers.trunc("Success!".green + (" - Published to " + (req.domain).underline).grey)  
    }
    helpers.space()
    return next()
  })


}
