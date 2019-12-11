module.exports = function(req, next){

  if (req.success === true) {
    console.log()
    console.log("   Success!".green + (" - Published to " + (req.domain).underline).grey)
    console.log()
  } else {
    console.log()
    console.log("   Error".red + " - Deployment failed. ".grey)
    console.log()
  }

  return next()
}