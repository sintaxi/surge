var updateNotifier = require("update-notifier");
var helpers        = require("./util/helpers");
var pkg            = require(__dirname + "./../../package.json");

module.exports = function(req, next){
  // Checks for available update and returns an instance
  var notifier = updateNotifier({
    // updateCheckInterval: 1000, // For testing
    pkg: pkg
  });

  helpers
    .log("                    ┌────────────────────────────────────────┐ ".grey)
    .log("                    │  ".grey + "A new version of " + "Surge".bold + " is available!" + "  │".grey)
    .log("                    │  ".grey + "Yours:  ".grey + "v" + notifier.update.current + "                        │".grey)
    .log("                    │  ".grey + "Latest: ".grey + "v" + notifier.update.latest + "        ack               │".grey)
    .log("                    │                                        │".grey)
    .log("                    │  ".grey + "Run " + "npm install -g ".green + notifier.update.name.green + " to update." + "   │".grey)
    .log("                    └────────────────────────────────────────┘ ".grey)
    .log()
    .log()

  next();
}
