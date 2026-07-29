
var moniker = require("moniker")
var fs      = require("fs")
var path    = require("path")
var os      = require("os")
var helpers = require("../../util/helpers")

// reads a domain out of a directory. CNAME wins, then a `surge.domain`
// field in package.json. returns { domain, source } or null.
var fromDir = function(dir){
  try {
    var cname = fs.readFileSync(path.join(dir, "CNAME")).toString().split(os.EOL)[0].trim()
    if (helpers.validDomain(cname)) return { domain: cname, source: "cname" }
  } catch(e) {}
  try {
    var pkg = JSON.parse(fs.readFileSync(path.join(dir, "package.json")).toString())
    if (pkg.surge && helpers.validDomain(pkg.surge.domain)) return { domain: pkg.surge.domain, source: "pkg" }
  } catch(e) {}
  return null
}

// a `./` (or `../`, `/`, `~`, bare `.`) prefix always means path, even
// when a directory shares its name with a valid domain.
var forcedPath = function(arg){
  return arg === "." || arg === ".." ||
         arg.indexOf("./") === 0 || arg.indexOf("../") === 0 ||
         arg.indexOf("/") === 0 || arg.indexOf("~") === 0
}

// reads the local domain for a directory (cwd by default) without a req.
// dispatchers use this to decide between a default read and a usage screen.
exports.local = function(dir){
  return fromDir(path.resolve(dir || process.cwd()))
}

// resolves the [<domain>] slot every command shares. the slot is really
// [<domain>|<path>] defaulting to "." — a domain is used directly, a path
// resolves via its CNAME then package.json. in a domain slot a valid
// domain beats a same-named directory; `./` forces the path reading.
// a consumed positional is shifted off argv._ so trailing args (rev,
// emails) always start at argv._[0] downstream.
//
// opts.positional  read argv._[0] as the slot (default true; publish
//                  passes false — its first positional is the project)
// opts.extras      the command takes trailing positionals - a first arg
//                  that is neither domain nor path belongs to the
//                  command, so skip it and infer instead
// opts.prompt      prompt when unresolved instead of aborting
// opts.generate    seed the prompt with a generated domain suggestion
// opts.log         print the resolved domain: line (publish recap style)
//
// sets req.domain and req.domainSource: arg|cname|pkg|prompt|generated
exports.resolve = function(opts){
  opts = opts || {}

  return function(req, next, abort){
    var label = helpers.smart("domain:").grey

    var finish = function(domain, source, echoed){
      req.domain = domain
      req.domainSource = source
      // the prompt already leaves its own domain: line on screen
      if (opts.log && !echoed) helpers.log(label, domain)
      return next()
    }

    // a prompt suggestion stays a clean moniker - the user can edit it.
    // an unattended `_` must succeed first try, so it carries entropy;
    // twelve years of publishes means the bare pairs are mostly taken.
    var generate = function(entropy){
      var name = moniker.choose()
      if (entropy) name += "-" + Math.random().toString(36).slice(2, 6)
      return [name, req.configuration.platform].join(".")
    }

    // the prompt default is the project directory's name - that is what
    // the user calls this project. build-output dirs climb to the parent
    // (publishing foo/dist means the project is foo), and a name that
    // slugifies to nothing falls back to a moniker.
    var suggest = function(){
      var base = path.resolve(req.project || process.cwd())
      var name = path.basename(base)
      var generic = ["dist", "build", "public", "www", "site", "_site", "out", "output", "dest", "static"]
      if (generic.indexOf(name.toLowerCase()) !== -1){
        name = path.basename(path.dirname(base))
      }
      name = name.toLowerCase().replace(/[^a-z0-9-]+/g, "-").replace(/^-+|-+$/g, "")
      if (!name) return generate()
      return [name, req.configuration.platform].join(".")
    }

    var prompt = function(suggestion){
      var suggested = suggestion
      var ask = function(draft){
        helpers.read({
          silent: false,
          prompt: label,
          default: draft || "",
          edit: true,
          terminal: req.configuration.terminal,
          output: req.configuration.output,
          input: req.configuration.input
        }, function(err, domain){
          if (domain === undefined) return abort("Not initiated.".grey)
          if (err || !helpers.validDomain(domain)) return ask(domain)
          return finish(domain, opts.generate && domain === suggested ? "generated" : "prompt", true)
        })
      }
      return ask(suggestion)
    }

    // the slot may be pre-set by publish shorthand, a -d/--domain flag,
    // or sit in the first positional
    var arg = req.domain || null
    var positional = false
    if (!arg && typeof req.argv.domain === "string"){
      arg = req.argv.domain
    }
    if (!arg && opts.positional !== false && req.argv._[0] != null){
      arg = String(req.argv._[0])
      positional = true
    }

    var consume = function(){
      if (positional) req.argv._.shift()
    }

    if (arg){
      if (arg === "_"){
        consume()
        return finish(generate(true), "generated")
      }

      var isPath = forcedPath(arg)
      // an email is never a domain, however url parsing mangles it
      if (!isPath && arg.indexOf("@") === -1 && helpers.validDomain(arg)){
        consume()
        return finish(arg, "arg")
      }

      var dir = path.resolve(arg)
      if (fs.existsSync(dir) && fs.statSync(dir).isDirectory()){
        var found = fromDir(dir)
        if (found){
          consume()
          return finish(found.domain, found.source)
        }
        return abort(("No CNAME found in " + arg + " - pass a domain or publish first.").grey)
      }
      if (isPath) return abort(("No such directory: " + arg).grey)

      if (!opts.extras){
        if (opts.prompt) return prompt(arg)
        return abort(("`" + arg + "` is not a domain.").grey)
      }
      // extras mode - the arg belongs to the command, infer instead
    }

    // no arg — infer from the project directory, falling back to cwd
    // (a regenerated ./dist loses its CNAME; the cwd package.json survives)
    var base = path.resolve(req.project || process.cwd())
    var found = fromDir(base)
    if (!found && base !== process.cwd()) found = fromDir(process.cwd())
    if (found) return finish(found.domain, found.source)

    if (opts.prompt) return prompt(opts.generate ? suggest() : "")
    return abort("No domain found - pass a domain or publish first.".grey)
  }
}

exports.setDomainFromArgs = function(req, next){
  if (!req.domain && req.argv._[0]) {
    req.domain = req.argv._[0]
  }
  return next()
}
