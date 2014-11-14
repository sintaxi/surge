

module.exports = function(req, next){
  if (req.argv.help || req.argv.h) {
    console.log("  Usage:")
    console.log("    surge [options]")
    console.log()
    console.log("  Options: ")
    console.log("    -p, --project       path to projects asset directory (./)")
    console.log("    -d, --domain        domain of your project (<random>.surge.sh)")
    console.log("    -e, --endpoint      domain of API server (surge.sh)")
    console.log("    -a, --add           add collaborator via email address")
    console.log("    -r, --rem           remove collaborator via email address")
    console.log("    -v, --verbose       verbose output")
    console.log("    -h, --help          show this help message")
    console.log()
    console.log("  Shorthand usage:")
    console.log("    surge [project] [domain]")
  } else {
    next()
  }
}