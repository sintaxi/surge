var request     = require("request")
var url         = require("url")
var helpers     = require("./util/helpers")
var path        = require("path")
var fs          = require("fs")
var os          = require("os")

module.exports = function(req, next, abort){
  if (req.argv["_"][0] !== "ssl") {
    return next()
  } else {

    var uploadCert = function(domain){
      var options = {
        'url': url.resolve(req.endpoint, domain, "ssl"),
        'method': 'put',
        'auth': {
          'user': "token",
          'pass': req.creds.token,
          'sendImmediately': true
        }
      }

      request(options, function(e, r, obj){
        if (e) throw e

        if (r.statusCode == 201) {
          helpers.log()
          helpers.log("    SSL Added".green + " - cert has been added for " + domain + ".")
          helpers.log()
          process.exit()
        } else if (r.statusCode == 403) {
          helpers.log()
          helpers.log("    Unauthorized".yellow + " - You do not have access to this domain.", domain)
          helpers.log()
          process.exit(1)
        } else {
          helpers.log("status", r.statusCode)
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
        return uploadCert(domain)
      })
    }

    var domain = req.argv["pem"] || req.argv["_"][1]

    if (domain) {
      if (domain.split(".").length === 1) {
        return getDomain()
      } else {
        helpers.log(label, domain)
        return uploadCert(domain)
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

  }

}