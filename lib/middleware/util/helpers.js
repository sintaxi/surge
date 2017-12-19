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


var fetchToken = exports.fetchToken = function(endpoint){
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



exports.payment = function(req, stripe_pk, existing){

  var abort = function(msg){
    console.log()
    console.log()
    console.log("   " + "Payment aborted.".grey + " You remain on the ".grey + req.subscription.plan.name.underline.grey + " plan.".grey)
    console.log()
    process.exit(1)
  }

  function card(cc, ep, cv, cb){
    read({
      silent: false,
      prompt: "        card number:".grey,
      default: cc,
      edit: true,
    }, function(er, cc){
      if (cc === undefined) return abort("Plan not changed.")
      read({
        prompt: "        exp (mo/yr):".grey,
        default: ep,
        edit: true,
      }, function(er, ep){
        if (ep === undefined) return abort("Plan not changed.")
        read({
          prompt: "                cvc:".grey,
          default: cv,
          edit: true,
        }, function(er, cv){
          if (cv === undefined) return abort("Plan not changed.")
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
            if (r.statusCode == 417){
              console.log()
              console.log("     Update Required".yellow, "-", obj)
              console.log()
              process.exit(1)
            } else if (r.statusCode == 401){
              console.log(r)
            } else if (r.statusCode == 402){
              var data = JSON.parse(b)
              var msg

              if (data.hasOwnProperty("error")){
                msg = data["error"]["message"]
                // console.log(data["error"])
                // if (data["error"]["param"] === "number"){
                //   msg = 'Invalid "card number". '
                // } else if (data["error"]["param"] === "exp_year"){
                //   msg = 'Invalid "exp" year. Please try again.'
                // } else if (data["error"]["param"] === "exp_month"){
                //   msg = 'Invalid "exp" month. Please try again.'
                // } else {
                //   msg = data["error"]["param"] + "is invalid. "
                // }
              }else{
                msg = "Card appears to be invalid. Please try again."
              }
                
              //msg = msg.charAt(0).toUpperCase() + msg.substring(1)

              log()
              log("  ", msg.grey)
              log()
              return card(cc, ep, cv, cb)
            } else if(r.statusCode == 200) {
              var data = JSON.parse(b)
              return cb(data.id)
            }else{
              log()
              log(("   Enter playment info to change to the " + req.plan.underline + " plan.").grey)
              log()
              card(cc, ep, cv, cb)
            }
          })

        })
      })
    })
  }

  if (existing !== null) {

    return function(callback){
      read({
        prompt: ("   Upgrade to " + req.plan.underline + " plan using " +  existing.brand.blue + " ending in ".grey + existing.last4.blue + "?".grey).grey,
        default: "yes",
        edit: true
      }, function(err, reply){
        if (err) console.log(err)

        if (reply === undefined) return abort("Plan not changed.")
        if (["Y", "y", "Yes", "yes"].indexOf(reply) !== -1){
          callback(null)
        } else {
          //log()
          //log("   Enter new payment method.".grey)
          log()
          card("", "", "", callback)
        }
      })
    }
  } else {
    return function(callback){
      //log()
      log(("   Enter playment info to change to the " + req.plan.underline + " plan.").grey)
      log()
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

