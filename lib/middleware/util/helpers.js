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

process.on('uncaughtException', function(err) {
  exports.log('\n          @getSurge:'.grey, 'See you next time!\n')
  // if (req.argv.v)
  //   exports.log(e.stack)
  process.exit(99);
});

process.on('SIGINT', function(err) {
  exports.log('\n          @getSurge:'.grey, 'See you next time!\n\n')
  process.exit(99);
});
