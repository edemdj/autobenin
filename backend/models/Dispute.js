const mongoose = require('mongoose')

const disputeSchema = new mongoose.Schema({
  booking:     { type: mongoose.Schema.Types.ObjectId, ref: 'Booking', required: true },
  reportedBy:  { type: mongoose.Schema.Types.ObjectId, ref: 'User',    required: true },
  against:     { type: mongoose.Schema.Types.ObjectId, ref: 'User',    required: true },
  type: {
    type: String,
    enum: ['damage', 'payment', 'no_show', 'other'],
    required: true
  },
  description: { type: String, required: true },
  photos:      [{ type: String }], // preuves photos
  status: {
    type: String,
    enum: ['open', 'in_review', 'resolved', 'rejected'],
    default: 'open'
  },
  resolution:  { type: String },  // décision de l'admin
  comments: [{
    author:    { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
    text:      { type: String },
    createdAt: { type: Date, default: Date.now }
  }],
}, { timestamps: true })

module.exports = mongoose.model('Dispute', disputeSchema)