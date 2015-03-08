
var request     = require("request")
var url         = require("url")
var helpers     = require("./util/helpers")
var prompt      = helpers.prompt
var path        = require("path")
var fs          = require("fs")
var os          = require("os")

module.exports = function(req, next){

  if (req.argv["_"] && req.argv["_"][0] === "teardown") {

    var remove = function(domain){
      var options = {
        'url': url.resolve(req.endpoint, domain),
        'method': 'delete',
        'auth': {
          'user': "token",
          'pass': req.creds.token,
          'sendImmediately': true
        }
      }

      request(options, function(e, r, obj){
        if (e) throw e

        if (r.statusCode == 200 || r.statusCode == 204) {
          helpers.log()
          helpers.log("    Success".green + " - " + domain + " has been removed.")
          helpers.log()
          process.exit()
        } else if (r.statusCode == 403) {
          helpers.log()
          helpers.log("    Aborted".yellow + " - unable to remove", domain)
          helpers.log()
          process.exit()
        } else {
          helpers.log()
          helpers.log(obj)
          helpers.log()
          process.exit()
        }
      })
    }

    var getDomain = function(suggestion){
      var arg = {
        name: "domain",
        description: "             domain:",
        required: true,
        message: "please specify a valid domain to remove...",
        conform: function(val){
          return (val.split(".").length > 1)
        }
      }
      if (suggestion) arg["default"] = suggestion

      prompt.get(arg, function(err, result){
        req.domain = result.domain
        remove(req.domain)
      })
    }

    var domain = req.argv.domain || req.argv["_"][1]

    if (domain) {
      if (domain.split(".").length === 1) {
        return getDomain()
      } else {
        helpers.log("             domain:".grey, domain)
        return remove(domain)
      }
    } else {
      try {
        domain = fs.readFileSync(path.join(process.cwd(), "CNAME")).toString()
        domain = domain.split(os.EOL)[0].trim()
        getDomain(domain)
      } catch(e) {
        getDomain()
      }
    }



  } else {
    return next()
  }

}