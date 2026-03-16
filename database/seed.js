const mongoose = require('mongoose')
const bcrypt   = require('bcryptjs')
require('dotenv').config({ path: '../backend/.env' })

const User    = require('../backend/models/User')
const Car     = require('../backend/models/Car')

const seed = async () => {
  await mongoose.connect(process.env.MONGO_URI)
  console.log('MongoDB connecté')

  // Nettoyer
  await User.deleteMany({})
  await Car.deleteMany({})

  // Créer des utilisateurs de test
  const users = await User.create([
    { name: 'Koffi Adjovi',  email: 'koffi@test.com',  phone: '+22997112233', password: 'test1234', role: 'renter', city: 'Cotonou',    isVerified: true  },
    { name: 'Fatou Bello',   email: 'fatou@test.com',  phone: '+22996445566', password: 'test1234', role: 'owner',  city: 'Porto-Novo', isVerified: true  },
    { name: 'Paul Dossou',   email: 'paul@test.com',   phone: '+22995778899', password: 'test1234', role: 'owner',  city: 'Parakou',    isVerified: true  },
  ])
  console.log('✅ Utilisateurs créés')

  // Créer des voitures de test
  await Car.create([
    { owner: users[1]._id, brand: 'Toyota',   model: 'Land Cruiser 200', year: 2020, plateNumber: 'AB-1234-CO', type: 'Berline', fuel: 'Diesel',  seats: 7,  pricePerDay: 65000, depositAmount: 300000, city: 'Cotonou',    description: 'Land Cruiser en parfait état.', isAvailable: true, isVerified: true, rating: 5.0 },
    { owner: users[2]._id, brand: 'Toyota',   model: 'Corolla 2020',     year: 2020, plateNumber: 'CD-5678-CO', type: 'Berline', fuel: 'Essence', seats: 5,  pricePerDay: 18000, depositAmount: 80000,  city: 'Porto-Novo', description: 'Corolla climatisée.', isAvailable: true, isVerified: true, rating: 4.9 },
    { owner: users[1]._id, brand: 'Hyundai',  model: 'Tucson 2021',      year: 2021, plateNumber: 'EF-9012-PN', type: 'SUV',     fuel: 'Essence', seats: 5,  pricePerDay: 28000, depositAmount: 120000, city: 'Cotonou',    description: 'Tucson spacieux.', isAvailable: true, isVerified: true, rating: 4.8 },
  ])
  console.log('✅ Voitures créées')

  console.log('\n🎉 Seed terminé !')
  console.log('Comptes de test :')
  console.log('  Locataire : koffi@test.com / test1234')
  console.log('  Propriétaire : fatou@test.com / test1234')

  process.exit(0)
}

seed().catch(err => { console.error(err); process.exit(1) })