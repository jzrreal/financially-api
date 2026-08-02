'use strict'

const Koa = require('koa')
const json = require('koa-json')
const Sentry = require('@sentry/node')
const { koaBody } = require('koa-body')
const httpLogger = require('koa-pino-logger')

const { logger, isProd, logLevel } = require('./api/lib/logger')
logger.info({ isProd, logLevel }, '~ Starting up api')

const config = require('./config')

const { getInstance } = require('./api/lib/db')
const db = getInstance()
db.connect()

const app = new Koa()

app.silent = true
app.use(httpLogger({
  logger: logger,
  level: logLevel,
  autoLogging: !!process.env.HTTP_LOG,
  prettyPrint: isProd ? false : { levelFirst: true }
}))
app.use(json({
  pretty: !isProd
}))
app.use(koaBody())
const security = require('./config/security')
security(app)
const { useEmail } = require('./api/lib/mail')
app.use(useEmail)
const { useRedis } = require('./api/lib/redis')
app.use(useRedis)

if (process.env.SENTRY_DSN) {
  const opts = {
    dsn: process.env.SENTRY_DSN,
    tracesSampleRate: 1.0,
  }
  logger.info({ opts }, '~ initiate sentry')
  Sentry.init(opts)
  app.on('error', (err, ctx) => {
    Sentry.withScope(function(scope) {
      scope.addEventProcessor(function(event) {
        return Sentry.Handlers.parseRequest(event, ctx.request)
      })
      Sentry.captureException(err)
    })
  })
}

const routes = require('./routes')
routes(app)

module.exports = { app, db, config, logger }
