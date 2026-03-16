const multer    = require('multer')
const cloudinary = require('cloudinary').v2
const { Readable } = require('stream')

// Configuration Cloudinary
cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key:    process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
})

// Stockage en mémoire (on envoie vers Cloudinary ensuite)
const storage = multer.memoryStorage()

const upload = multer({
  storage,
  limits: { fileSize: 5 * 1024 * 1024 }, // 5MB max par photo
  fileFilter: (req, file, cb) => {
    if (file.mimetype.startsWith('image/')) cb(null, true)
    else cb(new Error('Seules les images sont acceptées'))
  }
})

// Upload un buffer vers Cloudinary
const uploadToCloudinary = (buffer) => {
  return new Promise((resolve, reject) => {
    cloudinary.uploader.upload_stream(
      {},
      (error, result) => {
        if (error) reject(error)
        else resolve(result.secure_url)
      }
    ).end(buffer)
  })
}

// Middleware qui upload tous les fichiers vers Cloudinary
const uploadToCloud = async (req, res, next) => {
  console.log('📸 uploadToCloud appelé — fichiers reçus:', req.files ? req.files.length : 0)

  if (!req.files || req.files.length === 0) {
    console.log('📸 Aucun fichier reçu')
    return next()
  }

  console.log('📸 Cloudinary config:', {
    cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
    has_key: !!process.env.CLOUDINARY_API_KEY,
    has_secret: !!process.env.CLOUDINARY_API_SECRET,
  })

  if (!process.env.CLOUDINARY_CLOUD_NAME || process.env.CLOUDINARY_CLOUD_NAME === 'ton_cloud_name') {
    console.log('⚠️ Cloudinary non configuré')
    req.uploadedUrls = []
    return next()
  }

  try {
    const urls = await Promise.all(
      req.files.map(file => uploadToCloudinary(file.buffer))
    )
    console.log('✅ Photos uploadées sur Cloudinary:', urls)
    req.uploadedUrls = urls
    next()
  } catch (err) {
    console.error('❌ Cloudinary error:', err.message)
    req.uploadedUrls = []
    next()
  }
}

module.exports = { upload, uploadToCloud }