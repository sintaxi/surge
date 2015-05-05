var helpers = require("./util/helpers")
var moniker = require("moniker")
var fs = require("fs")
var path = require("path")
var os = require("os")
var whois = require("whois-json")
var record = require("a-record")

module.exports = function(req, next, abort){
  var label = "             domain:".grey

  try {
    req.domain = req.argv.domain || fs.readFileSync(path.join(req.project, "CNAME")).toString()
    req.domain = req.domain.split(os.EOL)[0].trim()

    if (req.domain.split(".").length === 1) {
      return getDomain(req.domain, next)
    } else {
      console.log(label, req.domain)
      return next()
    }
  } catch(e) {
    return getDomain(moniker.choose() + ".surge.sh")   // prompt with a suggestion
  }

  function getDomain(suggestion){
    req.read({
      silent: false,
      prompt: label,
      default: suggestion,
      edit: true,
    }, function(err, domain){
      if (domain === undefined) return abort()
      if (domain.length < 2 || domain.split(".").length < 2) return getDomain(domain)
      req.domain = domain
      return next()
    })
  }

  // If this isn’t a platform subdomain,
  // whois the domain and then
  // prompt with instructions on how to
  // add a cname or an a-record based on
  // the dns provider

  getDomain()
}
