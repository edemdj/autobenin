const Car = require('../models/Car')

// GET /api/cars
exports.getCars = async (req, res) => {
  try {
    const { city, type } = req.query
    const filter = {}  // montrer toutes les voitures
    if (city) filter.city = city
    if (type) filter.type = type
    const cars = await Car.find(filter).populate('owner', 'name rating')
    res.json(cars)
  } catch (err) {
    res.status(500).json({ message: err.message })
  }
}

// GET /api/cars/:id
exports.getCarById = async (req, res) => {
  try {
    const car = await Car.findById(req.params.id).populate('owner', 'name phone rating')
    if (!car) return res.status(404).json({ message: 'Voiture non trouvee' })
    res.json(car)
  } catch (err) {
    res.status(500).json({ message: err.message })
  }
}

// POST /api/cars
exports.createCar = async (req, res) => {
  try {
    const {
      brand, model, year, city, type, fuel,
      transmission, seats, pricePerDay, depositAmount,
      description, plateNumber
    } = req.body

    const car = await Car.create({
      owner:        req.user.id,
      brand,
      model,
      year:         Number(year),
      city,
      type,
      fuel,
      transmission: transmission || 'Manuelle',
      seats:        Number(seats) || 5,
      pricePerDay:  Number(pricePerDay),
      depositAmount:Number(depositAmount) || 0,
      description:  description || '',
      plateNumber:  plateNumber || 'XX-0000-XX',
      isAvailable:  true,
      isVerified:   false,
      // URLs Cloudinary des photos uploadées
      images:       req.uploadedUrls || [],
    })

    res.status(201).json(car)
  } catch (err) {
    res.status(400).json({ message: err.message })
  }
}

// TODO: updateCar, deleteCar
// GET /api/cars/owner/me — voitures du propriétaire connecté
exports.getMyCars = async (req, res) => {
  try {
    const cars = await Car.find({ owner: req.user.id })
    res.json(cars)
  } catch (err) {
    res.status(500).json({ message: err.message })
  }
}

// PUT /api/cars/:id
exports.updateCar = async (req, res) => {
  try {
    const car = await Car.findById(req.params.id)
    if (!car) return res.status(404).json({ message: 'Voiture introuvable.' })
    if (String(car.owner) !== String(req.user.id))
      return res.status(403).json({ message: 'Accès refusé.' })

    const updates = { ...req.body }
    if (req.body.pricePerDay)   updates.pricePerDay   = Number(req.body.pricePerDay)
    if (req.body.depositAmount) updates.depositAmount = Number(req.body.depositAmount)
    if (req.body.year)          updates.year          = Number(req.body.year)
    if (req.body.seats)         updates.seats         = Number(req.body.seats)

    // Nouvelles photos uploadées
    if (req.uploadedUrls && req.uploadedUrls.length > 0) {
      updates.images = req.uploadedUrls
    }

    const updated = await Car.findByIdAndUpdate(req.params.id, updates, { new: true })
    res.json(updated)
  } catch (err) {
    res.status(400).json({ message: err.message })
  }
}