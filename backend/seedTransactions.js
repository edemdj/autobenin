const mongoose = require('mongoose')
require('dotenv').config()

const seed = async () => {
  await mongoose.connect(process.env.MONGO_URI)
  console.log('MongoDB connecté')

  const User     = require('./models/User')
  const Car      = require('./models/Car')
  const Booking  = require('./models/Booking')
  const Transaction = require('./models/Transaction')

  // Récupérer des users et voitures existants
  const owner  = await User.findOne({ role: 'owner' })
  const renter = await User.findOne({ role: 'renter' })
  const car    = await Car.findOne()

  if (!owner || !renter || !car) {
    console.log('❌ Pas assez de données. Lance d\'abord node seed.js')
    process.exit(1)
  }

  // Créer des réservations + transactions de test
  const bookingsData = [
    { days: 3, price: 55000,  status: 'completed' },
    { days: 2, price: 36000,  status: 'completed' },
    { days: 5, price: 90000,  status: 'confirmed' },
    { days: 1, price: 18000,  status: 'completed' },
    { days: 4, price: 72000,  status: 'pending'   },
  ]

  await Booking.deleteMany({ renter: renter._id })
  await Transaction.deleteMany({})

  for (const b of bookingsData) {
    const start = new Date()
    start.setDate(start.getDate() - Math.floor(Math.random() * 30))
    const end = new Date(start)
    end.setDate(end.getDate() + b.days)

    const booking = await Booking.create({
      car:           car._id,
      owner:         owner._id,
      renter:        renter._id,
      startDate:     start,
      endDate:       end,
      totalPrice:    b.price,
      depositAmount: b.price * 2,
      status:        b.status,
    })

    // Créer transaction pour les locations terminées/confirmées
    if (b.status === 'completed' || b.status === 'confirmed') {
      const commission = Math.round(b.price * 15 / 100)
      await Transaction.create({
        booking:         booking._id,
        owner:           owner._id,
        renter:          renter._id,
        rentalAmount:    b.price,
        commissionRate:  15,
        commissionAmount:commission,
        ownerAmount:     b.price - commission,
        ownerPaid:       b.status === 'completed',
        ownerPaidAt:     b.status === 'completed' ? new Date() : null,
        paymentMethod:   'mtn_momo',
      })
    }
  }

  const count = await Transaction.countDocuments()
  console.log(`✅ ${count} transactions créées !`)
  console.log(`   Owner: ${owner.name} · Renter: ${renter.name}`)
  process.exit(0)
}

seed().catch(err => { console.error(err); process.exit(1) })