const express = require('express')
const cors    = require('cors')
const dotenv  = require('dotenv')
const connectDB = require('./config/db')

dotenv.config()
connectDB()

const app = express()
app.use(cors({
  origin: [
    'http://localhost:3000',
    'https://autobenin.vercel.app',
    process.env.FRONTEND_URL,
    /\.vercel\.app$/,
  ].filter(Boolean),
  credentials: true
}))
app.use(express.json())

app.get('/api/health', (req, res) => res.json({ status: 'ok', uptime: process.uptime() }))
app.use('/api/auth',     require('./routes/authRoutes'))
app.use('/api/cars',     require('./routes/carRoutes'))
app.use('/api/bookings', require('./routes/bookingRoutes'))
app.use('/api/payments', require('./routes/paymentRoutes'))
app.use('/api/admin',    require('./routes/adminRoutes'))
app.use('/api/disputes', require('./routes/disputeRoutes'))
app.use('/api/finance',  require('./routes/financeRoutes'))
app.use('/api/contracts', require('./routes/contractRoutes'))

app.use(require('./middleware/errorHandler'))

const PORT = process.env.PORT || 5000
app.listen(PORT, () => console.log(`Serveur demarré sur le port ${PORT}`))
// ── KEEP ALIVE — empêche Render de mettre le serveur en veille ──
if (process.env.NODE_ENV === 'production') {
  const https = require('https')
  setInterval(() => {
    https.get(process.env.RENDER_EXTERNAL_URL || 'https://autobenin.onrender.com/api/health', (res) => {
      console.log('Keep-alive ping:', res.statusCode)
    }).on('error', () => {})
  }, 10 * 60 * 1000) // toutes les 10 minutes
}