
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
var ipaddress   = require("./middleware/ipaddress")
var login       = require("./middleware/login")
var shorthand   = require("./middleware/shorthand")
var list        = require("./middleware/list")
var token       = require("./middleware/token")
var teardown    = require("./middleware/teardown")
var discovery   = require("./middleware/discovery")
var plus        = require("./middleware/plus")

var space = function(req, next){ console.log(); next() }

var parse = function(arg){
  if(arg.hasOwnProperty("parent") && arg.parent.hasOwnProperty("rawArgs")){
    arg = arg.parent.rawArgs.slice(3)
  }
  return arg instanceof Array
    ? minimist(arg)
    : arg
}

module.exports = function(config){
  config = config || {}

  var ep = config.endpoint
    ? config.endpoint
    : config.platform ? "http://surge." + config.platform : 'https://surge.surge.sh'

  config.platform = config.platform || "surge.sh"

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

  var surge = function(args){
    // will be one of:
    // commander, yargs, process.argv.split(2), OR minimist

    var argv = minimist(args, options)
    var cmd  = argv._[0]

    var commands = ["login", "logout", "whoami", "list", "publish", "teardown", "token", "plus"]

    if (commands.indexOf(cmd) !== -1) {
      argv._.shift()
      surge[cmd]({})(argv)
    } else if(config.default && commands.indexOf(config.default) !== -1 ){
      surge[config.default]({})(argv)
    }
  }

  var stub = function(req, next){ next(); }

  surge.token = function(hooks){
    var preAuth     = hooks.preAuth       || stub
    var postAuth    = hooks.postAuth      || stub
    var onion = [
      whitelist, endpoint, pkg, help, version, space,
      preAuth, creds, welcome, tokencheck, email, auth, postAuth,
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
    var preAuth     = hooks.preAuth       || stub
    var postAuth    = hooks.postAuth      || stub
    var onion = [
      whitelist, endpoint, pkg, help, version, space,
      preAuth, creds, welcome, email, auth, postAuth,
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
      preAuth, creds, welcome, tokencheck, email, auth, postAuth, shorthand,
      preProject, project, postProject,
      preSize, size, postSize,
      preDomain, discovery.setDomainFromCname, discovery.suggestDomainFromGenerator, domain, postDomain,
      prePublish, protocol, deploy, postPublish,
      ipaddress
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
    var onion = [
      whitelist, endpoint, pkg, help, version, space,
      creds, tokencheck, whoami
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
    var preAuth   = hooks.preAuth  || stub
    var postAuth  = hooks.postAuth || stub
    var onion = [
      whitelist, endpoint, pkg, help, version, space,
      preAuth, creds, welcome, tokencheck, email, auth, postAuth,
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
    var preAuth   = hooks.preAuth  || stub
    var postAuth  = hooks.postAuth || stub
    var onion = [
      whitelist, endpoint, pkg, help, version, space,
      preAuth, creds, welcome, tokencheck, email, auth, postAuth,
      shorthand, discovery.setDomainFromArgs, discovery.suggestDomainFromCname, domain,
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

  return surge

}
