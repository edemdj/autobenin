const Booking = require('../models/Booking')
const Car     = require('../models/Car')
const User    = require('../models/User')
const { sendBookingNotifOwner, sendBookingConfirmedRenter, sendCancellationEmail, sendPaymentInstructions } = require('../services/emailService')

// POST /api/bookings
exports.createBooking = async (req, res) => {
  try {
    const { carId, startDate, endDate, paymentPhone, paymentMethod } = req.body

    // Vérifier que carId est un ObjectId MongoDB valide
    if (!carId || !carId.match(/^[0-9a-fA-F]{24}$/)) {
      return res.status(400).json({ message: "ID de voiture invalide. Cette voiture n'existe pas encore en base de données." })
    }

    const car = await Car.findById(carId)
    if (!car || !car.isAvailable)
      return res.status(400).json({ message: 'Voiture non disponible' })

    const days       = Math.ceil((new Date(endDate) - new Date(startDate)) / (1000*60*60*24))
    const totalPrice = days * car.pricePerDay

    const booking = await Booking.create({
      car: carId, owner: car.owner, renter: req.user._id,
      startDate, endDate, totalPrice, depositAmount: car.depositAmount
    })
    // SMS au propriétaire (non bloquant)
    try {
      const owner  = await User.findById(car.owner)
      const renter = await User.findById(req.user._id)
      if (owner && renter) sendBookingNotifOwner(owner, renter, car, booking).catch(() => {})
      // Envoyer instructions de paiement au locataire
      sendPaymentInstructions(renter, car, booking, paymentMethod === 'moov_money' ? 'moov' : 'mtn').catch(() => {})
    } catch(e) {}

    res.status(201).json(booking)
  } catch (err) {
    res.status(400).json({ message: err.message })
  }
}

// GET /api/bookings/me
exports.getMyBookings = async (req, res) => {
  try {
    const bookings = await Booking.find({ renter: req.user._id })
      .populate('car', 'brand model images city')
    res.json(bookings)
  } catch (err) {
    res.status(500).json({ message: err.message })
  }
}

// TODO: updateBookingStatus, getOwnerBookings
// GET /api/bookings/owner — réservations reçues par le propriétaire
exports.getOwnerBookings = async (req, res) => {
  try {
    const bookings = await Booking.find({ owner: req.user._id })
      .populate('car', 'brand model city images')
      .populate('renter', 'name phone')
      .sort({ createdAt: -1 })
    res.json(bookings)
  } catch (err) {
    res.status(500).json({ message: err.message })
  }
}

// PUT /api/bookings/:id/confirm
exports.confirmBooking = async (req, res) => {
  try {
    const booking = await Booking.findById(req.params.id)
      .populate('car')
      .populate('renter')
      .populate('owner')
    if (!booking) return res.status(404).json({ message: 'Réservation introuvable.' })
    if (String(booking.owner._id) !== String(req.user._id))
      return res.status(403).json({ message: 'Accès refusé.' })

    booking.status = 'confirmed'
    await booking.save()

    // SMS au locataire
    sendBookingConfirmedRenter(booking.renter, booking.owner, booking.car, booking).catch(() => {})

    res.json(booking)
  } catch (err) {
    res.status(400).json({ message: err.message })
  }
}

// PUT /api/bookings/:id/cancel
exports.cancelBooking = async (req, res) => {
  try {
    const booking = await Booking.findById(req.params.id).populate('car')
    if (!booking) return res.status(404).json({ message: 'Réservation introuvable.' })

    booking.status = 'cancelled'
    await booking.save()

    // SMS à l'utilisateur
    const user = await User.findById(req.user._id)
    if (user) sendCancellationEmail(user, booking.car).catch(() => {})

    res.json(booking)
  } catch (err) {
    res.status(400).json({ message: err.message })
  }
}

// PUT /api/bookings/:id/payment-confirmed — admin confirme réception paiement
exports.adminConfirmPayment = async (req, res) => {
  try {
    if (req.user.role !== 'admin') return res.status(403).json({ message: 'Réservé à l\'admin.' })

    const booking = await Booking.findById(req.params.id)
      .populate('car')
      .populate('renter')
      .populate('owner')
    if (!booking) return res.status(404).json({ message: 'Réservation introuvable.' })

    booking.status = 'confirmed'
    booking.paymentConfirmedAt = new Date()
    await booking.save()

    // Notifier le propriétaire
    if (booking.owner && booking.renter && booking.car) {
      sendBookingConfirmedRenter(booking.renter, booking.owner, booking.car, booking).catch(() => {})
    }

    res.json(booking)
  } catch (err) {
    res.status(400).json({ message: err.message })
  }
}