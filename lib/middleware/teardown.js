
var request     = require("request")
var url         = require("url")
var helpers     = require("./util/helpers")
var path        = require("path")
var fs          = require("fs")
var os          = require("os")
var parseUrl    = require("url-parse-as-address")

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
          process.exit(1)
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
        if (domain === undefined) return abort("Unable to remove, please use a valid domain name.")
        if (err || !helpers.validDomain(domain)) {
          helpers.log("                    ", "Please enter valid domain name…".grey)
          return getDomain(domain)
        }
        return remove(parseUrl(domain).host) // #110
      })
    }

    var domain = req.argv.domain || req.argv["_"][1]

    if (helpers.validDomain(domain)) {
      helpers.log(label, domain) // Display without protocol
      return remove(parseUrl(domain).host) // #110
    } else {
      try {
        domain = fs.readFileSync(path.join(process.cwd(), "CNAME")).toString()
        domain = domain.split(os.EOL)[0].trim()
        getDomain(domain)
      } catch(e) {
        getDomain()
      }
    }

  }

}
