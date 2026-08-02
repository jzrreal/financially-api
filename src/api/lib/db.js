const path = require('path')
const fs = require('fs-extra')
const mongoose = require('mongoose')

const { logger } = require('./logger')
const config = require('../../config')

const getInstance = (dbURI, opts = {}) => {
  const dbOption = {}
  if (process.env.DB_USER) {
    dbOption.user = process.env.DB_USER
    dbOption.pass = process.env.DB_PASSWORD
  }

  if (!opts.silent && process.env.DB_VERBOSE) {
    mongoose.set('debug', function(
      collectionName, method, query, doc, options
    ) {
      if (method === 'bulkWrite' && query && query.length > 10) {
        logger.debug({
          mongoose: {
            collection: collectionName,
            method: method,
            operationCount: query.length
          }
        }, 'Mongoose bulk operation')
        return
      }
      const isProd = process.env.NODE_ENV === 'production'
      const isReadOperation = ['find', 'findOne', 'countDocuments']
        .includes(method)
      const isWriteOperation = [
        'save',
        'insert',
        'update',
        'remove',
        'delete',
        'create',
        'insertMany',
        'updateMany',
        'deleteMany'
      ].some(op => method.includes(op))
      if (isProd && isReadOperation) {
        if (Math.random() > 0.001) return
      }
      if (isProd && collectionName.includes('analytic') && !isWriteOperation) {
        return
      }
      let logQuery = query
      if (typeof query === 'object' && JSON.stringify(query).length > 500) {
        logQuery = {
          _summary: 'Large query object',
          keys: Object.keys(query)
        }
      }
      logger.debug({
        mongoose: {
          collection: collectionName,
          method: method,
          query: logQuery
        }
      }, 'Mongoose operation')
    })
  }

  const uri = dbURI || config.mongo.uri
  const connect = async () => mongoose.connect(uri, dbOption)

  const connection = mongoose.connection
  connection.once('error', (error) => {
    logger.error(error, '~ Database connection error')
  })
  connection.once('open', () => {
    const data = process.env.DEBUG_DB_URI && { uri }
    logger.info(data, '~ Database connected')
  })

  return { connect, connection }
}

const prepareTmpFolder = async (logger) => {
  const tmpDir = path.resolve(process.env.TMP_UPLOAD_DIR)
  await fs.mkdir(tmpDir, { recursive: true })
  if (logger) logger.debug({ tmpDir }, '~ Temp folder ready')
}

module.exports = { getInstance, prepareTmpFolder }
