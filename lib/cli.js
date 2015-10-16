#!/usr/bin/env node

var surge = require("../")({})

surge(process.argv.slice(2))
