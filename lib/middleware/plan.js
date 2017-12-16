
var request     = require("request")
var url         = require("url")
var helpers     = require("./util/helpers")
var path        = require("path")
var fs          = require("fs")
var os          = require("os")
var inquirer    = require('inquirer')
var colors      = require("colors")

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

    if (req.subscription && req.subscription.plan.id === plan.id){
      title += " " + "[CURRENT PLAN]"
    }

    var features = [title]

    if(plan.metadata.includes){
      features.push(plan.metadata.includes)
    }

    if(plan.metadata.projects){
      features.push(plan.metadata.projects)
    }

    if(plan.metadata.cname){
      features.push(plan.metadata.cname)
    }

    if(plan.metadata.regions){
      features.push(plan.metadata.regions)
    }

    if (plan.metadata.features){
      features.push(plan.metadata.features)
    }

    if(plan.metadata.preview){
      features.push(plan.metadata.preview)
    }

    if (plan.metadata.ssl){
      features.push(plan.metadata.ssl)
    }

    if (plan.metadata.rollbacks){
      features.push(plan.metadata.rollbacks)
    }

    if(plan.metadata.perk){
      features.push("Regions(" + plan.metadata.regions.split(", ").length + "): " + plan.metadata.regions)
    }

    return {
      short: " ",
      value: plan.id,
      name: "   " + features.join("\n     - ") + "\n"
    }
  }

  var choices = req.plans.list.map(choice)
  
  inquirer.prompt([
    {
      type: 'list',
      name: 'plan',
      message:  (req.plans.message).yellow,
      choices: choices,
      pageSize: 20,
      separator: true
    }
  ]).then(function (answers) {
    req.selectedPlan = answers
    //console.log(JSON.stringify(answers, null, '  '))
    return next()
  })
}
