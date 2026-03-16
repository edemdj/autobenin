const mongoose = require('mongoose')
const bcrypt   = require('bcryptjs')

const userSchema = new mongoose.Schema({
  name:          { type: String, required: true },
  email:         { type: String, required: true, unique: true },
  phone:         { type: String, required: true },
  password:      { type: String, required: true },
  role:          { type: String, enum: ['owner', 'renter', 'admin'], default: 'renter' },
isSuspended:   { type: Boolean, default: false },
  driverLicense: { type: String },
  idCard:        { type: String },
  selfie:        { type: String },
  isVerified:    { type: Boolean, default: false },
  rating:        { type: Number, default: 0 },
}, { timestamps: true })

userSchema.pre('save', async function(next) {
  if (!this.isModified('password')) return next()
  this.password = await bcrypt.hash(this.password, 10)
  next()
})

userSchema.methods.comparePassword = function(password) {
  return bcrypt.compare(password, this.password)
}

module.exports = mongoose.model('User', userSchema)