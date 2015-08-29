var helpers = require("./util/helpers")
var chalk = require('chalk')

module.exports = function(req, next){
  if (req.argv.help || req.argv.h || req.argv["_"][0] === "help") {
    helpers
      .log()
      .log("  Surge".bold, "– Single-command web publishing.", chalk.dim("(v" + req.pkg.version + ")"))
      .log()
      .log(chalk.dim("  Usage:"))
      .log("    surge [options]")
      .log()
      .log(chalk.dim("  Options:"))
      .log("    -p, --project       path to projects asset directory (./)")
      .log("    -d, --domain        domain of your project (<random>.surge.sh)")
      .log("    -e, --endpoint      domain of API server (surge.sh)")
      .log("    -a, --add           adds user to list of collaborators (email address)")
      .log("    -r, --remove        removes user from list of collaborators (email address)")
      .log("    -V, --version       show the version number")
      .log("    -h, --help          show this help message")
      .log()
      .log(chalk.dim("  Shorthand usage:"))
      .log("    surge [project path] [domain]")
      .log()
      .log(chalk.dim("  Additional commands:"))
      .log("    surge whoami        show who you are logged in as")
      .log("    surge logout        expire local token")
      .log("    surge login         only performs authentication step")
      .log("    surge list          list all domains you have access to")
      .log("    surge teardown      tear down a published project")
      .log()
      .log(chalk.dim("  Guides:"))
      .log("    Getting started     " + chalk.dim.underline("surge.sh/help/getting-started-with-surge"))
      .log("    Custom domains      " + chalk.dim.underline("surge.sh/help/adding-a-custom-domain"))
      .log("    Additional help     " + chalk.dim.underline("surge.sh/help"))
      .log()
      .log(chalk.dim("  When in doubt, run ") + chalk.green.underline("surge") + chalk.dim(" from within you project directory."))
      .log()

  } else {
    next()
  }
}
