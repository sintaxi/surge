var helpers = require("./util/helpers")
var pkg = require('./pkg')
var prompt = helpers.prompt
var moniker = require("moniker")
var fs = require("fs")
var path = require("path")

module.exports = function(req, next){

  if (req.argv.domain){
    if (req.argv.domain.split(".").length === 1) {
      domain(req.argv.domain + ".surge.sh", next)
    } else {
      req.domain = req.argv.domain
      helpers.log("             domain:".grey, req.domain)
      return next()
    }
  } else if (fs.existsSync(path.join(req.project, 'CNAME'))) {
    fs.readFile(path.join(req.project, 'CNAME'), 'utf8', function(err, cname) {
      if (err) {
        return helpers.log(err);
      } else {
        domain(cname.split('\n')[0].trim(), next)
      }
    });
  } else {
    // fetch a default
    domain(moniker.choose() + ".surge.sh", next)
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
