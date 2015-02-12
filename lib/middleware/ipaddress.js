module.exports = function(req, next){

  if (req.status) {

  } else {
    console.log('         IP address:'.grey, "192.241.214.148")
    console.log()
    console.log("    Success! Project is published and running at".green, req.domain.underline)
    //console.log('             status:'.grey, req.status || "deployed")
    console.log("")
  }

  next()
}