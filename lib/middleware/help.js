
module.exports = function(req, next){
  if (req.argv.help || req.argv.h) {
    console.log("help")
  } else {
    next()
  }
}