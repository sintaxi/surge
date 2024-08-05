var helpers = require("../../util/helpers")
var moniker = require("moniker")
var fs = require("fs")
var path = require("path")
var os = require("os")

module.exports = function(req, next, abort){
  var label = helpers.smart("domain:").grey

  function getDomain(suggestion){
    helpers.read({
      silent: false,
      prompt: label,
      default: suggestion || "",
      edit: true,
      terminal: req.configuration.terminal,
      output: req.configuration.output,
      input: req.configuration.input
    }, function(err, domain){
      if (domain === undefined) return abort("Teardown".grey)
      if (err || !helpers.validDomain(domain)) {
        return getDomain(domain)
      }
      req.domain = domain
      return next()
    })
  }

  if (helpers.validDomain(req.domain)) {
    next()
  } else {
    if (req.domain == "_"){
      req.domain = [moniker.choose(), req.configuration.platform].join(".")
      helpers.log(label, req.domain)
      next()
    } else {
      getDomain(req.suggestedDomain)  
    }
    
  }
}
