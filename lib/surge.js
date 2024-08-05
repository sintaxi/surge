
// load help first so we can display and exit quickly
var help            = require('./middleware/help')

// modules
var read            = require("read")
var minimist        = require('minimist')

// utils
var helpers         = require('./util/helpers')
var skin            = require('./util/skin.js')

// mini-libs that return middleware
var auth            = require("./middleware/_shared/auth")
var discovery       = require("./middleware/_shared/discovery")

// middleware
var whitelist       = require("./middleware/_shared/_whitelist")
var endpoint        = require("./middleware/_shared/_endpoint")
var pkg             = require("./middleware/_shared/_pkg")
var version         = require("./middleware/_shared/_version")
var welcome         = require("./middleware/_shared/_welcome")
var creds           = require("./middleware/_shared/_creds")
var tokencheck      = require("./middleware/_shared/_tokencheck")
var email           = require("./middleware/_shared/_email")
var project         = require("./middleware/_shared/_project")
var size            = require("./middleware/_shared/_size")
var domain          = require("./middleware/_shared/_domain")
var protocol        = require("./middleware/_shared/_protocol")
var domainOrSilent  = require("./middleware/_shared/_domainOrSilent")
var pemOrSilent     = require("./middleware/_shared/_pemOrSilent")
var ipaddress       = require("./middleware/_shared/_ipaddress")
var shorthand       = require("./middleware/_shared/_shorthand")
var subscription    = require("./middleware/_shared/_subscription")
var plans           = require("./middleware/_shared/_plans")
var payment         = require("./middleware/_shared/_payment")
var setcard         = require("./middleware/_shared/_setcard")
var subscribe       = require("./middleware/_shared/_subscribe")
var log             = require("./middleware/_shared/_log")

// also middleware but contains main functionality for command
var logout          = require("./middleware/logout")
var login           = require("./middleware/login")
var whoami          = require("./middleware/whoami")
var deploy          = require("./middleware/deploy")
var list            = require("./middleware/list")
var token           = require("./middleware/token")
var teardown        = require("./middleware/teardown")
var plus            = require("./middleware/plus")
var plan            = require("./middleware/plan")
var card            = require("./middleware/_shared/_card")
var ssl             = require("./middleware/ssl")
var select          = require("./middleware/select")
var rollback        = require("./middleware/rollback")
var rollfore        = require("./middleware/rollfore")
var cutover         = require("./middleware/cutover")
var bust            = require("./middleware/bust")
var analytics       = require("./middleware/analytics")
var traffic         = require("./middleware/traffic")
var load            = require("./middleware/load")
var audience        = require("./middleware/audience")
var usage           = require("./middleware/usage")
var audit           = require("./middleware/audit")
var discard         = require("./middleware/discard")
var invite          = require("./middleware/invite")
var revoke          = require("./middleware/revoke")
var encrypt         = require("./middleware/encrypt")
var certs           = require("./middleware/certs")
var dns             = require("./middleware/dns")
var config          = require("./middleware/config")
var files           = require("./middleware/files")
var nuke            = require("./middleware/nuke")



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

module.exports = function(configuration){
  configuration = configuration || {}

  var ep = configuration.endpoint
    ? configuration.endpoint
    : configuration.platform ? "https://surge." + configuration.platform : 'https://surge.surge.sh'

  configuration.platform = configuration.platform || "surge.sh"
  configuration.name = configuration.name || "surge"

  var options = {
    alias: {
      p: 'project',
      d: 'domain',
      e: 'endpoint',
      a: 'add',
      r: 'remove',
      s: 'stage',
      m: 'message'
    },
    default: { e: ep, s: false }
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

    // we accept --preview
    if (argv.preview) argv.stage = argv.s = argv.preview

    var commands = [
      "login", 
      "logout", 
      "whoami", 
      "list", 
      "rollback", 
      "rollfore",
      "cutover", 
      "discard", 
      "publish", 
      "teardown", 
      "select", 
      "token", 
      "plus", 
      "ssl", 
      "plan", 
      "card",
      "invite",
      "revoke",
      "encrypt",
      "config",
      "dns",
      "zone",
      "certs",
      "files",
      "audit",
      "bust",
      "analytics",
      "usage",
      "traffic",
      "load",
      "audience",
      "nuke",
      ]

    if (commands.indexOf(cmd) !== -1) {
      argv._.shift()
      surge[cmd]({})(argv)
    } else if(configuration.default && commands.indexOf(configuration.default) !== -1 ){
      surge[configuration.default]({})(argv)
    }
  }

  var stub = function(req, next){ 
    return next(); 
  }

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
        configuration: configuration,
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
        configuration: configuration,
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
        configuration: configuration,
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
      endpoint, pkg, help, version, space,
      preAuth, creds, welcome, auth, authInfo, postAuth, shorthand,
      preProject, project, postProject,
      preDomain, discovery.setDomainFromCname, discovery.suggestDomainFromGenerator, domain, protocol, postDomain,
      preSize, size, postSize,
      prePublish, deploy, postPublish, ipaddress
    ]
    return function(){
      var argv = parse(arguments[arguments.length -1])
      skin({
        configuration: configuration,
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
        configuration: configuration,
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
        configuration: configuration,
        argv: argv,
        read: read
      }, onion)
    }
  }

  surge.rollback = function(hooks){
    var hooks = hooks || {}
    var preAuth   = hooks.preAuth  || stub
    var postAuth  = hooks.postAuth || stub
    var onion = [
      whitelist, endpoint, pkg, help, version,
      preAuth, creds, welcome, auth, postAuth,
      rollback, space
    ]
    return function(){
      var argv = parse(arguments[arguments.length -1])
      skin({
        configuration: configuration,
        argv: argv,
        read: read
      }, onion)
    }
  }

  surge.rollfore = function(hooks){
    var hooks = hooks || {}
    var preAuth   = hooks.preAuth  || stub
    var postAuth  = hooks.postAuth || stub
    var onion = [
      whitelist, endpoint, pkg, help, version,
      preAuth, creds, welcome, auth, postAuth,
      rollfore, space
    ]
    return function(){
      var argv = parse(arguments[arguments.length -1])
      skin({
        configuration: configuration,
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
        configuration: configuration,
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
      preAuth, creds, welcome, auth, postAuth,
      cutover, space
    ]
    return function(){
      var argv = parse(arguments[arguments.length -1])
      skin({
        configuration: configuration,
        argv: argv,
        read: read
      }, onion)
    }
  }

  surge.discard = function(hooks){
    var hooks = hooks || {}
    var preAuth   = hooks.preAuth  || stub
    var postAuth  = hooks.postAuth || stub
    var onion = [
      whitelist, endpoint, pkg, help, version,
      preAuth, creds, welcome, auth, postAuth,
      discard, space
    ]
    return function(){
      var argv = parse(arguments[arguments.length -1])
      skin({
        configuration: configuration,
        argv: argv,
        read: read
      }, onion)
    }
  }

  surge.bust = function(hooks){
    var hooks = hooks || {}
    var preAuth   = hooks.preAuth  || stub
    var postAuth  = hooks.postAuth || stub
    var onion = [
      whitelist, endpoint, pkg, help, version,
      preAuth, creds, welcome, auth, postAuth,
      bust, space
    ]
    return function(){
      var argv = parse(arguments[arguments.length -1])
      skin({
        configuration: configuration,
        argv: argv,
        read: read
      }, onion)
    }
  }

  surge.analytics = function(hooks){
    var hooks = hooks || {}
    var preAuth   = hooks.preAuth  || stub
    var postAuth  = hooks.postAuth || stub
    var onion = [
      whitelist, endpoint, pkg, help, version,
      preAuth, creds, welcome, auth, postAuth,
      analytics, space
    ]
    return function(){
      var argv = parse(arguments[arguments.length -1])
      skin({
        configuration: configuration,
        argv: argv,
        read: read
      }, onion)
    }
  }

  surge.traffic = function(hooks){
    var hooks = hooks || {}
    var preAuth   = hooks.preAuth  || stub
    var postAuth  = hooks.postAuth || stub
    var onion = [
      whitelist, endpoint, pkg, help, version,
      preAuth, creds, welcome, auth, postAuth,
      traffic, space
    ]
    return function(){
      var argv = parse(arguments[arguments.length -1])
      skin({
        configuration: configuration,
        argv: argv,
        read: read
      }, onion)
    }
  }

  surge.load = function(hooks){
    var hooks = hooks || {}
    var preAuth   = hooks.preAuth  || stub
    var postAuth  = hooks.postAuth || stub
    var onion = [
      whitelist, endpoint, pkg, help, version,
      preAuth, creds, welcome, auth, postAuth,
      load, space
    ]
    return function(){
      var argv = parse(arguments[arguments.length -1])
      skin({
        configuration: configuration,
        argv: argv,
        read: read
      }, onion)
    }
  }

  surge.audience = function(hooks){
    var hooks = hooks || {}
    var preAuth   = hooks.preAuth  || stub
    var postAuth  = hooks.postAuth || stub
    var onion = [
      whitelist, endpoint, pkg, help, version,
      preAuth, creds, welcome, auth, postAuth,
      audience, space
    ]
    return function(){
      var argv = parse(arguments[arguments.length -1])
      skin({
        configuration: configuration,
        argv: argv,
        read: read
      }, onion)
    }
  }

  surge.usage = function(hooks){
    var hooks = hooks || {}
    var preAuth   = hooks.preAuth  || stub
    var postAuth  = hooks.postAuth || stub
    var onion = [
      whitelist, endpoint, pkg, help, version,
      preAuth, creds, welcome, auth, postAuth,
      usage, space
    ]
    return function(){
      var argv = parse(arguments[arguments.length -1])
      skin({
        configuration: configuration,
        argv: argv,
        read: read
      }, onion)
    }
  }

  surge.files = function(hooks){
    var hooks = hooks || {}
    var preAuth   = hooks.preAuth  || stub
    var postAuth  = hooks.postAuth || stub
    var onion = [
      whitelist, endpoint, pkg, help, version,
      preAuth, creds, welcome, auth, postAuth,
      files, space
    ]
    return function(){
      var argv = parse(arguments[arguments.length -1])
      skin({
        configuration: configuration,
        argv: argv,
        read: read
      }, onion)
    }
  }

  surge.audit = function(hooks){
    var hooks = hooks || {}
    var preAuth   = hooks.preAuth  || stub
    var postAuth  = hooks.postAuth || stub
    var onion = [
      whitelist, endpoint, pkg, help, version,
      preAuth, creds, welcome, auth, postAuth,
      audit, space
    ]
    return function(){
      var argv = parse(arguments[arguments.length -1])
      skin({
        configuration: configuration,
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
        configuration: configuration,
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
        configuration: configuration,
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
        configuration: configuration,
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
      whitelist, endpoint, pkg, help, version, space,
      preAuth, creds, welcome, auth, postAuth,
      shorthand, discovery.setDomainFromArgs,
      plans, plan, exitifcurrentplan,
      payment, subscribe,
      space
    ]
    return function(){
      var argv = parse(arguments[arguments.length -1])
      skin({
        configuration: configuration,
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
        configuration: configuration,
        argv: argv,
        read: read
      }, onion)
    }
  }

  surge.nuke = function(hooks){
    var hooks = hooks || {}
    var preAuth   = hooks.preAuth  || stub
    var postAuth  = hooks.postAuth || stub
    var onion = [
      whitelist, endpoint, pkg, help, version,
      preAuth, creds, welcome, auth, postAuth,
      nuke, space
    ]
    return function(){
      var argv = parse(arguments[arguments.length -1])
      skin({
        configuration: configuration,
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
        configuration: configuration,
        argv: argv,
        read: read
      }, onion)
    }
  }

  surge.invite = function(hooks){
    var hooks = hooks || {}
    var preAuth   = hooks.preAuth  || stub
    var postAuth  = hooks.postAuth || stub
    var onion = [
      whitelist, endpoint, pkg, help, version, space,
      preAuth, creds, auth, postAuth,
      invite, space
    ]
    return function(){
      var argv = parse(arguments[arguments.length -1])
      skin({
        configuration: configuration,
        argv: argv,
        read: read
      }, onion)
    }
  }

  surge.revoke = function(hooks){
    var hooks = hooks || {}
    var preAuth   = hooks.preAuth  || stub
    var postAuth  = hooks.postAuth || stub
    var onion = [
      whitelist, endpoint, pkg, help, version, space,
      preAuth, creds, auth, postAuth,
      revoke, space
    ]
    return function(){
      var argv = parse(arguments[arguments.length -1])
      skin({
        configuration: configuration,
        argv: argv,
        read: read
      }, onion)
    }
  }

      // endpoint, pkg, help, version, space,
      // preAuth, creds, welcome, auth, authInfo, postAuth, shorthand,
      // preProject, project, postProject,
      // preDomain, discovery.setDomainFromCname, discovery.suggestDomainFromGenerator, domain, postDomain,
      // preSize, size, postSize,
      // prePublish, protocol, deploy, postPublish, ipaddress

  surge.encrypt = function(hooks){
    var hooks = hooks || {}
    var preAuth   = hooks.preAuth  || stub
    var postAuth  = hooks.postAuth || stub
    var onion = [
      whitelist, endpoint, pkg, help, version, space,
      preAuth, creds, welcome, auth, authInfo, postAuth,
      // discovery.setDomainFromCname, discovery.suggestDomainFromGenerator, domain,
      encrypt, space
    ]
    return function(){
      var argv = parse(arguments[arguments.length -1])
      skin({
        configuration: configuration,
        argv: argv,
        read: read
      }, onion)
    }
  }

  surge.certs = function(hooks){
    var hooks = hooks || {}
    var preAuth   = hooks.preAuth  || stub
    var postAuth  = hooks.postAuth || stub
    var onion = [
      whitelist, endpoint, pkg, help, version, space,
      preAuth, creds, auth, postAuth,
      certs, space
    ]
    return function(){
      var argv = parse(arguments[arguments.length -1])
      skin({
        configuration: configuration,
        argv: argv,
        read: read
      }, onion)
    }
  }

  surge.config = function(hooks){
    var hooks = hooks || {}
    var preAuth   = hooks.preAuth  || stub
    var postAuth  = hooks.postAuth || stub
    var onion = [
      endpoint, pkg, help, version, space,
      preAuth, creds, auth, postAuth,
      config, space
    ]
    return function(){
      var argv = parse(arguments[arguments.length -1])
      skin({
        configuration: configuration,
        argv: argv,
        read: read
      }, onion)
    }
  }

  surge.dns = function(hooks){
    var hooks = hooks || {}
    var preAuth   = hooks.preAuth  || stub
    var postAuth  = hooks.postAuth || stub
    var onion = [
      whitelist, endpoint, pkg, help, version,
      preAuth, creds, auth, postAuth,
      dns("dns"), space
    ]
    return function(){
      var argv = parse(arguments[arguments.length -1])
      skin({
        configuration: configuration,
        argv: argv,
        read: read
      }, onion)
    }
  }

  surge.zone = function(hooks){
    var hooks = hooks || {}
    var preAuth   = hooks.preAuth  || stub
    var postAuth  = hooks.postAuth || stub
    var onion = [
      whitelist, endpoint, pkg, help, version,
      preAuth, creds, auth, postAuth,
      dns("zone"), space
    ]
    return function(){
      var argv = parse(arguments[arguments.length -1])
      skin({
        configuration: configuration,
        argv: argv,
        read: read
      }, onion)
    }
  }

  return surge

}
