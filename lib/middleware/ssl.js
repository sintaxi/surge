var url         = require("url")
var axios       = require("axios")
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
        var uri = url.resolve(req.endpoint.format ? req.endpoint.format() : req.endpoint, req.domain + "/subscription")
        var params = new URLSearchParams()
        params.append('plan', JSON.stringify(payload.plan))
        if (token) params.append('token', token)

        axios.put(uri, params, {
          auth: { username: 'token', password: req.creds.token }
        }).then(function(response) {
          // success
        }).catch(function(error) {
          // error handling
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
      localCreds(req.argv.endpoint).set(null)
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
