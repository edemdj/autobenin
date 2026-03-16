const mongoose = require('mongoose')

const transactionSchema = new mongoose.Schema({
  booking:      { type: mongoose.Schema.Types.ObjectId, ref: 'Booking', required: true },
  owner:        { type: mongoose.Schema.Types.ObjectId, ref: 'User',    required: true },
  renter:       { type: mongoose.Schema.Types.ObjectId, ref: 'User',    required: true },
  // Montants
  rentalAmount:    { type: Number, required: true }, // montant total location
  commissionRate:  { type: Number, default: 15 },    // % commission plateforme
  commissionAmount:{ type: Number, required: true }, // montant commission
  ownerAmount:     { type: Number, required: true }, // montant reversé au propriétaire
  // Statut paiement propriétaire
  ownerPaid:       { type: Boolean, default: false },
  ownerPaidAt:     { type: Date },
  ownerPaymentRef: { type: String }, // référence virement Mobile Money
  // Méthode de paiement locataire
  paymentMethod:   { type: String, enum: ['mtn_momo', 'moov_money', 'card'], default: 'mtn_momo' },
}, { timestamps: true })

module.exports = mongoose.model('Transaction', transactionSchema)