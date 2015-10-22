var prompt      = require('prompt')

var request     = require("request")
var localCreds  = require("./creds.js")
var os          = require('os')
var url         = require("url")
var urlAddy     = require("url-parse-as-address")
var read = require("read")
var isDomain = require("is-domain")

exports.read = read


var sig = '[' + 'surge'.cyan + ']'
sig = null

var log = exports.log = function(){
  var args = Array.prototype.slice.call(arguments)
  args.unshift(sig)
  args = args.filter(function(n){ return n != undefined });
  console.log.apply(console, args)
  return this
};

exports.hr = function(){
  this.log()
  return this
};


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

      if(r.statusCode == 417){
        console.log()
        console.log("     Update Required".yellow, "-", obj)
        console.log()
        process.exit(1)
      } else if(r.statusCode == 401){
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

var abort = function(msg){
  console.log()
  console.log()
  console.log("    Aborted".yellow + " -", msg)
  console.log()
  process.exit(1)
}

exports.payment = function(req, stripe_pk, existing){

  function card(cc, ep, cv, cb){
    read({
      silent: false,
      prompt: "        card number:".grey,
      default: cc,
      edit: true,
    }, function(er, cc){
      if (cc === undefined) return abort("Payment not received.")
      read({
        prompt: "        exp (mo/yr):".grey,
        default: ep,
        edit: true,
      }, function(er, ep){
        if (ep === undefined) return abort("Payment not received.")
        read({
          prompt: "                cvc:".grey,
          default: cv,
          edit: true,
        }, function(er, cv){
          if (cv === undefined) return abort("Payment not received.")
          request({
            uri: "https://"+ stripe_pk +":@api.stripe.com/v1/tokens",
            method: "POST",
            form: {
              card: {
                number: cc,
                exp_month: ep.split("/")[0],
                exp_year: ep.split("/")[1],
                cvc: cv
              }
            }
          }, function(e,r,b) {
            //console.log("POST TOKEN RSP:", r.statusCode)
            if (r.statusCode == 417){
              console.log()
              console.log("     Update Required".yellow, "-", obj)
              console.log()
              process.exit(1)
            } else
            if (r.statusCode == 402){
              var data = JSON.parse(b)
              var msg = "Card appears to be invalid"

              if (data.hasOwnProperty("error"))
                msg = data["error"]["param"] + " appears to be invalid. "

              msg += "Please try again."
              msg = msg.charAt(0).toUpperCase() + msg.substring(1)

              log()
              log("      ", msg.yellow)
              return card(cc, ep, cv, cb)
            } else if(r.statusCode == 200) {
              var data = JSON.parse(b)
              return cb(data.id)
            }
          })

        })
      })
    })
  }

  if (existing !== null) {
    return function(callback){
      read({
        prompt: ("      Would you like to charge " +  existing.brand + " ending in " + existing.last4.yellow + "?".blue).blue,
        default: "yes",
        edit: true
      }, function(err, reply){
        if (reply === undefined) return abort("Payment not received.")
        if (["Y", "y", "Yes", "yes"].indexOf(reply) !== -1){
          callback(null)
        } else {
          log()
          log("      Please enter new payment method..." + " [all payment transfers are PCI compliant]".grey)
          card("", "", "", callback)
        }
      })
    }
  } else {
    return function(callback){
      log()
      log("      Please enter your payment info..." + " [all payment transfers are PCI compliant]".grey)
      card("", "", "", callback)
    }
  }

}

exports.validDomain = function(domain) {
  if (domain && (isDomain(domain) === true || isDomain(urlAddy(domain).host) === true)) {
    return true
  } else {
    return false
  }
}

