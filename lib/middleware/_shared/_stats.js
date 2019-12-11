
var request     = require("request")
var url         = require("url")
var helpers     = require("../util/helpers")
var path        = require("path")
var fs          = require("fs")
var os          = require("os")
var opn         = require("opn")

module.exports = function(req, next, abort){
  if (req.argv["_"][0] !== "stats") {
    return next()
  } else {

    var stats = function(domain){
      var u = url.resolve(req.endpoint, domain)
      console.log(u)
      opn(u, 'firefox')
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
        return stats(domain)
      })
    }

    var domain = req.argv.domain || req.argv["_"][1]

    if (domain) {
      if (domain.split(".").length === 1) {
        return getDomain()
      } else {
        helpers.log(label, domain)
        return stats(domain)
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