var prompt = require('prompt')

var sig = '[' + 'surge'.cyan + ']'
sig = null

exports.log = function(){
  var args = Array.prototype.slice.call(arguments)
  args.unshift(sig)
  args = args.filter(function(n){ return n != undefined });
  console.log.apply(console, args)
  return this
};

// prompt
prompt.message = sig
prompt.delimiter = ""

exports.prompt = prompt
