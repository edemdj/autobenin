const mongoose = require('mongoose')

const paymentSchema = new mongoose.Schema({
  booking:    { type: mongoose.Schema.Types.ObjectId, ref: 'Booking', required: true },
  user:       { type: mongoose.Schema.Types.ObjectId, ref: 'User',    required: true },
  amount:     { type: Number, required: true },
  type:       { type: String, enum: ['rental','deposit'], required: true },
  method:     { type: String, enum: ['mtn_momo','moov_money','card'], required: true },
  phone:      { type: String },
  status:     { type: String, enum: ['pending','success','failed'], default: 'pending' },
  externalId: { type: String },
}, { timestamps: true })

module.exports = mongoose.model('Payment', paymentSchema)