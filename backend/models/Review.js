const mongoose = require('mongoose')

const reviewSchema = new mongoose.Schema({
  booking:  { type: mongoose.Schema.Types.ObjectId, ref: 'Booking', required: true },
  car:      { type: mongoose.Schema.Types.ObjectId, ref: 'Car' },
  reviewer: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  reviewed: { type: mongoose.Schema.Types.ObjectId, ref: 'User' }, // propriétaire
  rating:   { type: Number, min: 1, max: 5, required: true },
  comment:  { type: String, maxlength: 500 },
}, { timestamps: true })

// Empêcher un locataire de laisser 2 avis pour la même réservation
reviewSchema.index({ booking: 1, reviewer: 1 }, { unique: true })

module.exports = mongoose.model('Review', reviewSchema)