var helpers = require("./util/helpers")

module.exports = function(req, next){
  var commands = ['h','b', 'd','e','a','r','v','V','p','endpoint','project','domain','add','remove','version','verbose','token','help','pem', 'build','$0','_'];

  var args = [];
  for (param in req.argv) {
    args.push(param);
  }

  var filteredSet = args.filter(function(n){ return (commands.indexOf(n) === -1) });

  if (filteredSet.length != 0) {
    helpers.log()
    helpers.log("       surge: `--" + filteredSet[0] + "` is not a surge command.").hr()
  } else {
    next()
  }
}
