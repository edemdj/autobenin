const Dispute = require('../models/Dispute')
const Booking = require('../models/Booking')
const { upload, uploadToCloud } = require('../middleware/uploadMiddleware')

// POST /api/disputes — signaler un litige
exports.createDispute = async (req, res) => {
  try {
    const { bookingId, type, description, againstId } = req.body

    const booking = await Booking.findById(bookingId)
    if (!booking) return res.status(404).json({ message: 'Réservation introuvable.' })

    const dispute = await Dispute.create({
      booking:    bookingId,
      reportedBy: req.user._id,
      against:    againstId,
      type,
      description,
      photos:     req.uploadedUrls || [],
    })

    await dispute.populate([
      { path: 'reportedBy', select: 'name email' },
      { path: 'against',    select: 'name email' },
      { path: 'booking',    populate: { path: 'car', select: 'brand model' } },
    ])

    res.status(201).json(dispute)
  } catch (err) {
    res.status(400).json({ message: err.message })
  }
}

// GET /api/disputes/me — mes litiges
exports.getMyDisputes = async (req, res) => {
  try {
    const disputes = await Dispute.find({
      $or: [{ reportedBy: req.user._id }, { against: req.user._id }]
    })
      .populate('booking',    'startDate endDate')
      .populate('reportedBy', 'name')
      .populate('against',    'name')
      .sort({ createdAt: -1 })
    res.json(disputes)
  } catch (err) {
    res.status(500).json({ message: err.message })
  }
}

// POST /api/disputes/:id/comment — ajouter un commentaire
exports.addComment = async (req, res) => {
  try {
    const dispute = await Dispute.findById(req.params.id)
    if (!dispute) return res.status(404).json({ message: 'Litige introuvable.' })

    dispute.comments.push({ author: req.user._id, text: req.body.text })
    await dispute.save()

    await dispute.populate('comments.author', 'name role')
    res.json(dispute)
  } catch (err) {
    res.status(400).json({ message: err.message })
  }
}

// ── Admin ──

// GET /api/disputes — tous les litiges (admin)
exports.getAllDisputes = async (req, res) => {
  try {
    const { status } = req.query
    const filter = status && status !== 'all' ? { status } : {}
    const disputes = await Dispute.find(filter)
      .populate('booking',    'startDate endDate totalPrice')
      .populate('reportedBy', 'name email phone')
      .populate('against',    'name email')
      .populate('comments.author', 'name role')
      .sort({ createdAt: -1 })
    res.json(disputes)
  } catch (err) {
    res.status(500).json({ message: err.message })
  }
}

// PUT /api/disputes/:id/resolve — résoudre un litige (admin)
exports.resolveDispute = async (req, res) => {
  try {
    const { resolution } = req.body
    const dispute = await Dispute.findByIdAndUpdate(
      req.params.id,
      { status: 'resolved', resolution },
      { new: true }
    ).populate('reportedBy against', 'name email')

    res.json(dispute)
  } catch (err) {
    res.status(400).json({ message: err.message })
  }
}

// PUT /api/disputes/:id/reject — rejeter un litige (admin)
exports.rejectDispute = async (req, res) => {
  try {
    const { resolution } = req.body
    const dispute = await Dispute.findByIdAndUpdate(
      req.params.id,
      { status: 'rejected', resolution },
      { new: true }
    )
    res.json(dispute)
  } catch (err) {
    res.status(400).json({ message: err.message })
  }
}

// PUT /api/disputes/:id/review — passer en révision (admin)
exports.reviewDispute = async (req, res) => {
  try {
    const dispute = await Dispute.findByIdAndUpdate(
      req.params.id,
      { status: 'in_review' },
      { new: true }
    )
    res.json(dispute)
  } catch (err) {
    res.status(400).json({ message: err.message })
  }
}