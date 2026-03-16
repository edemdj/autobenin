const router = require('express').Router()
const auth   = require('../middleware/authMiddleware')
const { requireAdmin } = require('../controllers/adminController')
const {
  getAdminFinanceStats, getAdminTransactions, markOwnerPaid,
  getOwnerWallet
} = require('../controllers/financeController')

// Admin
router.get('/admin/stats',               auth, requireAdmin, getAdminFinanceStats)
router.get('/admin/transactions',         auth, requireAdmin, getAdminTransactions)
router.put('/admin/transactions/:id/pay', auth, requireAdmin, markOwnerPaid)

// Propriétaire
router.get('/owner/wallet', auth, getOwnerWallet)

module.exports = router