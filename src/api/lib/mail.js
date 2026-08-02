const path = require('path')
const fs = require('fs-extra')
const Sentry = require('@sentry/node')
const Mailgun = require('mailgun-js-sdk')

const Handlebars = require('./handlebars')
const { getUnsubsURL } = require('./utils')
const {
  AppEcosystem,
  DebugEmailContentEnabled
} = require('./constants')

const isProd = process.env.NODE_ENV === 'production'

const getDomain = () => {
  let domain = 'notifications.p3mi.gmikaruniabekasi.com'
  if (!isProd) {
    domain = `localhost:${process.env.PORT}`
  }
  if (!/^http/.test(domain)) {
    domain = `http://${domain}`
  }
  return domain
}

const sendEmail = async (ctx, params = {}) => {
  return Sentry.startSpan(
    {
      name: 'mail-sending',
      op: 'mail.send',
      forceTransaction: true,
    },
    async () => {
      let response
      try {
        const overrideEmail = process.env.OVERRIDE_EMAIL
        if (!params.to) {
          throw new Error('Missing email recipient')
        }
        const emailData = {
          'o:tag': AppEcosystem,
          subject: params.subject,
          to: overrideEmail || params.to,
          from: params.from ||
        // eslint-disable-next-line max-len
        'P3MI Karunia Bekasi <no-reply@notifications.p3mi.gmikaruniabekasi.com>',
        }
        if (!isProd) {
          emailData.subject = `[DEV] ${emailData.subject}`
        }
        if (params.cc) emailData.cc = params.cc
        if (params.replyTo) {
          emailData['h:Reply-To'] = params.replyTo
        }

        if (params.bcc) emailData.bcc = params.bcc

        if (overrideEmail) {
          ctx.log.debug({
            to: params.to,
            overrideTo: emailData.to,
            cc: emailData.cc,
            bcc: emailData.bcc,
            from: emailData.from,
            subject: emailData.subject,
          }, 'override email')
          delete emailData.cc
          delete emailData.bcc
        }

        if (params.context && !params.context.unsubscribeURL) {
          params.context.unsubscribeURL = getUnsubsURL('common')
        }

        if (process.env.DEBUG_MAIL) {
          ctx.log.debug(params, 'email context')
        }
        ctx.log.info({
          to: emailData.to,
          cc: emailData.cc,
          bcc: emailData.bcc,
          from: emailData.from,
          subject: emailData.subject,
        }, 'sending email')

        if (params.template) {
          const file = path.join(
            __dirname, '..', 'templates', `${params.template}.html`
          )
          const templateFile = fs.readFileSync(file).toString()
          emailData.html = Handlebars.compile(templateFile)(params.context)
        } else {
          emailData.text = params.text
        }

        if (params.attachment) {
          emailData.attachment = params.attachment
        }

        if (DebugEmailContentEnabled) {
          ctx.log.debug({
            content: emailData.html || emailData.text
          }, 'email content')
        }
        Sentry.setContext('emailData', emailData)

        if (
          emailData.to &&
          !params.testEmail &&
          !process.env.IGNORE_EMAIL
        ) {
          const apiKey = process.env.MAILGUN_API_KEY
          const domain = process.env.MAILGUN_DOMAIN
          if (!apiKey || !domain) {
            throw new Error('Invalid Mailgun credentials')
          }
          const execute = async () => {
            if (!ctx.mailgun) {
              ctx.log.debug('create new mailgun instance')
              ctx.mailgun = new Mailgun({
                apiKey,
                domain,
                baseUrl: 'https://api.mailgun.net/v3/'
              })
            }
            ctx.log.debug({
              to: emailData.to,
              cc: emailData.cc,
              bcc: emailData.bcc,
              from: emailData.from,
              template: params.template,
              subject: emailData.subject,
              mailgunTemplate: params.mailgunTemplate,
            }, 'sending email via mailgun')
            const result = await ctx.mailgun.sendMessage(domain, emailData)
            return result
          }
          const result = await execute()
          const resultData = {
            to: emailData.to,
            cc: emailData.cc,
            bcc: emailData.bcc,
            from: emailData.from,
            template: params.template,
            subject: emailData.subject,
            ...result.body,
          }
          delete resultData.req
          ctx.log.info(resultData, 'email sent result')
          response = {
            status: 'sent',
            ...emailData,
            ...resultData,
          }
        } else {
          if (!params.testEmail) delete emailData.html
          ctx.log.debug(emailData, 'email ignored')
          response = {
            ...emailData,
            id: +new Date(),
            message: 'Queued',
            status: 'sent',
            mock: true,
          }
        }
      } catch (error) {
        ctx.log.error(error)
        Sentry.captureException(error)
        response = {
          error,
          status: 'failed',
          errorCode: error.code,
          errorMessage: error.message
        }
      }
      return response
    }
  )
}

const useEmail = async (ctx, next) => {
  ctx.sendEmail = async (params) => sendEmail(ctx, params)
  await next()
}

module.exports = { useEmail, getDomain, sendEmail }
