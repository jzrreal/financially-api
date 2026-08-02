const Handlebars = require('handlebars')
const moment = require('moment-timezone')

const utils = require('./utils')

Handlebars.registerHelper('ifCond', function (v1, operator, v2, options) {
  switch (operator) {
  case '==':
    return (v1 === v2) ? options.fn(this) : options.inverse(this)
  case '===':
    return (v1 === v2) ? options.fn(this) : options.inverse(this)
  case '!=':
    return (v1 !== v2) ? options.fn(this) : options.inverse(this)
  case '!==':
    return (v1 !== v2) ? options.fn(this) : options.inverse(this)
  case '<':
    return (v1 < v2) ? options.fn(this) : options.inverse(this)
  case '<=':
    return (v1 <= v2) ? options.fn(this) : options.inverse(this)
  case '>':
    return (v1 > v2) ? options.fn(this) : options.inverse(this)
  case '>=':
    return (v1 >= v2) ? options.fn(this) : options.inverse(this)
  case '&&':
    return (v1 && v2) ? options.fn(this) : options.inverse(this)
  case '||':
    return (v1 || v2) ? options.fn(this) : options.inverse(this)
  default:
    return options.inverse(this)
  }
})
Handlebars.__switch_stack__ = []
Handlebars.registerHelper('switch', function (value, options) {
  Handlebars.__switch_stack__.push({
    switch_match: false,
    switch_value: value
  })
  var html = options.fn(this)
  Handlebars.__switch_stack__.pop()
  return html
})
Handlebars.registerHelper('case', function (value, options) {
  const args = Array.from(arguments)
  const caseValues = args
  const stack = Handlebars.__switch_stack__[
    Handlebars.__switch_stack__.length - 1
  ]
  options = args.pop()

  if (stack.switch_match || caseValues.indexOf(stack.switch_value) === -1) {
    return ''
  } else {
    stack.switch_match = true
    return options.fn(this)
  }
})
Handlebars.registerHelper('default', function (options) {
  const stack = Handlebars.__switch_stack__[
    Handlebars.__switch_stack__.length - 1
  ]
  if (!stack.switch_match) {
    return options.fn(this)
  }
})
Handlebars.registerHelper('dateFormat', (date, format, zone) => {
  return zone
    ? moment.tz(date, zone).format(format)
    : moment.utc(date).format(format)
})
Handlebars.registerHelper('numberFormat', value => utils.numberParse(value))
Handlebars.registerHelper('ifEquals', function(arg1, arg2, options) {
  return (arg1 == arg2) ? options.fn(this) : options.inverse(this)
})
Handlebars.registerHelper('isEmpty', (value) => !value)
module.exports = Handlebars
