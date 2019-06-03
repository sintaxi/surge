var helpers = require("./util/helpers")

module.exports = function(req, next){
  if (req.argv.help || req.argv.h) {
    helpers
      .log()
      .log("  " + req.config.name.bold, "– single command web publishing.".grey, ("(v" + req.pkg.version + ")"). grey)
      .log()
      .log("  Usage:".grey)
      .log("    "+ req.config.name +" <project> <domain>")
      .log()
      .log("  Options:".grey)
      .log("    -a, --add           adds user to list of collaborators (email address)")
      .log("    -r, --remove        removes user from list of collaborators (email address)")
      .log("    -V, --version       show the version number")
      .log("    -h, --help          show this help message")
      .log()
      .log("  Additional commands:".grey)
      .log("    "+ req.config.name +" whoami        show who you are logged in as")
      .log("    "+ req.config.name +" logout        expire local token")
      .log("    "+ req.config.name +" login         only performs authentication step")
      .log("    "+ req.config.name +" list          list all domains you have access to")
      .log("    "+ req.config.name +" teardown      tear down a published project")
      .log("    "+ req.config.name +" plan          set account plan")
      .log()
      // .log("  Examples:".grey)
      // .log("    surge ./www example.com")
      // .log("    surge .")
      // .log()
      .log("  Guides:".grey)
      .log("    Getting started     " + "surge.sh/help/getting-started-with-surge".underline.grey)
      .log("    Custom domains      " + "surge.sh/help/adding-a-custom-domain".underline.grey)
      .log("    Additional help     " + "surge.sh/help".underline.grey)
      .log()
      .log("  When in doubt, run ".grey + req.config.name.green.underline + " from within your project directory.".grey)
      .log()

  } else {
    next()
  }
}
