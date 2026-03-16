const router = require('express').Router()
const auth   = require('../middleware/authMiddleware')
const {
  requireAdmin, getStats, getUsers, verifyUser, suspendUser, unsuspendUser,
  getCars, verifyCar, rejectCar, getBookings
} = require('../controllers/adminController')
const {
  getAllDisputes, resolveDispute, rejectDispute, reviewDispute
} = require('../controllers/disputeController')

router.use(auth, requireAdmin)

router.get('/stats',                getStats)
router.get('/users',                getUsers)
router.put('/users/:id/verify',     verifyUser)
router.put('/users/:id/suspend',    suspendUser)
router.put('/users/:id/unsuspend',  unsuspendUser)
router.get('/cars',                 getCars)
router.put('/cars/:id/verify',      verifyCar)
router.put('/cars/:id/reject',      rejectCar)
router.get('/bookings',             getBookings)
router.get('/disputes',             getAllDisputes)
router.put('/disputes/:id/resolve', resolveDispute)
router.put('/disputes/:id/reject',  rejectDispute)
router.put('/disputes/:id/review',  reviewDispute)

module.exports = router