const User = require('../models/User')
const { sendWelcomeEmail } = require('../services/emailService')
const jwt  = require('jsonwebtoken')

// POST /api/auth/register
exports.register = async (req, res) => {
  try {
    const { name, email, phone, password, role, city } = req.body

    // Vérifier si l'email existe déjà
    const existing = await User.findOne({ email })
    if (existing) return res.status(400).json({ message: 'Cet email est déjà utilisé.' })

    const user  = await User.create({ name, email, phone, password, role: role || 'renter', city })
    const token = jwt.sign({ id: user._id }, process.env.JWT_SECRET, { expiresIn: '7d' })

    // SMS de bienvenue (non bloquant)
    sendWelcomeEmail(user).catch(() => {})

    res.status(201).json({
      token,
      user: { id: user._id, name: user.name, email: user.email, role: user.role, city: user.city }
    })
  } catch (err) {
    res.status(400).json({ message: err.message })
  }
}

// POST /api/auth/login
exports.login = async (req, res) => {
  try {
    const { email, password } = req.body
    if (!email || !password)
      return res.status(400).json({ message: 'Email et mot de passe requis.' })

    const user = await User.findOne({ email })
    if (!user || !(await user.comparePassword(password)))
      return res.status(401).json({ message: 'Email ou mot de passe incorrect.' })

    const token = jwt.sign({ id: user._id }, process.env.JWT_SECRET, { expiresIn: '7d' })
    res.json({
      token,
      user: { id: user._id, name: user.name, email: user.email, role: user.role, city: user.city }
    })
  } catch (err) {
    res.status(400).json({ message: err.message })
  }
}

// GET /api/auth/me  — retourne l'utilisateur connecté
exports.getMe = async (req, res) => {
  try {
    const user = await User.findById(req.user.id).select('-password')
    if (!user) return res.status(404).json({ message: 'Utilisateur introuvable.' })
    res.json(user)
  } catch (err) {
    res.status(500).json({ message: err.message })
  }
}