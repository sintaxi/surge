
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
    
    
    if (req.subscription && req.subscription.plan.id === plan.id){
      title += " " + "[CURRENT PLAN]"
    } else {
      if (plan.trial_period_days){
        title += " (" + plan.trial_period_days + " day trial)"
      }
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


    var obj = {
      short: " ",
      value: plan.id,
      name: "   " + features.join("\n     - ") + "\n"
    }

    // checked
    if (req.subscription && req.subscription.plan.id === plan.id){
      obj.checked = true
    }else{
      obj.checked = false
    }

    return obj
  }

  var choices = req.plans.list.map(choice)
  
  inquirer.prompt([
    {
      type: 'list',
      name: 'plan',
      message: ' ',
      //message:  (req.plans.message).yellow,
      choices: choices,
      pageSize: 20,
      separator: true
    }
  ]).then(function (answers) {
    //console.log('   You have selected the Foo plan'.grey)
    req.selectedPlan = answers
    var p = answers.plan.split("-")[0]
    req.plan = p.charAt(0).toUpperCase() + p.slice(1)
    return next()
  })

}
