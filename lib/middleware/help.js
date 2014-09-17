

module.exports = function(req, next){
  if (req.argv.help || req.argv.h) {
    console.log()
    console.log("  Usage:")
    console.log()
    console.log("    surge [options]")
    console.log()
    console.log("  Options: ")
    console.log()
    console.log("    -p, --project       path to project asset directory (./)")
    console.log("    -d, --domain        domain of your project (random)")
    console.log()
    console.log("  Shorthand usage:")
    console.log()
    console.log("    surge [project] [domain]")
    console.log()
  } else {
    next()
  }
}