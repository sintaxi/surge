var request     = require("request")
var localCreds  = require("./creds.js")
var os          = require('os')
var url         = require("url")
var urlAddy     = require("url-parse-as-address")


var sig = '[' + 'surge'.cyan + ']'
sig = null

exports.log = function(){
  var args = Array.prototype.slice.call(arguments)
  args.unshift(sig)
  args = args.filter(function(n){ return n != undefined });
  console.log.apply(console, args)
  return this
};

exports.hr = function(){
  this.log()
  return this
}

exports.stacktrace = function(str, options){
  var lineno  = options.lineno  || -1
  var context = options.context || 8
  var context = context = context / 2
  var lines   = (os.EOL + str).split(os.EOL)
  var start   = Math.max(lineno - context, 1)
  var end     = Math.min(lines.length, lineno + context)

  if(lineno === -1) end = lines.length

  var pad     = end.toString().length

  var context = lines.slice(start, end).map(function(line, i){
    var curr = i + start
    return (curr == lineno ? ' > ' : '   ')
      + Array(pad - curr.toString().length + 1).join(' ')
      + curr
      + '| '
      + line
  }).join(os.EOL)

  return context
}


exports.fetchToken = function(endpoint){

  return function(email, pass, callback){
    var options = {
      'url': url.resolve(urlAddy.parse(endpoint).format(), '/token'),
      'method': 'post',
      'auth': {
        'user': email,
        'pass': pass || "",
        'sendImmediately': true
      }
    }
    request(options, function(e, r, obj){
      if (e) throw e

      if(r.statusCode == 401){
        var obj = JSON.parse(obj)
        return callback(obj, null)
      }else{
        try {
          var obj = JSON.parse(obj)
          var c   = localCreds(endpoint).set(obj.email, obj.token.replace(os.EOL, ""))
          return callback(null, c)
        } catch(e){
          return callback({"messages": ["password required"]})
        }

      }
    })
  }

}


