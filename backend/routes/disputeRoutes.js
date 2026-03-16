const router = require('express').Router()
const auth   = require('../middleware/authMiddleware')
const { upload, uploadToCloud } = require('../middleware/uploadMiddleware')
const {
  createDispute, getMyDisputes, addComment,
  getAllDisputes, resolveDispute, rejectDispute, reviewDispute
} = require('../controllers/disputeController')
const { requireAdmin } = require('../controllers/adminController')

// Utilisateurs
router.post('/',           auth, upload.array('photos', 5), uploadToCloud, createDispute)
router.get('/me',          auth, getMyDisputes)
router.post('/:id/comment',auth, addComment)

// Admin
router.get('/',              auth, requireAdmin, getAllDisputes)
router.put('/:id/resolve',   auth, requireAdmin, resolveDispute)
router.put('/:id/reject',    auth, requireAdmin, rejectDispute)
router.put('/:id/review',    auth, requireAdmin, reviewDispute)

module.exports = router