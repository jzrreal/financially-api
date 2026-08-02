/*
 * CREATE a .env file under server folder, and  copy and paste the contents of
 * .env.default file into this .env, and assign values
 */

/*
 * Should not use .env files in your production environment though
 * and rather set the values directly on the respective host.
 */

if (process.env.NODE_ENV !== 'production') {
  const dotenv = require('dotenv').config()
  if (dotenv.error) {
    throw dotenv.error
  }
}

const http = require('http')
const { prepareTmpFolder } = require('./src/api/lib/db')
const { db, app, config, logger } = require('./src/main')
const seeder = require('./src/config/seed')

prepareTmpFolder(logger)

logger.info('~ Running ' + process.env.NODE_ENV + ' mode ~')

const server = http.createServer(app.callback())

const startServer = () => {
  server.listen(config.port, err => {
    if (err) throw err
    logger.info(`~ API ready on port ${config.port}`)

    // Populate databases with sample data
    seeder()
  })
}

if (db.connection.readyState === 1) {
  startServer()
} else {
  db.connection.once('open', startServer)
}
db.connection.on('error', () => {
  logger.error('DB connection failed')
  process.exit(2)
})
