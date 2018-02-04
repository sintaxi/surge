module.exports = function(req, next){
  console.log(req.argv)
  next()
}