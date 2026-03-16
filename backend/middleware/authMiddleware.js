const jwt  = require('jsonwebtoken')
const User = require('../models/User')

const authMiddleware = async (req, res, next) => {
  const token = req.headers.authorization?.split(' ')[1]
  if (!token) return res.status(401).json({ message: 'Token manquant' })
  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET)
    // Charger l'utilisateur complet (avec role) depuis la DB
    const user = await User.findById(decoded.id).select('-password')
    if (!user) return res.status(401).json({ message: 'Utilisateur introuvable.' })
    req.user = user
    next()
  } catch {
    res.status(401).json({ message: 'Token invalide' })
  }
}

module.exports = authMiddleware