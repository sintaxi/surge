
//var middleware  = require('./middleware')
var help            = require('./middleware/help')
var skin            = require('./middleware/util/skin.js')
var read            = require("read")
var minimist        = require('minimist')

var whitelist       = require("./middleware/_shared/whitelist")
var endpoint        = require("./middleware/_shared/endpoint")
var pkg             = require("./middleware/_shared/pkg")
var version         = require("./middleware/_shared/version")
var welcome         = require("./middleware/_shared/welcome")
var creds           = require("./middleware/_shared/creds")
var whoami          = require("./middleware/_shared/whoami")
var tokencheck      = require("./middleware/_shared/tokencheck")
var email           = require("./middleware/_shared/email")
var auth            = require("./middleware/_shared/auth")
var logout          = require("./middleware/_shared/logout")
var project         = require("./middleware/_shared/project")
var size            = require("./middleware/_shared/size")
var domain          = require("./middleware/_shared/domain")
var protocol        = require("./middleware/_shared/protocol")
var deploy          = require("./middleware/_shared/deploy")
var domainOrSilent  = require("./middleware/_shared/domainOrSilent")
var pemOrSilent     = require("./middleware/_shared/pemOrSilent")
var ipaddress       = require("./middleware/_shared/ipaddress")
var login           = require("./middleware/_shared/login")
var shorthand       = require("./middleware/_shared/shorthand")
var list            = require("./middleware/_shared/list")

var token           = require("./middleware/_shared/token")
var teardown        = require("./middleware/_shared/teardown")
var discovery       = require("./middleware/_shared/discovery")
var plus            = require("./middleware/_shared/plus")
var subscription    = require("./middleware/_shared/subscription")
var plans           = require("./middleware/_shared/plans")
var plan            = require("./middleware/_shared/plan")
var payment         = require("./middleware/_shared/payment")
var card            = require("./middleware/_shared/card")
var setcard         = require("./middleware/_shared/setcard")
var subscribe       = require("./middleware/_shared/subscribe")
var ssl             = require("./middleware/_shared/ssl")
var log             = require("./middleware/_shared/log")


var select          = require("./middleware/select")
var yankrev         = require("./middleware/yankrev")
var rollback        = require("./middleware/rollback")
var rollfore        = require("./middleware/rollfore")
var cutover         = require("./middleware/cutover")

var helpers         = require('./middleware/util/helpers')




var exitifcurrentplan = function(req, next){
  if (req.plans.current && req.plans.current.id === req.selectedPlan.id){
    helpers.trunc("Success".green + (" - You remain on the " + req.plans.current.name.underline + " plan.").grey)
    helpers.space()
    process.exit()
  }else{
    return next()
  }
}


var space = function(req, next){ 
  helpers.space()
  next() 
}

var parse = function(arg){
  if(arg.hasOwnProperty("parent") && arg.parent.hasOwnProperty("rawArgs")){
    arg = arg.parent.rawArgs.slice(3)
  } else if (arg.argv && arg.argv._) {
    arg = arg.parsed.argv._.slice(1)
  }
  return arg instanceof Array
    ? minimist(arg)
    : arg
}

module.exports = function(config){
  config = config || {}

  var ep = config.endpoint
    ? config.endpoint
    : config.platform ? "https://surge." + config.platform : 'https://surge.surge.sh'

  config.platform = config.platform || "surge.sh"
  config.name = config.name || "surge"

  var options = {
    alias: {
      p: 'project',
      d: 'domain',
      e: 'endpoint',
      a: 'add',
      r: 'remove'
    },
    default: { e: ep }
  }

  var authInfo = function(req, next){
    var str = ("Running as " + req.account.email.underline).grey
    if (req.account.plan){ str = str + (" (" + req.account.plan.name + ")").grey }
    helpers.space()
    helpers.trunc(str)
    helpers.space()
    return next()
  }

  var surge = function(args){
    // will be one of:
    // commander, yargs, process.argv.split(2), OR minimist

    var argv = minimist(args, options)
    var cmd  = argv._[0]

    var commands = [
      "login", 
      "logout", 
      "whoami", 
      "list", 
      "rollback", 
      "rollfore",
      "cutover", 
      "yankrev", 
      "publish", 
      "teardown", 
      "select", 
      "token", 
      "plus", 
      "ssl", 
      "plan", 
      "card"
      ]

    if (commands.indexOf(cmd) !== -1) {
      argv._.shift()
      surge[cmd]({})(argv)
    } else if(config.default && commands.indexOf(config.default) !== -1 ){
      surge[config.default]({})(argv)
    }
  }

  var stub = function(req, next){ next(); }

  surge.token = function(hooks){
    var hooks = hooks || {}
    var preAuth     = hooks.preAuth       || stub
    var postAuth    = hooks.postAuth      || stub
    var onion = [
      whitelist, endpoint, pkg, help, version, space,
      preAuth, creds, auth, postAuth,
      token, space
    ]
    return function(){
      var argv = parse(arguments[arguments.length -1])
      skin({
        config: config,
        argv: argv,
        read: read
      }, onion)
    }
  }

  surge.login = function(hooks){
    var hooks = hooks || {}
    var preAuth     = hooks.preAuth       || stub
    var postAuth    = hooks.postAuth      || stub
    var onion = [
      whitelist, endpoint, pkg, help, version, space,
      preAuth, auth, postAuth,
      login, space
    ]
    return function(){
      var argv = parse(arguments[arguments.length -1])
      skin({
        config: config,
        argv: argv,
        read: read
      }, onion)
    }
  }

  surge.logout = function(hooks){
    var hooks = hooks || {}
    var onion = [
      whitelist, endpoint, pkg, help, version, space,
      creds, logout, space
    ]
    return function(){
      var argv = parse(arguments[arguments.length -1])
      skin({
        config: config,
        argv: argv,
        read: read
      }, onion)
    }
  }

  surge.publish = function(hooks){
    var hooks = hooks || {}
    var preAuth     = hooks.preAuth       || stub
    var postAuth    = hooks.postAuth      || stub
    var preProject  = hooks.preProject    || stub
    var postProject = hooks.postProject   || stub
    var preSize     = hooks.preSize       || stub
    var postSize    = hooks.postSize      || stub
    var preDomain   = hooks.preDomain     || stub
    var postDomain  = hooks.postDomain    || stub
    var prePublish  = hooks.prePublish    || stub
    var postPublish = hooks.postPublish   || stub
    var onion = [
      whitelist, endpoint, pkg, help, version, space,
      preAuth, creds, welcome, auth, authInfo, postAuth, shorthand,
      preProject, project, postProject,
      preSize, size, postSize,
      preDomain, discovery.setDomainFromCname, discovery.suggestDomainFromGenerator, domain, postDomain,
      prePublish, protocol, deploy, postPublish, ipaddress
    ]
    return function(){
      var argv = parse(arguments[arguments.length -1])
      skin({
        config: config,
        argv: argv,
        read: read
      }, onion)
    }
  }

  surge.whoami = function(hooks){
    var hooks = hooks || {}
    var onion = [
      whitelist, endpoint, pkg, help, version, space,
      creds, whoami
    ]
    return function(){
      var argv = parse(arguments[arguments.length -1])
      skin({
        config: config,
        argv: argv,
        read: read
      }, onion)
    }
  }

  surge.list = function(hooks){
    var hooks = hooks || {}
    var preAuth   = hooks.preAuth  || stub
    var postAuth  = hooks.postAuth || stub
    var onion = [
      whitelist, endpoint, pkg, help, version, space,
      preAuth, creds, welcome, auth, postAuth, shorthand,
      list, space
    ]
    return function(){
      var argv = parse(arguments[arguments.length -1])
      skin({
        config: config,
        argv: argv,
        read: read
      }, onion)
    }
  }

  surge.switch = function(hooks){
    var hooks = hooks || {}
    var preAuth   = hooks.preAuth  || stub
    var postAuth  = hooks.postAuth || stub
    var onion = [
      whitelist, endpoint, pkg, help, version,
      preAuth, creds, welcome, auth, postAuth, shorthand,
      cut, space
    ]
    return function(){
      var argv = parse(arguments[arguments.length -1])
      skin({
        config: config,
        argv: argv,
        read: read
      }, onion)
    }
  }

  surge.cutover = function(hooks){
    var hooks = hooks || {}
    var preAuth   = hooks.preAuth  || stub
    var postAuth  = hooks.postAuth || stub
    var onion = [
      whitelist, endpoint, pkg, help, version,
      preAuth, creds, welcome, auth, postAuth, shorthand,
      cutover, space
    ]
    return function(){
      var argv = parse(arguments[arguments.length -1])
      skin({
        config: config,
        argv: argv,
        read: read
      }, onion)
    }
  }

  surge.select = function(hooks){
    var hooks = hooks || {}
    var preAuth   = hooks.preAuth  || stub
    var postAuth  = hooks.postAuth || stub
    var onion = [
      whitelist, endpoint, pkg, help, version,
      preAuth, creds, welcome, auth, postAuth, shorthand,
      select, space
    ]
    return function(){
      var argv = parse(arguments[arguments.length -1])
      skin({
        config: config,
        argv: argv,
        read: read
      }, onion)
    }
  }

  surge.teardown = function(hooks){
    var hooks = hooks || {}
    var preAuth   = hooks.preAuth  || stub
    var postAuth  = hooks.postAuth || stub
    var onion = [
      whitelist, endpoint, pkg, help, version, space,
      preAuth, creds, auth, postAuth,
      shorthand, discovery.setDomainFromArgs, discovery.suggestDomainFromCname, domainOrSilent,
      teardown, space
    ]
    return function(){
      var argv = parse(arguments[arguments.length -1])
      skin({
        config: config,
        argv: argv,
        read: read
      }, onion)
    }
  }

  surge.plus = function(hooks){
    var hooks = hooks || {}
    var preAuth   = hooks.preAuth  || stub
    var postAuth  = hooks.postAuth || stub
    var onion = [
      whitelist, endpoint, pkg, help, version, space,
      preAuth, creds, welcome, tokencheck, email, auth, postAuth,
      shorthand, discovery.setDomainFromArgs, discovery.suggestDomainFromCname, domain,
      plus, space
    ]
    return function(){
      var argv = parse(arguments[arguments.length -1])
      skin({
        config: config,
        argv: argv,
        read: read
      }, onion)
    }
  }

  surge.plan = function(hooks){
    var hooks = hooks || {}
    var preAuth   = hooks.preAuth  || stub
    var postAuth  = hooks.postAuth || stub
    var onion = [
      whitelist, endpoint, pkg, help, version,
      preAuth, creds, auth, postAuth,
      shorthand, discovery.setDomainFromArgs,
      plans, plan, exitifcurrentplan,
      payment, subscribe,
      space
    ]
    return function(){
      var argv = parse(arguments[arguments.length -1])
      skin({
        config: config,
        argv: argv,
        read: read
      }, onion)
    }
  }

  surge.card = function(hooks){
    var hooks = hooks || {}
    var preAuth   = hooks.preAuth  || stub
    var postAuth  = hooks.postAuth || stub
    var onion = [
      whitelist, endpoint, pkg, help, version, space,
      preAuth, creds, welcome, auth, postAuth,
      plans, card, setcard,
      space
    ]
    return function(){
      var argv = parse(arguments[arguments.length -1])
      skin({
        config: config,
        argv: argv,
        read: read
      }, onion)
    }
  }

  surge.ssl = function(hooks){
    var hooks = hooks || {}
    var preAuth   = hooks.preAuth  || stub
    var postAuth  = hooks.postAuth || stub
    var onion = [
      whitelist, endpoint, pkg, help, version, space,
      preAuth, creds, auth, postAuth,
      shorthand, discovery.setDomainFromArgs, discovery.suggestDomainFromCname, domainOrSilent,
      pemOrSilent, ssl, space
    ]
    return function(){
      var argv = parse(arguments[arguments.length -1])
      skin({
        config: config,
        argv: argv,
        read: read
      }, onion)
    }
  }

  return surge

}
