const pubKeyWhitelist = []
if (process.env.APP_ORIGINS) {
  process.env.APP_ORIGINS.split('|').forEach(s => pubKeyWhitelist.push(s))
}

const port = process.env.PORT || 3000

const mongo = {
  uri: process.env.DB_URI || 'mongodb://localhost/financially'
}

const auth = {
  secret: process.env.AUTH_SECRET || 'tzTr857mSxLnRp4muGCp7iFQLBWtthkd',
  pubKey: process.env.API_PUBLIC_KEY_SECRET || 'pubk3yr4h4s14',
  subPrefix: 'financially-oauth2',
  issuer: 'https://api.financially.com',
  symmetricIV: process.env.AUTH_SYMMETRIC_IV || 'nSXfUdoISF11A9KA',
}

module.exports = {
  port,
  mongo,
  auth,
  pubKeyWhitelist,
}
