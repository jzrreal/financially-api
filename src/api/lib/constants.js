const AppEcosystem = process.env.APP_ECOSYSTEM || 'financially'
const DebugEmailContentEnabled =
  process.env.DEBUG_MAIL_CONTENT === 'true'

const ShortBaseURL = process.env.SHORT_BASE_URL ||
  'http://fncly.co'

const UserRole = {
  Superadmin: 'superadmin',
  Admin: 'admin',
  Member: 'member',
}

const UserStatus = {
  Active: 'active',
  Pending: 'pending',
  Suspended: 'suspended',
}

module.exports = {
  UserRole,
  UserStatus,
  AppEcosystem,
  ShortBaseURL,
  DebugEmailContentEnabled,
}
