const mongoose = require('mongoose')

const carSchema = new mongoose.Schema({
  owner:         { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  brand:         { type: String, required: true },
  model:         { type: String, required: true },
  year:          { type: Number, required: true },
  plateNumber:   { type: String, required: true },
  type:          { type: String, enum: ['Berline','SUV','4x4','Minibus'], required: true },
  fuel:          { type: String, enum: ['Essence','Diesel'], required: true },
  transmission:  { type: String, enum: ['Manuelle','Automatique'], default: 'Manuelle' },
  seats:         { type: Number, required: true },
  pricePerDay:   { type: Number, required: true },
  depositAmount: { type: Number, default: 0 },
  city:          { type: String, required: true },
  description:   { type: String },
  images:        [{ type: String }],
  carteGrise:    { type: String },
  isAvailable:   { type: Boolean, default: true },
  isVerified:    { type: Boolean, default: false },
  rating:        { type: Number, default: 0 },
  reviewCount:   { type: Number, default: 0 },
  rating:        { type: Number, default: 0 },
}, { timestamps: true })

module.exports = mongoose.model('Car', carSchema)