const router = require('express').Router()
const auth   = require('../middleware/authMiddleware')
const { createReview, getCarReviews, getMyReviews } = require('../controllers/reviewController')

router.post('/',              auth, createReview)
router.get('/car/:carId',          getCarReviews)
router.get('/me',             auth, getMyReviews)

module.exports = router