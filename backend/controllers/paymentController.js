const Payment  = require('../models/Payment')
const Booking  = require('../models/Booking')
const User     = require('../models/User')
const { sendPaymentConfirmedRenter, sendPaymentNotifOwner } = require('../services/emailService')
const { createTransaction } = require('./financeController')
const { requestToPay, getPaymentStatus } = require('../services/paymentService')

// POST /api/payments/init — initier un paiement Mobile Money
exports.initPayment = async (req, res) => {
  try {
    const { bookingId, phone, type } = req.body // type: 'rental' ou 'deposit'

    // Vérifier que la réservation existe et appartient à l'utilisateur
    const booking = await Booking.findById(bookingId)
    if (!booking) return res.status(404).json({ message: 'Réservation introuvable.' })
    if (String(booking.renter) !== String(req.user.id))
      return res.status(403).json({ message: 'Accès refusé.' })

    const amount = type === 'deposit' ? booking.depositAmount : booking.totalPrice

    // Appel à l'API MTN MoMo
    const referenceId = await requestToPay({
      amount,
      phone,
      bookingId: String(bookingId),
      description: `AutoBénin — ${type === 'deposit' ? 'Caution' : 'Location'} ${booking._id}`,
    })

    // Sauvegarder le paiement en base
    const payment = await Payment.create({
      booking:    bookingId,
      user:       req.user.id,
      amount,
      type,
      method:     'mtn_momo',
      phone,
      status:     'pending',
      externalId: referenceId,
    })

    res.status(201).json({
      paymentId:   payment._id,
      referenceId,
      status:      'pending',
      message:     'Demande envoyée. Confirme sur ton téléphone MTN MoMo.',
    })
  } catch (err) {
    console.error('MoMo error:', err.response?.data || err.message)
    res.status(500).json({ message: 'Erreur lors de l\'initialisation du paiement.' })
  }
}

// GET /api/payments/:id/status — vérifier le statut d'un paiement
exports.checkStatus = async (req, res) => {
  try {
    const payment = await Payment.findById(req.params.id)
    if (!payment) return res.status(404).json({ message: 'Paiement introuvable.' })

    // Vérifier le statut auprès de MTN MoMo
    const momoStatus = await getPaymentStatus(payment.externalId)

    // Mettre à jour en base
    if (momoStatus === 'SUCCESSFUL' && payment.status !== 'success') {
      payment.status = 'success'
      await payment.save()

      // Confirmer la réservation si le paiement de location est réussi
      if (payment.type === 'rental') {
        const booking = await Booking.findByIdAndUpdate(payment.booking, { status: 'confirmed' }, { new: true }).populate('car')
        // SMS aux deux parties
        try {
          const renter = await User.findById(payment.user)
          const owner  = await User.findById(booking?.owner)
          if (renter) sendPaymentConfirmedRenter(renter, payment.amount).catch(() => {})
          if (owner && booking) sendPaymentNotifOwner(owner, renter, booking.car, payment.amount).catch(() => {})
          // Créer la transaction avec commission 15%
          createTransaction(payment.booking, payment.method).catch(() => {})
        } catch(e) {}
      }
    } else if (momoStatus === 'FAILED') {
      payment.status = 'failed'
      await payment.save()
    }

    res.json({ status: payment.status, momoStatus })
  } catch (err) {
    console.error('Status check error:', err.message)
    res.status(500).json({ message: 'Erreur lors de la vérification.' })
  }
}

// POST /api/payments/webhook — callback automatique MTN MoMo
exports.webhook = async (req, res) => {
  try {
    const { referenceId, status } = req.body
    if (!referenceId) return res.status(400).json({ message: 'referenceId manquant.' })

    const payment = await Payment.findOne({ externalId: referenceId })
    if (!payment) return res.status(404).json({ message: 'Paiement introuvable.' })

    if (status === 'SUCCESSFUL') {
      payment.status = 'success'
      await payment.save()
      if (payment.type === 'rental') {
        await Booking.findByIdAndUpdate(payment.booking, { status: 'confirmed' })
      }
    } else if (status === 'FAILED') {
      payment.status = 'failed'
      await payment.save()
    }

    res.json({ received: true })
  } catch (err) {
    res.status(500).json({ message: err.message })
  }
}