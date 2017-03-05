
var request     = require("request")
var url         = require("url")
var helpers     = require("./util/helpers")
var path        = require("path")
var fs          = require("fs")
var os          = require("os")
var inquirer    = require('inquirer')

module.exports = function(req, next, abort){

  console.log(req.plans)
  next()
  
  var choice = function(plan){
    plan.metadata.regions = plan.metadata.regions || ""

    var price   = plan.amount.toString().substring(0, plan.amount.toString().length - 2)
    var title   = plan.name + " $" + price + "/" + plan.interval
    var features = [title]

    if(plan.metadata.projects && plan.metadata.publishings){
      features.push(plan.metadata.projects + " projects, " + plan.metadata.publishings + " publishings/day")
    }

    if(plan.metadata.regions){
      features.push("Regions(" + plan.metadata.regions.split(", ").length + "): " + plan.metadata.regions)
    }

    if (plan.metadata.ssl && plan.metadata.ssl == "auto"){
      features.push("Custom SSL via LetsEncrypt.org")
    }

    return {
      short: "  " + plan.name,
      value: plan.id,
      name: " " + features.join("\n   - ") + "\n"
    }
  }

  inquirer.prompt([
    {
      type: 'list',
      name: 'plan',
      message: '\n\n   All surge.sh plans include CNAME, AUTH, ROUTER, CORS\n   Please select plan...\n\n',
      choices: req.plans.map(choice),
      pageSize: 20,
      separator: true
    }
  ]).then(function (answers) {
    console.log()
    console.log(answers)
    //console.log(JSON.stringify(answers, null, '  '))
  })
}
