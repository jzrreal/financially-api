const Router = require('@koa/router')
const Sentry = require('@sentry/node')
const { ApiError } = require('./api/lib/errors')

async function routes(app) {
  app.use(async (ctx, next) => {
    try {
      ctx.opts = { suppressResponse: false }
      ctx.track = (extra, msg) => {
        try {
          if (process.env.SENTRY_DSN) {
            if (!msg && extra) extra = msg
            Sentry.captureMessage(msg, { extra })
          }
        } catch (error) {
          ctx.log.error(error)
        }
      }
      const isHealthCheck = /\/api\/ping/.test(ctx.request.url)
      if (!isHealthCheck) {
        ctx.log.debug({
          query: ctx.query,
          body: ctx.request.body,
          params: ctx.request.params,
        }, 'request data')
      }
      ctx.state.appSource = ctx.headers['X-App-Client'] ||
        ctx.headers['x-app-client']

      ctx.isP3miDash = ctx.state.appSource === 'p3mi-dash'
      await next()
      if (ctx.opts.suppressResponse) {
        ctx.log.debug(ctx.request.url, 'response body [suppressed]')
      }
      else if (!isHealthCheck) {
        ctx.log.debug(ctx.body, 'response body')
      }
    } catch (error) {
      Sentry.withScope(function(scope) {
        scope.addEventProcessor(function(event) {
          return Sentry.Handlers.parseRequest(event, ctx.request)
        })
        Sentry.captureException(error)
      })
      if (error.name === 'ValidationError') {
        error.status = 422
      }
      if (error.name === 'BulkWriteError' && error.code === 11000) {
        error.status = 422
      }

      if (error instanceof ApiError) {
        ctx.status = error.statusCode || 500
        ctx.body = {
          error: true,
          message: error.message,
          errorCode: error.errorCode,
          errorData: error.errorData,
        }
      }
      else {
        const { status, message, ...data } = error
        ctx.status = status || 500
        const response = {
          message,
          error: true,
        }
        if (Object.keys(data)[0]) {
          response.data = data
        }
        ctx.body = response
      }
    }
  })

  // app.use(require('./api/auth').routes())
  // app.use(require('./api/user').routes())
  
  // // analytics
  // app
  //   .use(require('./api/analytic').routes())
  //   .use(require('./api/analytic').allowedMethods())

  // // transactions
  // app
  //   .use(require('./api/transactions').routes())
  //   .use(require('./api/transactions').allowedMethods())

  // // services
  // app
  //   .use(require('./api/service').routes())
  //   .use(require('./api/service').allowedMethods())

  // // branches
  // app
  //   .use(require('./api/branch').routes())
  //   .use(require('./api/branch').allowedMethods())

  // handle 404
  const router = new Router()

  // handle PHP requests to prevent log clutter
  router.all(/\.php$/, (ctx) => {
    ctx.status = 410
    ctx.body = { error: true, message: 'Unsupported' }
  })

  router.get('/api/ping', (ctx) => {
    ctx.body = { hi: 'we are p3mi karunia bekasi' }
  })
  router.get('/api', (ctx) => {
    ctx.body = { service: 'P3MI KB API' }
  })
  router.get('/', (ctx) => {
    ctx.body = { service: 'P3MI KB API' }
  })
  // router.all('/*', (ctx) => {
  //   ctx.throw(404, 'Not Found')
  // })
  app.use(router.routes())
}

module.exports = routes
