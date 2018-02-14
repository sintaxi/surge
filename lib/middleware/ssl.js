var request     = require("request")
var url         = require("url")
var helpers     = require("./util/helpers")
var path        = require("path")
var fs          = require("fs")
var os          = require("os")
var split       = require("split")
var parseUrl    = require("url-parse-as-address")

module.exports = function(req, next, abort){

  var uri = url.resolve(req.endpoint, path.join(req.domain, "ssl"))
  var handshake = request.put(uri, { "version" : req.pkg.version })

  // apply basic auth
  handshake.auth("token", req.creds.token, true)

  // catch errors
  handshake.on('error', function(d){
    console.log(d)
  })

  // split replies on new line
  handshake.pipe(split())

  // output result
  handshake.on("data", function(data){

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
        var uri = url.resolve(req.endpoint, req.domain + "/subscription")
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

  var pem = fs.createReadStream(req.pem)
  pem.pipe(handshake)

}
