
var request     = require("request")
var url         = require("url")
var helpers     = require("./util/helpers")
var path        = require("path")
var fs          = require("fs")
var os          = require("os")

module.exports = function(req, next, abort){
  if (req.argv["_"][0] !== "teardown") {
    return next()
  } else {

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

        if (r.statusCode == 200 || r.statusCode == 204 || r.statusCode == 210) {
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

    var label = "             domain:".grey

    var getDomain = function(suggestion){
      req.read({
        prompt: label,
        default: suggestion,
        edit: true,
      }, function(err, domain, isDefault){
        if (domain === undefined) return abort()
        if (err || domain.length < 1 || domain.split(".").length < 2) return getDomain(domain)
        return remove(domain)
      })
    }

    var domain = req.argv.domain || req.argv["_"][1]

    if (domain) {
      if (domain.split(".").length === 1) {
        return getDomain()
      } else {
        helpers.log(label, domain)
        return remove(domain)
      }
    } else {
      try {
        domain = fs.readFileSync(path.join(process.cwd(), "CNAME")).toString()
        domain = domain.split(os.EOL)[0].trim()
        getDomain()
      } catch(e) {
        getDomain()
      }
    }

  }

}