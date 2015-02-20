var helpers = require("./util/helpers")

module.exports = function(req, next){
  if (req.argv.help || req.argv.h) {
    helpers
      .log()
      .log("  Surge".bold, "- single-command web publishing.", ("(v" + req.pkg.version + ")"). grey)
      .log()
      .log("  Usage:".grey)
      .log("    surge [options]")
      .log()
      .log("  Options: ".grey)
      .log("    -p, --project       path to projects asset directory (./)")
      .log("    -d, --domain        domain of your project (<random>.surge.sh)")
      .log("    -e, --endpoint      domain of API server (surge.sh)")
      .log("    -g, --grant         grant publish access (email address)")
      .log("    -r, --revoke        revoke publish access (email address)")
      .log("    -V, --version       show the version number")
      .log("    -h, --help          show this help message")
      .log()
      .log("  Shorthand usage:".grey)
      .log("    surge [project path] [domain]")
      .log()
      .log("  Additional commands:".grey)
      .log("    surge whoami        show who you are logged in as")
      .log("    surge logout        expire local token")
      .log("    surge login         only performs authentication step")
      .log("    surge list          list all domains you have access to")
      .log()
      .log("  When in doubt, run ".grey + "surge".green.underline + " from within you project directory.".grey)
      .log()
  } else {
    next()
  }
}
