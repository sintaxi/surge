

module.exports = function(req, next){
  if (req.argv.help || req.argv.h) {
    console.log("  Usage:")
    console.log("    surge [options]")
    console.log()
    console.log("  Options: ")
    console.log("    -p, --project       path to projects asset directory (./)")
    console.log("    -d, --domain        domain of your project (random)")
    console.log("    -e, --endpoint      domain of API server")
    console.log("    -a, --adduser       add collaborator by email address")
    console.log("    -r, --remuser       remove collaborator by email address")
    console.log("    -v, --verbose       verbose output")
    console.log("    -h, --help          show this help message")
    console.log()
    console.log("  Shorthand usage:")
    console.log("    surge [project] [domain]")
  } else {
    next()
  }
}