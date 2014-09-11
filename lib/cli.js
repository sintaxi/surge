#!/usr/bin/env node

var path        = require('path')
var yargs       = require('yargs')
var middleware  = require('./middleware')
var skin        = require('./middleware/util/skin.js')

var argv =
  yargs
  .alias('d', 'domain')
  .alias('e', 'endpoint')
  .alias('p', 'project')
  .default('endpoint', 'surge.sh')
  .argv
skin({ argv: argv }, middleware, process.exit)

var readLine = require ("readline");
if (process.platform === "win32"){
    var rl = readLine.createInterface ({
        input: process.stdin,
        output: process.stdout
    });

    rl.on ("SIGINT", function (){
        process.emit ("SIGINT");
    });

}

process.on ("SIGINT", function(){
  //graceful shutdown
  process.exit();
});

// var program = require("commander")

// program
//   .version('0.0.1')
//   .usage("[project] [domain]")
//   .option("-e, --endpoint <domain>", "API endpoint of surge server (eg: surge.sh)")

// program
//   .command("whoami")
//   .description("display who logged in as")
//   .action(function(app){

//   })

// program
//   .command("logout")
//   .description("removes access token from local system")

// program
//   .parse(process.argv);

