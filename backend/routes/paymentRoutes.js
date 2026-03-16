const router = require('express').Router()
const { initPayment, checkStatus, webhook } = require('../controllers/paymentController')
const auth = require('../middleware/authMiddleware')

router.post('/init',         auth, initPayment)   // initier paiement
router.get('/:id/status',    auth, checkStatus)   // vérifier statut
router.post('/webhook',      webhook)              // callback MTN MoMo (pas de auth)

module.exports = router