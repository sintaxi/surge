var helpers = require("./util/helpers")
var moniker = require("moniker")
var fs = require("fs")
var path = require("path")
var os = require("os")

module.exports = function(req, next, abort){
  var label = helpers.smart("domain:").grey

  // try {
  //   req.domain = req.argv.domain || fs.readFileSync(path.join(req.project, "CNAME")).toString()
  //   req.domain = req.domain.split(os.EOL)[0].trim()

  //   if (!helpers.validDomain(req.domain)) {
  //     return getDomain(req.domain, next)
  //   } else {
  //     console.log(label, req.domain)
  //     return next()
  //   }
  // } catch(e) {
  //   return getDomain(moniker.choose() + ".surge.sh")   // prompt with a suggestion
  // }

  function getDomain(suggestion){
    helpers.read({
      silent: false,
      prompt: label,
      default: suggestion || "",
      edit: true,
      terminal: req.config.terminal,
      output: req.config.output,
      input: req.config.input
    }, function(err, domain){
      if (domain === undefined) return abort("Not initiated.".grey)
      if (err || !helpers.validDomain(domain)) {
        //console.log("                    ", "Please enter valid domain name…".grey)
        return getDomain(domain)
      }
      req.domain = domain
      return next()
    })
  }
  if (helpers.validDomain(req.domain)) {
    helpers.log(label, req.domain)
    next()
  } else {
    if (req.domain == "_"){
      req.domain = [moniker.choose(), req.config.platform].join(".")
      helpers.log(label, req.domain)
      next()
    } else {
      getDomain(req.suggestedDomain)  
    }
    
  }
}
