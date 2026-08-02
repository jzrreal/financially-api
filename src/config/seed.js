'use strict'

const User = require('../api/user/user.model')
const { UserRole, UserStatus } = require('../api/lib/constants')

const seed = async () => {
  if (!process.env.SUPERADMIN_EMAIL || !process.env.SUPERADMIN_PASS)
    return
  let user = await User.findOne({
    email: process.env.SUPERADMIN_EMAIL,
  })
  const now = new Date()
  if (!user) {
    user = await User.create({
      fullname: 'superadmin',
      email: process.env.SUPERADMIN_EMAIL,
      phone: 'superadmin-phone',
      gender: 'male',
      address: 'superadmin-address',
      dateOfBirth: now,
      emailVerifiedAt: now,
      phoneVerifiedAt: now,
      password: process.env.SUPERADMIN_PASS,
      role: UserRole.Superadmin,
      status: UserStatus.Active,
      isP3miSpr: true,
    })
    console.log(`setup superadmin [${user.email}]`)
  }
}

module.exports = seed
