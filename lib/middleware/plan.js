
var request     = require("request")
var url         = require("url")
var helpers     = require("./util/helpers")
var path        = require("path")
var fs          = require("fs")
var os          = require("os")
var inquirer    = require('inquirer')

module.exports = function(req, next, abort){
  
  var choice = function(plan){
    plan.metadata.regions = plan.metadata.regions || ""

    var price   = plan.amount.toString().substring(0, plan.amount.toString().length - 2)

    var shortinter = plan.interval == "month" 
      ? "mo" 
      : "yr"

    var title = plan.name.underline

    // add price
    if (price == "00") {
      title += " Free"
    }else{
      title += " $" + price + "/" + shortinter 
    }
    
    if (plan.trial_period_days){
      title += " (" + plan.trial_period_days + "day trial)"
    }

    if (req.subscription && req.subscription.id === plan.id){
      title += " " + "[CURRENT PLAN]".inverse
    }

    var features = [title]

    if(plan.metadata.projects && plan.metadata.publishings){
      features.push(plan.metadata.projects + " projects, " + plan.metadata.publishings + " publishings/day")
    }

    if(plan.metadata.regions){
      features.push("Regions(" + plan.metadata.regions.split(", ").length + "): " + plan.metadata.regions)
    }
    console.log(req)

    if (plan.metadata.ssl){
      if (plan.metadata.ssl == "auto"){
        features.push("Automatic SSL via LetsEncrypt.org w/ force https")
      }else{
        features.push("Custom SSL (via upload) & <subdomain>." + req.config.platform + " SSL ")  
      }
      
    }

    return {
      short: "  " + plan.name,
      value: plan.id,
      name: " " + features.join("\n   - ") + "\n"
    }
  }

  var choices = req.plans.map(choice)

  inquirer.prompt([
    {
      type: 'list',
      name: 'plan',
      message: '\n\n   You may change or cancel plan anytime.\n\n',
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
