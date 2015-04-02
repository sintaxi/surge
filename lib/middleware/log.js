module.exports = function(req, next){
  console.log(req.argv)
  console.log(req.args)
  next()
}