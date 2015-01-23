module.exports = function(req, next){
  return (req.argv["_"] && req.argv["_"]["0"] === "login")
    ? process.exit()
    : next()
}