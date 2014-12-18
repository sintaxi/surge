var helpers = require("./util/helpers")
var prompt = helpers.prompt
var moniker = require("moniker")
var fs = require("fs")
var path = require("path")

module.exports = function(req, next){

  try {
    req.domain = req.argv.domain || fs.readFileSync(path.join(req.project, "CNAME")).toString()
    req.domain = req.domain.split(os.EOL)[0].trim()
    req.domain.split(".").length === 1
      ? domain(req.domain, next)                   // prompt if appears invalid
      : next()                                     // just move on
  } catch(e) {
    domain(moniker.choose() + ".surge.sh", next)   // prompt with a suggestion
  }

  function domain(suggestion, next){
    prompt.get({
      name: "domain",
      description: "             domain:",
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
