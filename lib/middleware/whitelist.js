var helpers = require("./util/helpers")

module.exports = function(req, next){
  var commands = ['h','d','e','a','V','domain','endpoint','project','add','rem','help','$0','_'];

  var args = [];
  for (param in req.argv) {
    args.push(param);
  }

  var filteredSet = args.filter(function(n){ return (commands.indexOf(n) === -1) });

  if (filteredSet.length != 0) {
    helpers.log("       surge: `--" + filteredSet[0] + "` is not a surge command.")
  } else {
    next()
  }
}