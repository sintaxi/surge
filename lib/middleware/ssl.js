var url         = require("url")
var helpers     = require("./util/helpers")
var path        = require("path")
var fs          = require("fs")
var os          = require("os")
var split       = require("split")
var parseUrl    = require("url-parse-as-address")

module.exports = function(req, next, abort){

  var uri = new URL(req.domain + '/ssl', req.endpoint)
  var authorization = `Basic ${
    Buffer.from(`token:${req.creds.token}`).toString('base64')
  }`
  var pem = fs.createReadStream(req.pem)
  var body = Readable.from(pem)
  var headers = {
    authorization,
    'content-length': Buffer.from(body).length,
    'content-type': 'application/json',
    "version" : req.pkg.version
  }
  fetch(uri, { method: 'PUT', body, headers }).then(async function(rsp) {
    if (rsp.status == 403) {
      helpers.space()
      if(rsp.headers.hasOwnProperty("reason")){
        helpers.trunc("Aborted".yellow + " - " + rsp.headers["reason"])
      } else {
        helpers.trunc("Aborted".yellow + (" - Unauthorized to aplly ssl to " + req.domain.underline).grey)
      }
      helpers.log()
      process.exit(1)
    } else if (rsp.status == 401) {
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

    var splitStream = split()
    splitStream.on('data', handleResponseData)
    if (rsp.body) {
      for await (var data of r.body) {
        splitStream.write(data)
      }
    }
    // done
    // console.log()
    // console.log("   Success!".green, "-", "ssl cert has been added to", req.domain)
    // console.log()
    // process.exit()
  })

  function handleResponseData(data) {
    var payload = JSON.parse(data.toString())
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
        var uri = new URL(req.domain + '/subscription', req.endpoint)
        var authorization = `Basic ${
          Buffer.from(`token:${req.creds.token}`).toString('base64')
        }`
        var form = new FormData()
        form.set('plan', payload.plan)
        form.set('token', token)
        fetch(uri, {
          method: 'PUT',
          headers: { authorization },
          body: form,
        }).then(function(r) {
          if (r.status == 201) {
            //if (token === null) console.log()
            //next()
            //var sub = JSON.parse(b)
            //console.log("               plan:".grey, sub.plan.name)
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

  }


}
