
// lets onion skin cli!!
//
module.exports = function(req, stack){
  var that  = this
  var index = 0

  function next(err){
    var layer = stack[index++]
    if(!layer) return
    layer.call(that, req, next)
  }

  next()
}