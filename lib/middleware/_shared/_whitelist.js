var helpers = require("../../util/helpers")

module.exports = function(req, next){
  //req.endpoint = req.argv.endpoint || req.configuration.endpoint || 'surge.' + req.configuration.platform)

  var commands = ['h','b', 'd','e','a','r','v','V','p', 's', 'm', 'message', 'stage', 'endpoint','project','domain','add','remove','version','verbose','token','help','pem', 'promo', 'build', 'preview', 'web', 'manage', '$0','_'];

  var args = [];
  for (param in req.argv) {
    args.push(param)
  }

  var filteredSet = args.filter(function(n){ return (commands.indexOf(n) === -1) });

  if (filteredSet.length != 0) {
    helpers.log()
    helpers.trunc("Aborted".yellow + ` - \`${ filteredSet[0] }\` is not a surge argument.`.grey).hr()
    process.exit(1)
  } else {
    return next()
  }
}
