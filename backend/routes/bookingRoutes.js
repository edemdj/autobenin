const router = require('express').Router()
const { createBooking, getMyBookings, getOwnerBookings, confirmBooking, cancelBooking, adminConfirmPayment } = require('../controllers/bookingController')
const auth = require('../middleware/authMiddleware')

router.post('/',  auth, createBooking)
router.get('/me',    auth, getMyBookings)
router.get('/owner',      auth, getOwnerBookings)
router.put('/:id/confirm', auth, confirmBooking)
router.put('/:id/cancel',  auth, cancelBooking)
router.put('/:id/payment-confirmed', auth, adminConfirmPayment) // admin confirme paiement reçu

module.exports = router