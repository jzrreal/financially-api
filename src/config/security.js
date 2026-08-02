const cors = require('@koa/cors')
const lusca = require('koa-lusca')
const convert = require('koa-convert')

function security(app) {
  app.use(cors())
  app.use(convert(
    lusca({
      xframe: 'DENY',
      hsts: { maxAge: 31536000, includeSubDomains: true },
      xssProtection: true,
    })))
}

module.exports = security
