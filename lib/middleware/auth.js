var request     = require("request")
var localCreds  = require("./util/creds.js")
var helpers     = require("./util/helpers.js")
var os          = require('os')
var url         = require("url")
var parseUrl    = require("url-parse-as-address")
var read        = require("read")


module.exports = function(req, next, abort){
  var count = 0
  var label = "           password:".grey

  var auth = function(){
    read({
      prompt: label,
      silent: true,
      edit: false
    }, function(err, password){
      if (password === undefined) return abort("not authenticated.")
      helpers.fetchToken(req.argv.endpoint || req.config.endpoint || 'surge.' + req.config.platform)(req.email, password, function(err, obj){
        if (err) {
          count++
          if (err.hasOwnProperty("details") && err["details"].hasOwnProperty("email")) process.exit(1)

          if (count >=3) {
            read({
              prompt: "    forgot password?".grey,
              default: "yes",
            }, function(err, reply){
              if (reply == "yes" || reply == "y" || reply == "Y") {

                var options = {
                  'url': url.resolve(req.endpoint, "/token/reset/" + req.email),
                  'method': 'post'
                }

                request(options, function(e, r, obj){
                  if (e) throw e
                  if (r.statusCode == 201) {
                    console.log()
                    console.log("    Password Recovery".yellow, "- reset instructions sent to", req.email.green)
                    console.log()
                    process.exit(1)
                  } else {
                    console.log()
                    console.log("    Oops".red, "- something went wrong trying to reset your password.")
                    console.log()
                    process.exit(1)
                  }
                })
              } else {
                console.log()
                console.log("    Aborted".yellow, "- no password reset sent.", req.email.green)
                console.log()
                process.exit(1)
              }


            })
          } else {
            return auth()
          }
        } else {
          req.creds = localCreds(req.argv.endpoint || req.config.endpoint || 'surge.' + req.config.platform).set(obj.email, obj.token)
          return next()
        }
      })
    })
  }

  if (req.authed) {
    console.log("              token:".grey, "*****************".grey)
    return next()
  } else {
    return auth()
  }

}
