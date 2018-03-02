var helpers = require("./util/helpers")

module.exports = function(req, next){
  //req.endpoint = req.argv.endpoint || req.config.endpoint || 'surge.' + req.config.platform

  var commands = ['h','b', 'd','e','a','r','v','V','p','endpoint','project','domain','add','remove','version','verbose','token','help','pem', 'promo', 'build','$0','_'];

  var args = [];
  for (param in req.argv) {
    args.push(param)
  }

  var filteredSet = args.filter(function(n){ return (commands.indexOf(n) === -1) });

  if (filteredSet.length != 0) {
    helpers.log()
    helpers.trunc("Aborted - `" + filteredSet[0] + "` is not a surge command.").hr()
  } else {
    return next()
  }
}
