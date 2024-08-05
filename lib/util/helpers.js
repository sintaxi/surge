var colors      = require("colors")
var request     = require("request")
var localCreds  = require("./creds.js")
var os          = require('os')
var url         = require("url")
var urlAddy     = require("url-parse-as-address")
var read        = require("read")
var isDomain    = require("is-domain")
var s           = 0
var pkg         = require("../../package.json")

var url         = require("url")
var Table       = require("cli-table3")
var prompts     = require("prompts")

var tableRevisions = require("./table-revision.js")
var tableRegions = require("./table-regions.js")
var tables = require("./tables.js")


exports.read = read


var sig = '[' + 'surge'.cyan + ']'
sig = null


var reset = exports.reset = function(){
  s = 0
}

var show = exports.show = function(){
  process.stdout.write(s.toString())
}


var space = exports.space = function(d){
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

var shortsmart = exports.shortsmart = function(str){
  var difference = 12 - str.length
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

var switchRevision = exports.switchRevision = function(domain, rev, callback){
  var options = {
    'url': url.resolve(endpoint.format(), domain + "/cutover"),
    'method': 'put',
    'headers': { version: pkg.version },
    'form': { rev: rev },
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
      } else if (r.statusCode == 404){
        console.log("here")
        return callback(null)
      }else{
        return callback(JSON.parse(obj))
      }
    })
  }
}


var displayErrors = exports.displayErrors = function(error){
  error.messages.forEach(function(m){ trunc("Error".red + (" - " + m).grey); })
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
      terminal: req.configuration.terminal,
      output: req.configuration.output,
      input: req.configuration.input
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
    var out = req.configuration.output
    s = 0
    if (out) out.isTTY = false
    read({
      prompt: smart("password:").grey,
      silent: true,
      edit: false,
      output: out,
      input: req.configuration.input
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
              terminal: req.configuration.terminal,
              output: req.configuration.output,
              input: req.configuration.input
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

exports.displayAudience = function(data){
  var table = tables.audience(data)
  var rows  = table.toString().split("\n")
  space()
  rows.forEach(function(row, i){
    log(" ", row.grey)
  })
  space()
}

exports.displayAudit = function(data){
  var table = tables.audit(data)
  var rows  = table.toString().split("\n")
  space()
  rows.forEach(function(row, i){
    log(" ", row.grey)
  })
  space()
}

exports.displayManifest = function(data, domain){
  var table = tables.manifest(data, domain)
  var rows  = table.toString().split("\n")
  space()
  rows.forEach(function(row, i){
    log(" ", row.grey)
  })
  space()
}

exports.displayUsage = function(data){
  var table = tables.usage(data)
  var rows  = table.toString().split("\n")
  space()
  rows.forEach(function(row, i){
    log(" ", row.grey)
  })
  space()
}

exports.displayTraffic = function(data){
  var table = tables.traffic(data)
  var rows  = table.toString().split("\n")
  space()
  rows.forEach(function(row, i){
    log(" ", row.grey)
  })
  space()
}

exports.displayCurrent = function(data){
  var table = tables.load(data)
  var rows  = table.toString().split("\n")
  space()
  rows.forEach(function(row, i){
    log(" ", row.grey)
  })
  space()
}

exports.displayRevisionBasicInfo = function(revision, domain){
  space()
  trunc((revision.preview.underline).grey + (" (" + revision.publicFileCount + " files, " + revision.publicTotalSize + " size)").grey)
  trunc(("by " + revision.email).grey)
  space()
}

exports.displayRollforeInfo = function(response, domain){
  var table = tables.rollfore(response)
  var rows  = table.toString().split("\n")
  space()
  rows.forEach(function(row, i){
    log(" ", row.grey)
  })
  space()
}

exports.displayRollbackInfo = function(response, domain){
  var table = tables.rollback(response)
  var rows  = table.toString().split("\n")
  space()
  rows.forEach(function(row, i){
    log(" ", row.grey)
  })
  space()
}

exports.displayRevision = function(payload){
  space()
  log("   Promoted revision ".grey + payload.revision.rev + " to production.".grey)
  space()
}

exports.displayPreview = function(payload){
  //log(smart("preview:").grey + " " + payload.metadata.preview.underline)
  log("   live preview..............................................".grey + " " + payload.metadata.preview.grey.underline)
}

exports.displayCname = function(payload){
  if (payload.cname) log(smart("cname:").grey + " " + payload.cname.underline)
}

exports.displayRegions = function(payload, domain){
  var table = tableRegions(payload, domain)
  var rows  = table.toString().split("\n")
  //log(smart("CNAME:").grey + " dns.surge.sh " + "(or use NS servers below)".grey)
  //space()
  //log("   Preview at ".grey + "https://123456789.sintaxi.com".grey.underline)
  //log("   Origin regions…".grey)
  space()
  rows.forEach(function(row, i){
    log(" ", row.grey)
  })
  space()
}

var displayServers = exports.displayServers = function(instances){
  var table = tables.instances(instances)
  var rows  = table.toString().split("\n")
  //log(smart("CNAME:").grey + " dns.surge.sh " + "(or use NS servers below)".grey)
  //space()
  //log("   Preview at ".grey + "https://123456789.sintaxi.com".grey.underline)
  //log("   Origin regions…".grey)
  space()
  rows.forEach(function(row, i){
    log(" ", row.grey)
  })
  space()
}

exports.displayNameServers = function(instances, domain){
  var table = tables.instances(instances)
  var rows  = table.toString().split("\n")
  //log(smart("CNAME:").grey + " dns.surge.sh " + "(or use NS servers below)".grey)
  //space()
  //log("   Preview at ".grey + "https://123456789.sintaxi.com".grey.underline)
  //log("   Origin regions…".grey)
  space()
  rows.forEach(function(row, i){
    log(" ", row.grey)
  })
  space()
}

var displayConfirmations = exports.displayConfirmations = function(response){
  if (response.unconfirmed){
    
    if (response.confirmed && response.confirmed.length > 0){
      trunc("Confirmed:".grey)
      trunc("  " + response.confirmed.join(", ").green)
      space()
    }
    
    if (response.unconfirmed && response.unconfirmed.length > 0){
      trunc("Unconfirmed:".grey)
      trunc("  " + response.unconfirmed.join(", ").yellow)  
      space()
    }
    
  }
}

var displayConfig = exports.displayConfig = function(props, args){
  args = args || { short: false }

  var keys = Object.keys(props)
  if (keys.length == 0){
    //space()
    trunc(("Empty").grey)
  }else{
    //space()
    keys.forEach(function(k){
      var key   = k
      var value = props[k]
    
      if (props[k] === null){
        key   = shortsmart(key).grey
        value = "null".grey
      } else if (!isNaN(parseInt(value))){
        key   = shortsmart(key).grey
        value = value.toString().green
      } else {
        key   = shortsmart(key).grey
        value = value.green
      }

      if (props[k] !== null){
        log("   " + key + ": ".grey + value) 
      }else{
        if (!args.short) 
          log("   " + key + ": ".grey + value) 
      }
    })
    space()
  }
}


var displayCertInfo = exports.displayCertInfo = function(payload, args){
  if (payload.certs.length === 0){
    if (args.showEmpty) trunc("Empty".grey)
  }else{
    if (args.short === true){
      var table = tables.certsShort(payload.certs, args.colWidth)
      var rows = table.toString().split("\n")
      rows.forEach(function(row, i){
        log(" ", row.grey)
      })
    }else{
      payload.certs.forEach(function(cert, i){
        var table = tables.cert(cert)
        var rows = table.toString().split("\n")
        rows.forEach(function(row, i){
          log("  ", row.grey)
        })
      })
    }    
  }  
}

var displayMsgs = exports.displayMsgs = function(msgs, args){
  if (msgs){
    var table = tables.msgs(msgs, args.colWidth)
    var rows = table.toString().split("\n")
    rows.forEach(function(row, i){
      log(" ", row)
    })
  }
}

exports.displayPublishInfo = function(payload){
  if (payload.config) 
    displayConfig(payload.config, { short: true })

  var nameservers = payload.instances.filter(function(s){
    s.type == "NS"
  })

  // payload.msgsTop = [{ msg: "suggestion: run `surge encrypt sintaxi.com` to provision cert", color: "yellow", align: "left" }]
  // payload.msgsMid = [{ msg: "suggestion: run `surge encrypt sintaxi.com` to provision cert", color: "yellow" }]
  // payload.msgsBot = [{ msg: "suggestion: run `surge encrypt sintaxi.com` to provision cert", color: "yellow" }]

  var table      = tables.instances(payload.instances)
  var rows       = table.toString().split("\n")
  var tableCols  = rows[0].replace(/[\u001b\u009b][[()#;?]*(?:[0-9]{1,4}(?:;[0-9]{0,4})*)?[0-9A-ORZcf-nqry=><]/g, '').length
  
  if (payload.msgsTop) 
    displayMsgs(payload.msgsTop, { short: true, showEmpty: false, colWidth: tableCols })

  if (payload.certs) 
    displayCertInfo(payload, { short: true, showEmpty: false, colWidth: tableCols })

  if (payload.msgsMid) 
    displayMsgs(payload.msgsMid, { short: true, showEmpty: false, colWidth: tableCols })
  
  //space()
  rows.forEach(function(row, i){ log(" ", row.grey) })
  //space()

  if (payload.msgsBot) 
    displayMsgs(payload.msgsBot, { short: true, showEmpty: false, colWidth: tableCols })
  
  var pad = function(str, len){
    if (str.length >= len) return str
    return pad("." + str, len)
  }

  var displayURL = function(u){
    var pre      = u.name + " "
    var pst      = u.domain
    var preCount = pre.length
    var pstCount = pst.length
    var numDots  = tableCols - pre.length - pst.length - 2
    var dots = pad(" ", numDots)
    log("   " + [pre, dots, pst.underline].join("").grey)
  }

  if (payload.urls) payload.urls.forEach(displayURL)
  space()
}




exports.displayInvites = function(payload){
  var table = tables.invites(payload.invites)
  var rows = table.toString().split("\n")
  rows.forEach(function(row, i){
    log(row.grey)
  })
  space()
}





var displayZoneFull = exports.displayZoneFull = function(payload){
  var table = tables.zone(payload)
  var rows = table.toString().split("\n")
  rows.forEach(function(row, i){ log("", row.grey); })
  space()
}

var displayZonePart = exports.displayZonePart = function(payload){
  var table = tables.customRecords(payload)
  var rows = table.toString().split("\n")
  rows.forEach(function(row, i){ log("", row.grey); })
  space()
}

exports.displayRecords = function(arg, type){
  reset()
  if (!arg.records || arg.records.length === 0){
    trunc("Empty".grey)
  }else{
    if (type === "dns"){
      return displayZonePart(arg)
    }else if(type === "zone"){
      return displayZoneFull(arg)
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

exports.parseDomainsEmails = function(args){
  var domains = []
  var emails = []

  args.forEach(function(item){
    if (item.indexOf("@") !== -1){
      emails.push(item)
    } else {
      if (item.split(".").length > 1){
        domains.push(item)
      }
    }
  })

  return {
    domains: domains,
    emails: emails
  }
}

exports.defaults = {
  
  403: function(e, r, b){
    space()
    trunc("Unauthorized".yellow + " - Insufficient permission to access domain.".grey)
    space()
    process.exit(1)
  },

  404: function(e, r, b){
    space()
    trunc("Error".red + " - Not Found".grey)
    space()
    process.exit(1)
  }

}