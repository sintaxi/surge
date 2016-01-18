var request     = require("request")
var url         = require("url")
var helpers     = require("./util/helpers")
var path        = require("path")
var fs          = require("fs")
var os          = require("os")
var split       = require("split")
var parseUrl    = require("url-parse-as-address")

module.exports = function(req, next, abort){

    var upload = function(req, next, abort){
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
          console.log()
          if (payload.payload["status"] == "ok") {
            console.log("    Success".green, "-", payload.payload["msg"])
          } else {
            console.log("    Error".yellow, "-", payload.payload["msg"])
          }
          console.log()
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
        console.log()
        // if (rsp.statusCode == 403) {
        //   helpers.log()
        //   helpers.log("    Unauthorized".yellow + " - you do not have publish access to", req.domain)
        //   helpers.log()
        //   process.exit()
        // } else if (rsp.statusCode == 400) {
        //   helpers.log()
        //   helpers.log("    SSL Fail".red, "-", "pem file is invalid.")
        //   helpers.log()
        //   process.exit()
        // } else if (rsp.statusCode == 202) {
        //   helpers.log()
        //   helpers.log("    SSL Pass".green, "-", "your pem file has been added to", req.domain)
        //   helpers.log()
        //   process.exit()
        // }
      })

      var pem = fs.createReadStream(req.pem)
      pem.pipe(handshake)
    }


    var mPem = function(req, next, abort){
      var label = "           pem file:".grey
      var pemPath
      var getPem = function(placeholder){
        req.read({
          prompt: label,
          default: placeholder,
          edit: true,
          terminal: req.config.terminal,
          output: req.config.output,
          input: req.config.input
        }, function(err, pem){
          if (pem === undefined) return abort("no PEM file provided")
          if (pem === "") return getPem()
          var pemPath = path.resolve(pem || "")
          if (!fs.existsSync(pemPath)) return getPem(pem)
          req.pem = pemPath
          return upload(req, next, abort)
        })
      }

      var pem = req.argv["pem"]
      pemPath = path.resolve(pem || "")

      if (pem && fs.existsSync(pemPath)) {
        req.pem = pemPath
        console.log(label, pemPath)
        return upload(req, next, abort)
      } else {
        return getPem()
      }

    }

  return mPem(req, next, abort)

}
