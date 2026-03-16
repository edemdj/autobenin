const router = require('express').Router()
const { register, login, getMe } = require('../controllers/authController')
const auth = require('../middleware/authMiddleware')

router.post('/register', register)
router.post('/login',    login)
router.get('/me',        auth, getMe)  // ← route protégée

module.exports = router