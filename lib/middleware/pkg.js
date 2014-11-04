
module.exports = function(req, next){
  req.pkg = require(__dirname + "/../../package.json")
  next()
}