module.exports = function(req, next){
  if (req.argv["_"] && req.argv["_"]["0"] === "login") {
    console.log()
    console.log("    Logged in! Your access token stored in ~/.netrc file")
    console.log()
    process.exit()
  } else {
    next()
  }
}