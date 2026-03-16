const router  = require('express').Router()
const auth    = require('../middleware/authMiddleware')
const Booking = require('../models/Booking')
const { generateContract } = require('../services/contractService')

// GET /api/contracts/:bookingId — télécharger le contrat PDF
router.get('/:bookingId', auth, async (req, res) => {
  try {
    const booking = await Booking.findById(req.params.bookingId)
      .populate('car',    'brand model year type transmission fuel plateNumber city images')
      .populate('owner',  'name email phone')
      .populate('renter', 'name email phone')

    if (!booking) return res.status(404).json({ message: 'Réservation introuvable.' })

    // Vérifier que l'utilisateur a accès à ce contrat
    const userId = String(req.user._id)
    const isOwner  = String(booking.owner?._id)  === userId
    const isRenter = String(booking.renter?._id) === userId
    const isAdmin  = req.user.role === 'admin'

    if (!isOwner && !isRenter && !isAdmin) {
      return res.status(403).json({ message: 'Accès refusé.' })
    }

    generateContract(booking, res)
  } catch (err) {
    console.error('Contract error:', err.message)
    res.status(500).json({ message: err.message })
  }
})

module.exports = router