module.exports = function(req, next){
  if (req.argv["_"] && req.argv["_"]["0"] === "login") {
    console.log()
    console.log("    Logged in! Your access token stored in " + path.join(process.env.HOME || process.env.HOMEPATH, ".netrc") + " file")
    console.log()
    process.exit()
  } else {
    next()
  }
}