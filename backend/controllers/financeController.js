const Transaction = require('../models/Transaction')
const Booking     = require('../models/Booking')
const User        = require('../models/User')

const COMMISSION_RATE = 15 // 15%

// Créer une transaction après paiement confirmé
exports.createTransaction = async (bookingId, paymentMethod = 'mtn_momo') => {
  try {
    const booking = await Booking.findById(bookingId)
      .populate('owner renter car')
    if (!booking) return null

    const existing = await Transaction.findOne({ booking: bookingId })
    if (existing) return existing

    const rentalAmount     = booking.totalPrice
    const commissionAmount = Math.round(rentalAmount * COMMISSION_RATE / 100)
    const ownerAmount      = rentalAmount - commissionAmount

    const transaction = await Transaction.create({
      booking:         bookingId,
      owner:           booking.owner._id,
      renter:          booking.renter._id,
      rentalAmount,
      commissionRate:  COMMISSION_RATE,
      commissionAmount,
      ownerAmount,
      paymentMethod,
    })
    return transaction
  } catch (err) {
    console.error('Transaction error:', err.message)
    return null
  }
}

// ── Admin ──

// GET /api/finance/admin/stats — statistiques financières globales
exports.getAdminFinanceStats = async (req, res) => {
  try {
    const transactions = await Transaction.find()
    console.log('Finance stats - transactions found:', transactions.length)
    const totalRevenue     = transactions.reduce((s, t) => s + t.rentalAmount, 0)
    const totalCommission  = transactions.reduce((s, t) => s + t.commissionAmount, 0)
    const totalOwnerPaid   = transactions.filter(t => t.ownerPaid).reduce((s, t) => s + t.ownerAmount, 0)
    const totalOwnerPending= transactions.filter(t => !t.ownerPaid).reduce((s, t) => s + t.ownerAmount, 0)

    res.json({
      totalRevenue,
      totalCommission,
      totalOwnerPaid,
      totalOwnerPending,
      transactionCount: transactions.length,
      commissionRate:   COMMISSION_RATE,
    })
  } catch (err) {
    res.status(500).json({ message: err.message })
  }
}

// GET /api/finance/admin/transactions — toutes les transactions
exports.getAdminTransactions = async (req, res) => {
  try {
    const { paid } = req.query
    const filter = paid !== undefined ? { ownerPaid: paid === 'true' } : {}
    const transactions = await Transaction.find(filter)
      .populate('booking',  'startDate endDate')
      .populate('owner',    'name email phone')
      .populate('renter',   'name email')
      .sort({ createdAt: -1 })
    res.json(transactions)
  } catch (err) {
    res.status(500).json({ message: err.message })
  }
}

// PUT /api/finance/admin/transactions/:id/pay — marquer propriétaire payé
exports.markOwnerPaid = async (req, res) => {
  try {
    const { reference } = req.body
    const transaction = await Transaction.findByIdAndUpdate(
      req.params.id,
      { ownerPaid: true, ownerPaidAt: new Date(), ownerPaymentRef: reference || 'MANUAL' },
      { new: true }
    ).populate('owner', 'name email phone')
    res.json(transaction)
  } catch (err) {
    res.status(400).json({ message: err.message })
  }
}

// ── Propriétaire ──

// GET /api/finance/owner/wallet — portefeuille du propriétaire
exports.getOwnerWallet = async (req, res) => {
  try {
    const transactions = await Transaction.find({ owner: req.user._id })
      .populate('booking',  'startDate endDate')
      .populate('renter',   'name')
      .sort({ createdAt: -1 })

    const totalEarned   = transactions.reduce((s, t) => s + t.ownerAmount, 0)
    const totalPaid     = transactions.filter(t => t.ownerPaid).reduce((s, t) => s + t.ownerAmount, 0)
    const totalPending  = transactions.filter(t => !t.ownerPaid).reduce((s, t) => s + t.ownerAmount, 0)
    const totalCommission= transactions.reduce((s, t) => s + t.commissionAmount, 0)

    res.json({
      totalEarned,
      totalPaid,
      totalPending,
      totalCommission,
      commissionRate: COMMISSION_RATE,
      transactions,
    })
  } catch (err) {
    res.status(500).json({ message: err.message })
  }
}