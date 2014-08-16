var prompt = require('prompt')

exports.log = function(){
  var sig = '[' + 'surge'.cyan + ']'
  var args = Array.prototype.slice.call(arguments)
  args.unshift(sig)
  console.log.apply(console, args)
  return this
};