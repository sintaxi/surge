module.exports = function(req, next){
  console.log(req.argv)
  next()
}

// var surge(args, function(err, stream){

//   stream.on("message", function(){

//   })

//   stream.on("err", function(){

//   })
// })