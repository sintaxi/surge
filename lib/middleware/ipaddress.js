module.exports = function(req, next){

  if (req.success === true) {
    console.log()
    console.log("    Succes!".green + " - Project is published and running at ".grey + req.domain.green.underline + ".".grey)
    console.log()
  } else {
    console.log()
    console.log("    Error".red + " - Deployment failed. ".grey)
    console.log()
  }

  return next()
}