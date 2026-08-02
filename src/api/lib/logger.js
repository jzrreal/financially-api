const pino = require('pino')
const Sentry = require('@sentry/node')
const isProd = process.env.NODE_ENV === 'production'
const logLevel = process.env.LOG_LEVEL || 'info'

const transport = !isProd
  ? pino.transport({
    target: 'pino-pretty',
    options: {
      colorize: true,
      levelFirst: true,
      translateTime: 'SYS:standard',
      ignore: 'pid,hostname',
    }
  })
  : undefined

const logger = pino(
  {
    level: logLevel,
    customLevels: {
      log: 30
    },
    redact: [
      'order.orderId'
    ],
  },
  transport
)

const tagEvent = (ctx, params) => {
  if (!process.env.SENTRY_DSN) return
  Sentry.setTags(params)
}

const tag = (ctx, params = {}, tags, level) => {
  if (process.env.SENTRY_VERBOSE && ctx && ctx.log) {
    ctx.log.debug({ params, tags }, '[SENTRY] ' + params.message)
  }
  if (!process.env.SENTRY_DSN) return
  if (tags) Sentry.setTags(params)
  params.level = level || Sentry.Severity.Info
  Sentry.addBreadcrumb(params)
}

module.exports = {
  tag,
  logger,
  isProd,
  logLevel,
  tagEvent,
}
