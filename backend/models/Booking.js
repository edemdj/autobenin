const mongoose = require('mongoose')

const bookingSchema = new mongoose.Schema({
  car:           { type: mongoose.Schema.Types.ObjectId, ref: 'Car',  required: true },
  owner:         { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  renter:        { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  startDate:     { type: Date, required: true },
  endDate:       { type: Date, required: true },
  totalPrice:    { type: Number, required: true },
  depositAmount: { type: Number, required: true },
  status: {
    type: String,
    enum: ['pending','confirmed','cancelled','completed'],
    default: 'pending'
  },
  photosBefore:  [{ type: String }],
  photosAfter:   [{ type: String }],
  contractUrl:   { type: String },
}, { timestamps: true })

module.exports = mongoose.model('Booking', bookingSchema)