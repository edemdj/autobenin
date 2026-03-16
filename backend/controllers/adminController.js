const User    = require('../models/User')
const Car     = require('../models/Car')
const Booking = require('../models/Booking')
const Payment = require('../models/Payment')
const Dispute = require('../models/Dispute')

// Middleware — vérifier que l'utilisateur est admin
exports.requireAdmin = (req, res, next) => {
  if (!req.user || req.user.role !== 'admin') {
    return res.status(403).json({ message: 'Accès réservé aux administrateurs.' })
  }
  next()
}

// GET /api/admin/stats — statistiques globales
exports.getStats = async (req, res) => {
  try {
    const [users, cars, bookings, payments, disputes] = await Promise.all([
      User.countDocuments(),
      Car.countDocuments(),
      Booking.countDocuments(),
      Payment.find({ status: 'success' }),
      Dispute.countDocuments({ status: 'open' }),
    ])

    const totalRevenue    = payments.reduce((s, p) => s + p.amount, 0)
    const pendingBookings = await Booking.countDocuments({ status: 'pending' })
    const pendingCars     = await Car.countDocuments({ isVerified: false })
    const owners          = await User.countDocuments({ role: 'owner' })
    const renters         = await User.countDocuments({ role: 'renter' })

    res.json({
      users, cars, bookings, totalRevenue,
      pendingBookings, pendingCars, owners, renters,
      openDisputes: disputes,
    })
  } catch (err) {
    res.status(500).json({ message: err.message })
  }
}

// GET /api/admin/users — tous les utilisateurs
exports.getUsers = async (req, res) => {
  try {
    const { role, search } = req.query
    const filter = {}
    if (role)   filter.role = role
    if (search) filter.$or = [
      { name:  { $regex: search, $options: 'i' } },
      { email: { $regex: search, $options: 'i' } },
    ]
    const users = await User.find(filter).select('-password').sort({ createdAt: -1 })
    res.json(users)
  } catch (err) {
    res.status(500).json({ message: err.message })
  }
}

// PUT /api/admin/users/:id/verify — vérifier un utilisateur
exports.verifyUser = async (req, res) => {
  try {
    const user = await User.findByIdAndUpdate(
      req.params.id, { isVerified: true }, { new: true }
    ).select('-password')
    res.json(user)
  } catch (err) {
    res.status(500).json({ message: err.message })
  }
}

// PUT /api/admin/users/:id/suspend — suspendre un utilisateur
exports.suspendUser = async (req, res) => {
  try {
    const user = await User.findByIdAndUpdate(
      req.params.id, { isSuspended: true }, { new: true }
    ).select('-password')
    res.json(user)
  } catch (err) {
    res.status(500).json({ message: err.message })
  }
}

// GET /api/admin/cars — toutes les voitures
exports.getCars = async (req, res) => {
  try {
    const { verified, search } = req.query
    const filter = {}
    if (verified === 'false') filter.isVerified = false
    if (verified === 'true')  filter.isVerified = true
    if (search) filter.$or = [
      { brand: { $regex: search, $options: 'i' } },
      { model: { $regex: search, $options: 'i' } },
      { city:  { $regex: search, $options: 'i' } },
    ]
    const cars = await Car.find(filter)
      .populate('owner', 'name email phone city')
      .sort({ createdAt: -1 })
    res.json(cars)
  } catch (err) {
    res.status(500).json({ message: err.message })
  }
}

// PUT /api/admin/cars/:id/verify — approuver une voiture
exports.verifyCar = async (req, res) => {
  try {
    const car = await Car.findByIdAndUpdate(
      req.params.id, { isVerified: true, isAvailable: true }, { new: true }
    ).populate('owner', 'name email')
    res.json(car)
  } catch (err) {
    res.status(500).json({ message: err.message })
  }
}

// PUT /api/admin/cars/:id/reject — rejeter une voiture
exports.rejectCar = async (req, res) => {
  try {
    const car = await Car.findByIdAndUpdate(
      req.params.id, { isVerified: false, isAvailable: false }, { new: true }
    )
    res.json(car)
  } catch (err) {
    res.status(500).json({ message: err.message })
  }
}

// GET /api/admin/bookings — toutes les réservations
exports.getBookings = async (req, res) => {
  try {
    const { status } = req.query
    const filter = status ? { status } : {}
    const bookings = await Booking.find(filter)
      .populate('car',    'brand model city pricePerDay images')
      .populate('renter', 'name email phone city')
      .populate('owner',  'name email phone')
      .sort({ createdAt: -1 })
    res.json(bookings)
  } catch (err) {
    res.status(500).json({ message: err.message })
  }
}

// PUT /api/admin/users/:id/unsuspend — réintégrer un utilisateur
exports.unsuspendUser = async (req, res) => {
  try {
    const user = await User.findByIdAndUpdate(
      req.params.id, { isSuspended: false }, { new: true }
    ).select('-password')
    res.json(user)
  } catch (err) {
    res.status(500).json({ message: err.message })
  }
}