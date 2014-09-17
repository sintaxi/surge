var prompt = require("./util/helpers").prompt
var moniker = require("moniker")
var fs = require("fs")

module.exports = function(req, next){

  if (req.argv.domain){
    if (req.argv.domain.split(".").length === 1) {
      domain(req.argv.domain + ".surge.sh", next)
    } else {
      req.domain = req.argv.domain
      return next()
    }
  } else {
    // fetch a default
    domain(moniker.choose() + ".surge.sh", next)
  }

  function domain(suggestion, next){
    prompt.get({
      name: "domain",
      description: "domain:".white,
      message: "please specify a valid domain to deploy to...",
      default: suggestion,
      conform: function(val){
        return (val.split(".").length > 1)
      }
    }, function(err, result){
      req.domain = result.domain
      next()
    })
  }

}