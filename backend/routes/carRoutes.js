const router  = require('express').Router()
const { getCars, getCarById, createCar, getMyCars, updateCar } = require('../controllers/carController')
const auth    = require('../middleware/authMiddleware')
const { upload, uploadToCloud } = require('../middleware/uploadMiddleware')

router.get('/',          getCars)
router.get('/owner/me',  auth, getMyCars)
router.get('/:id',       getCarById)
router.post('/', auth, upload.array('images', 10), uploadToCloud, createCar)
router.put('/:id', auth, upload.array('images', 10), uploadToCloud, updateCar)

module.exports = router