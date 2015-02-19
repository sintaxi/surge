var helpers = require("./util/helpers")

module.exports = function(req, next){
  if (req.argv.help || req.argv.h) {
    helpers.log()
    helpers.log("  Usage:")
    helpers.log("    surge [options]")
    helpers.log()
    helpers.log("  Options: ")
    helpers.log("    -p, --project       path to projects asset directory (./)")
    helpers.log("    -d, --domain        domain of your project (<random>.surge.sh)")
    helpers.log("    -e, --endpoint      domain of API server (surge.sh)")
    helpers.log("    -a, --add           add collaborator(s) via email address")
    helpers.log("    -r, --rem           remove collaborator(s) via email address")
    helpers.log("    -V, --version       show the version number")
    helpers.log("    -h, --help          show this help message")
    helpers.log()
    helpers.log("  Shorthand usage:")
    helpers.log("    surge [project] [domain]")
    helpers.log()
    helpers.log("  Additional commands (reserved):")
    helpers.log("    surge whoami        show who you are logged in as")
    helpers.log("    surge logout        expire local token")
    helpers.log("    surge login         only performs authentication step")
    helpers.log("    surge list          list all domains you have access to")
    helpers.log()
  } else {
    next()
  }
}
