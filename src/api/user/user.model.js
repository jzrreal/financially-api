const bcrypt = require('bcrypt')
const mongoose = require('mongoose')
const mongoosePaginate = require('mongoose-paginate-v2')

const { UserStatus, UserRole } = require('../lib/constants')

const saltRounds = 10

var userSchema = mongoose.Schema({
  picture: String,
  fullname: String,
  email: {
    type: String,
    lowercase: true,
    unique: true,
    required: [true, 'email is required']
  },
  emailVerifiedAt: Date,
  phone: String,
  phoneVerifiedAt: Date,
  password: {
    type: String,
    required: [true, 'password is required'],
    min: [6, 'password must be at least 6 characters'],
    select: false,
  },
  dateOfBirth: {
    type: Date,
    required: true,
  },
  address: String,
  role: {
    type: String,
    required: true,
    default: UserRole.Member,
  },
  status: {
    type: String,
    required: true,
    default: UserStatus.Pending,
  },
  isFnclySpr: Boolean,
  forgotPassRequestedAt: Date,
}, {
  timestamps: true,
  toJSON: { virtuals: true }
})

userSchema.pre('save', async function encryptPassword() {
  const user = this
  if (user.isModified('email')) {
    user.email = user.email.replace(/\s+/g, '').toLowerCase()
  }
  if (!user.isModified('password')) {
    return
  }
  const hash = await bcrypt.hash(user.password, saltRounds)
  user.password = hash
})

userSchema.methods.comparePassword = async function(myPlaintextPassword) {
  const hash = this.password
  if (!myPlaintextPassword || !hash) {
    return false
  }
  return bcrypt.compare(myPlaintextPassword, hash)
}

userSchema.plugin(mongoosePaginate)

module.exports = mongoose.model('User', userSchema)
