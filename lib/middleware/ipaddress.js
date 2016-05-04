module.exports = function(req, next){

  if (req.status) {

  } else {
    console.log()
    console.log("    Success!".green + " Project is published and running at " + req.domain.green.underline)
    console.log("")
  }

  next()
}