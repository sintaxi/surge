var prompt      = require('prompt')

var request     = require("request")
var localCreds  = require("./creds.js")
var os          = require('os')
var url         = require("url")
var urlAddy     = require("url-parse-as-address")
var read        = require("read")
var isDomain    = require("is-domain")
var s           = 0
var pkg         = require("../../../package.json")


exports.read = read


var sig = '[' + 'surge'.cyan + ']'
sig = null


var reset = exports.reset = function(){
  s = 0
}

var show = exports.show = function(){
  process.stdout.write(s.toString())
}


var space = exports.space = function(){
  if (s === 0){
    s++
    console.log()
  }
}

var span = exports.gap = function(){
  s = 1
}

var log = exports.log = function(){
  var args = Array.prototype.slice.call(arguments)
  args.unshift(sig)
  args = args.filter(function(n){ return n != undefined });
  console.log.apply(console, args)
  s = 0
  return this
};

var hr = exports.hr = function(){
  return console.log()
};

var smart = exports.smart = function(str){
  var difference = 16 - str.length
  var rsp = ""
  for(var i=0; i < difference; i++){
    rsp += " "
  }
  return rsp + str
}

var trunc = exports.trunc = function(arg){
  log("   " + arg)
  s = 0
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


var fetchAccount = exports.fetchAccount = function(endpoint){

  return function(email, pass, callback){
    var options = {
      'url': url.resolve(endpoint.format(), '/account'),
      'method': 'get',
      headers: { version: pkg.version },
      'auth': {
        'user': "token",
        'pass': pass || "",
        'sendImmediately': true
      }
    }
    request(options, function(e, r, obj){
      if (e) throw e
      
      if (r.statusCode == 200){
        return callback(null, JSON.parse(obj))
      } else if (r.statusCode == 417){
        space()
        trunc("Aborted".yellow + " - your client requires upgrade".grey)
        space()
        process.exit(1)
      } else if (r.statusCode == 503){
        space()
        trunc("Error".red + " - Deployment endpoint temporarily unreachable".grey)
        space()
        process.exit(1)
      }else{
        return callback(JSON.parse(obj))
      }
    })
  }
}


var fetchToken = exports.fetchToken = function(endpoint){

  return function(email, pass, callback){

    var options = {
      'url': url.resolve(endpoint.format(), '/token'),
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
          var o = JSON.parse(obj)
          localCreds(endpoint).set(obj.email, o.token.replace(os.EOL, ""))
          return callback(null, o)
        } catch(e){
          return callback({"messages": ["password required"]})
        }

      }
    })
  }
}

var pattern = /^((([a-z]|\d|[!#\$%&'\*\+\-\/=\?\^_`{\|}~]|[\u00A0-\uD7FF\uF900-\uFDCF\uFDF0-\uFFEF])+(\.([a-z]|\d|[!#\$%&'\*\+\-\/=\?\^_`{\|}~]|[\u00A0-\uD7FF\uF900-\uFDCF\uFDF0-\uFFEF])+)*)|((\x22)((((\x20|\x09)*(\x0d\x0a))?(\x20|\x09)+)?(([\x01-\x08\x0b\x0c\x0e-\x1f\x7f]|\x21|[\x23-\x5b]|[\x5d-\x7e]|[\u00A0-\uD7FF\uF900-\uFDCF\uFDF0-\uFFEF])|(\\([\x01-\x09\x0b\x0c\x0d-\x7f]|[\u00A0-\uD7FF\uF900-\uFDCF\uFDF0-\uFFEF]))))*(((\x20|\x09)*(\x0d\x0a))?(\x20|\x09)+)?(\x22)))@((([a-z]|\d|[\u00A0-\uD7FF\uF900-\uFDCF\uFDF0-\uFFEF])|(([a-z]|\d|[\u00A0-\uD7FF\uF900-\uFDCF\uFDF0-\uFFEF])([a-z]|\d|-|\.|_|~|[\u00A0-\uD7FF\uF900-\uFDCF\uFDF0-\uFFEF])*([a-z]|\d|[\u00A0-\uD7FF\uF900-\uFDCF\uFDF0-\uFFEF])))\.)+(([a-z]|[\u00A0-\uD7FF\uF900-\uFDCF\uFDF0-\uFFEF])|(([a-z]|[\u00A0-\uD7FF\uF900-\uFDCF\uFDF0-\uFFEF])([a-z]|\d|-|\.|_|~|[\u00A0-\uD7FF\uF900-\uFDCF\uFDF0-\uFFEF])*([a-z]|[\u00A0-\uD7FF\uF900-\uFDCF\uFDF0-\uFFEF])))\.?$/i

exports.loginForm = function(req, callback){
  var count = 0

  var abort = function(msg){
    console.log()
    console.log("   " + "Aborted".yellow + (" - " + msg).grey)
    console.log()
    process.exit(1)
  }

  var promptEmail = function(suggestion, cb){
    req.read({
      silent: false,
      prompt: smart("email:").grey,
      default: suggestion,
      edit: true,
      terminal: req.config.terminal,
      output: req.config.output,
      input: req.config.input
    }, function(err, answer){
      if (answer === undefined) {
        console.log()
        return abort("Not authenticated.".grey)
      }
      if (!pattern.test(answer)){
        return promptEmail(answer, cb)
      } else {
        req.email = answer
        return cb()
      }
    })
  }


  var promptPassword = function(cb){
    var out = req.config.output
    s = 0
    if (out) out.isTTY = false
    read({
      prompt: smart("password:").grey,
      silent: true,
      edit: false,
      output: out,
      input: req.config.input
    }, function(err, password){
      if (password === undefined){
        console.log()
        return abort("Not authenticated.".grey)
      } 
      fetchToken(req.endpoint)(req.email, password, function(err, obj){
        if (err) {
          count++
          if (err.hasOwnProperty("details") && err["details"].hasOwnProperty("email")) process.exit(1)
          if (count >=3) {
            req.read({
              prompt: smart("forgot?").grey,
              default: "yes",
              terminal: req.config.terminal,
              output: req.config.output,
              input: req.config.input
            }, function(err, reply){
              if (reply == "yes" || reply == "y" || reply == "Y") {
                var options = {
                  'url': url.resolve(req.endpoint, "/token/reset/" + req.email),
                  'method': 'post'
                }
                request(options, function(e, r, obj){
                  if (e) throw e
                  if (r.statusCode == 201) {
                    console.log()
                    trunc("Password Recovery".yellow + " - reset instructions sent to".grey, req.email.green)
                    console.log()
                    process.exit(1)
                  } else {
                    console.log()
                    trunc("Oops".red + " - something went wrong trying to reset your password.".grey)
                    console.log()
                    process.exit(1)
                  }
                })
              } else {
                console.log()
                trunc("Aborted".yellow + (" - No password reset sent to " + req.email.underline + ".").grey)
                console.log()
                process.exit(1)
              }
            })
          } else {
            return promptPassword()
          }
        } else {
          // req.creds = localCreds(req.argv.endpoint || req.config.endpoint || 'surge.' + req.config.platform).set(obj.email, obj.token)
          return callback({
            email: obj.email, 
            token: obj.token
          })
        }
      })
    })
  }

  promptEmail("", function(){
    promptPassword(function(token){
      console.log("token", token)
      console.log("hi", req.email)
    })
  })

}


exports.payment = function(req, stripe_pk, existing){

  var abort = function(msg){
    if (req.plan){
      console.log()
      try{
        console.log("   " + "Aborted".yellow + " - You remain on the ".grey + req.subscription.plan.name.underline.grey + " plan.".grey)    
      }catch(e) {
        console.log("   " + "Aborted".yellow + " - No charge processed.".grey)  
      }
    } else {
      console.log()
      console.log("   " + "Aborted".yellow + " - Changed not made.".grey)
    }
    console.log()
    process.exit(1)
  }

  function card(cc, ep, cv, cb){
    read({
      silent: false,
      prompt: smart("card number:").grey,
      default: cc,
      edit: true,
    }, function(er, cc){
      if (cc === undefined){
        console.log()
        return abort("Plan not changed.")
      } 
      read({
        prompt: smart("exp (mo/yr):").grey,
        default: ep,
        edit: true,
      }, function(er, ep){
        if (ep === undefined){
          console.log()
          return abort("Plan not changed.")
        } 
        read({
          prompt: smart("cvc:").grey,
          default: cv,
          edit: true,
        }, function(er, cv){
          if (cv === undefined){
            console.log()
            return abort("Plan not changed.")
          } 
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
              space()
              trunc("Update Required".yellow, "-", obj)
              space()
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

              req.plan
                ? log(("   Enter playment info to change to the " + req.plan.underline + " plan.").grey)
                : log(("   Enter playment method to be used").grey)

              log()
              
              return card(cc, ep, cv, cb)
            }
          })

        })
      })
    })
  }

  if (existing !== null) {

    return function(callback){
      var prompt = req.plan
        ? ("   Change to the " + req.plan.underline + " plan using " +  existing.brand.underline.grey + " ending in ".grey + existing.last4.underline.grey + "?".grey).grey
        : ("   Use " +  existing.brand.underline + " ending in ".grey + existing.last4.underline.grey + "?".grey).grey

      read({
        prompt: prompt,
        default: "yes",
        edit: true
      }, function(err, reply){
        if (err){
          console.log()
          return abort("whatever")
        } 

        if (reply === undefined){
          console.log()
          return abort("Plan not changed.")
        } 
        if (["Y", "y", "Yes", "yes"].indexOf(reply) !== -1){
          return callback(null)
        } else {
          //log()
          //log("   Enter new payment method.".grey)
          log()
          return card("", "", "", callback)
        }
      })
    }
  } else {
    return function(callback){
      //log()

      if (req.plan){
        log(("   Enter payment info to change to the " + req.plan.underline + " plan.").grey)
      } else {
        //log()
        log(("   Enter payment method to be used").grey)
      }
      
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

