var helpers     = require("../util/helpers")
var path        = require("path")
var fs          = require("fs")
var os          = require("os")
var surgeSDK    = require("surge-sdk")
var surgeStream = require("surge-stream")
var localCreds  = require("../util/creds.js")

module.exports = function(req, next, abort){

  var sdk = surgeSDK({
    endpoint: req.endpoint.format ? req.endpoint.format() : req.endpoint,
    defaults: helpers.defaults
  }, surgeStream)

  var handshake = sdk.ssl(
    req.pem,
    req.domain,
    { user: "token", pass: req.creds.token },
    { version: req.pkg.version },
    req.argv
  )

  // catch errors
  handshake.on('error', function(d){
    console.log(d)
  })

  // output result
  handshake.on("data", function(payload){
    if (payload.hasOwnProperty("type") && payload["type"] == "collect"){
      // stripe Plan/Price objects no longer carry a display name
      var planName = payload.plan.name || payload.plan.nickname || payload.plan.id
      var msg = "      Project requires the ".blue  + planName.yellow + " plan. ".blue + ("$" + (payload.plan.amount / 100) + "/mo").yellow + " (cancel anytime).".blue
      helpers.log()
      if (payload.hasOwnProperty("perks")) {
        helpers.log(msg += " This plan provides...".blue)
        payload.perks.forEach(function(perk){
          helpers.log(("          - " + perk).blue)
        })
      } else {
        helpers.log(msg)
      }
      if (payload.checkout_url){
        helpers.log(("       Or pay in your browser: ").grey + payload.checkout_url.underline)
        helpers.log()
      }
      helpers.payment(req, payload["stripe_pk"], payload.card)(function(token){
        var fields = { plan: payload.plan.id }
        if (token) fields.token = token

        sdk.plan(req.domain, fields, { user: "token", pass: req.creds.token }, function(errors, rsp){
          if (errors) {
            helpers.space()
            helpers.trunc("Error".red + " - troubles switching plan".grey)
            helpers.space()
          } else {
            helpers.space()
            helpers.trunc(rsp.msg.grey)
            helpers.space()
          }
        })
      })
    } else if (payload.hasOwnProperty("type") && payload["type"] == "subscription"){
      // if (payload.data) {
      //   console.log("               plan:".grey, payload.data.plan.name)
      // } else {
      //   console.log("               plan:".grey, "Free")
      // }
    } else if (payload.hasOwnProperty("type") && payload["type"] == "msg"){
      helpers.space()
      if (payload.payload["status"] == "ok") {
        helpers.trunc("Success".green + (" - " + payload.payload["msg"]).grey)
      } else {
        helpers.trunc("Error".yellow + (" - " + payload.payload["msg"]).grey)
      }
      helpers.space()
    }
  })

  // done
  handshake.on("end", function(){
    // console.log()
    // console.log("   Success!".green, "-", "ssl cert has been added to", req.domain)
    // console.log()
    // process.exit()
  })

  handshake.on("response", function(rsp){
    if (rsp.statusCode == 403) {
      helpers.space()
      if(rsp.headers.hasOwnProperty("reason")){
        helpers.trunc("Aborted".yellow + " - " + rsp.headers["reason"])
      } else {
        helpers.trunc("Aborted".yellow + (" - Unauthorized to aplly ssl to " + req.domain.underline).grey)
      }
      helpers.log()
      process.exit(1)
    } else if (rsp.statusCode == 401) {
      localCreds(req.endpoint).set(null)
      helpers.log()
      if(rsp.headers.hasOwnProperty("reason")){
        helpers.trunc("Aborted".yellow + " - " + rsp.headers["reason"])
      } else {
        helpers.trunc("Aborted".yellow + " - Local token has expired. please try again.".grey)
      }
      helpers.log()
      process.exit(1)
    }
  })

}
