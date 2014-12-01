var helpers = require("./util/helpers")

module.exports = function(req, next){
  if (req.argv.help || req.argv.h) {
    helpers.log("  Usage:")
    helpers.log("    surge [options]")
    helpers.log()
    helpers.log("  Options: ")
    helpers.log("    -p, --project       path to projects asset directory (./)")
    helpers.log("    -d, --domain        domain of your project (<random>.surge.sh)")
    helpers.log("    -e, --endpoint      domain of API server (surge.sh)")
    helpers.log("    -a, --add           add collaborator via email address")
    helpers.log("    -r, --rem           remove collaborator via email address")
    helpers.log("    -v, --verbose       verbose output")
    helpers.log("    -V, --version       show the version number")
    helpers.log("    -h, --help          show this help message")
    helpers.log()
    helpers.log("  Shorthand usage:")
    helpers.log("    surge [project] [domain]")
  } else {
    next()
  }
}
