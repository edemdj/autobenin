const Review  = require('../models/Review')
const Booking = require('../models/Booking')
const Car     = require('../models/Car')
const User    = require('../models/User')

// POST /api/reviews — laisser un avis
exports.createReview = async (req, res) => {
  try {
    const { bookingId, rating, comment } = req.body

    const booking = await Booking.findById(bookingId).populate('car owner')
    if (!booking) return res.status(404).json({ message: 'Réservation introuvable.' })
    if (String(booking.renter) !== String(req.user._id))
      return res.status(403).json({ message: 'Seul le locataire peut laisser un avis.' })
    if (booking.status !== 'completed')
      return res.status(400).json({ message: 'La location doit être terminée pour laisser un avis.' })

    // Vérifier qu'il n'y a pas déjà un avis
    const existing = await Review.findOne({ booking: bookingId, reviewer: req.user._id })
    if (existing) return res.status(400).json({ message: 'Vous avez déjà laissé un avis pour cette réservation.' })

    const review = await Review.create({
      booking:  bookingId,
      car:      booking.car._id,
      reviewer: req.user._id,
      reviewed: booking.owner._id,
      rating:   Number(rating),
      comment:  comment || '',
    })

    // Mettre à jour la note moyenne de la voiture
    const carReviews = await Review.find({ car: booking.car._id })
    const avgRating  = carReviews.reduce((s, r) => s + r.rating, 0) / carReviews.length
    await Car.findByIdAndUpdate(booking.car._id, {
      rating:      Math.round(avgRating * 10) / 10,
      reviewCount: carReviews.length,
    })

    // Mettre à jour la note moyenne du propriétaire
    const ownerReviews = await Review.find({ reviewed: booking.owner._id })
    const ownerAvg     = ownerReviews.reduce((s, r) => s + r.rating, 0) / ownerReviews.length
    await User.findByIdAndUpdate(booking.owner._id, {
      rating: Math.round(ownerAvg * 10) / 10,
    })

    await review.populate('reviewer', 'name')
    res.status(201).json(review)
  } catch (err) {
    if (err.code === 11000) return res.status(400).json({ message: 'Vous avez déjà laissé un avis pour cette réservation.' })
    res.status(400).json({ message: err.message })
  }
}

// GET /api/reviews/car/:carId — avis d'une voiture
exports.getCarReviews = async (req, res) => {
  try {
    const reviews = await Review.find({ car: req.params.carId })
      .populate('reviewer', 'name createdAt')
      .sort({ createdAt: -1 })
    res.json(reviews)
  } catch (err) {
    res.status(500).json({ message: err.message })
  }
}

// GET /api/reviews/me — mes avis donnés
exports.getMyReviews = async (req, res) => {
  try {
    const reviews = await Review.find({ reviewer: req.user._id })
      .populate('car', 'brand model')
      .populate('booking', 'startDate endDate')
      .sort({ createdAt: -1 })
    res.json(reviews)
  } catch (err) {
    res.status(500).json({ message: err.message })
  }
}