
var middleware  = require('./middleware')
var skin        = require('./middleware/util/skin.js')
var help        = require('./middleware/help')
var read        = require("read")
var minimist    = require('minimist')


var whitelist   = require("./middleware/whitelist")
var endpoint    = require("./middleware/endpoint")
var pkg         = require("./middleware/pkg")
var version     = require("./middleware/version")
var welcome     = require("./middleware/welcome")
var creds       = require("./middleware/creds")
var whoami      = require("./middleware/whoami")
var tokencheck  = require("./middleware/tokencheck")
var email       = require("./middleware/email")
var auth        = require("./middleware/auth")
var logout      = require("./middleware/logout")
var help        = require("./middleware/help")
var project     = require("./middleware/project")
var size        = require("./middleware/size")
var domain      = require("./middleware/domain")
var protocol    = require("./middleware/protocol")
var deploy      = require("./middleware/deploy")
var domainOrSilent      = require("./middleware/domainOrSilent")
var pemOrSilent      = require("./middleware/pemOrSilent")
var ipaddress   = require("./middleware/ipaddress")
var login       = require("./middleware/login")
var shorthand   = require("./middleware/shorthand")
var list        = require("./middleware/list")
var token       = require("./middleware/token")
var teardown    = require("./middleware/teardown")
var discovery   = require("./middleware/discovery")
var plus        = require("./middleware/plus")

var subscription= require("./middleware/subscription")
var plans       = require("./middleware/plans")
var plan        = require("./middleware/plan")
var payment     = require("./middleware/payment")
var card        = require("./middleware/card")
var setcard     = require("./middleware/setcard")
var subscribe   = require("./middleware/subscribe")

var ssl         = require("./middleware/ssl")
var log         = require("./middleware/log")
var helpers     = require('./middleware/util/helpers')




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

    var commands = ["login", "logout", "whoami", "list", "publish", "teardown", "token", "plus", "ssl", "plan", "card"]

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
