import { useState, useEffect } from 'react'
import { useAuth } from '../context/AuthContext'
import { useNavigate } from 'react-router-dom'
import { getMyCars, createCar, updateCar } from '../services/carService'
import { getOwnerBookings, confirmBooking, cancelBooking } from '../services/bookingService'

const MY_CARS = [
  { id: 1, brand: 'Toyota',  model: 'Land Cruiser 200', price: 65000, deposit: 300000, type: '4x4',     transmission: 'Automatique', city: 'Cotonou',    available: true,  emoji: '🚙', earnings: 390000, trips: 6  },
  { id: 2, brand: 'Hyundai', model: 'Tucson 2021',      price: 28000, deposit: 120000, type: 'SUV',     transmission: 'Manuelle',    city: 'Porto-Novo', available: true,  emoji: '🚘', earnings: 224000, trips: 8  },
  { id: 3, brand: 'Toyota',  model: 'Corolla 2019',     price: 18000, deposit: 80000,  type: 'Berline', transmission: 'Manuelle',    city: 'Cotonou',    available: false, emoji: '🚗', earnings: 126000, trips: 7  },
]

const BOOKINGS = [
  { id: 'BK001', car: 'Toyota Land Cruiser 200', renter: 'Koffi Adjovi',  phone: '+229 97 11 22 33', start: '2025-06-10', end: '2025-06-12', days: 2, total: 130000, deposit: 300000, status: 'confirmed' },
  { id: 'BK002', car: 'Hyundai Tucson 2021',     renter: 'Paul Dossou',   phone: '+229 96 44 55 66', start: '2025-06-14', end: '2025-06-16', days: 2, total: 56000,  deposit: 120000, status: 'pending'   },
  { id: 'BK003', car: 'Toyota Corolla 2019',     renter: 'Amina Seck',    phone: '+229 95 77 88 99', start: '2025-06-05', end: '2025-06-07', days: 2, total: 36000,  deposit: 80000,  status: 'completed' },
  { id: 'BK004', car: 'Toyota Land Cruiser 200', renter: 'Jean Tossou',   phone: '+229 94 12 34 56', start: '2025-06-18', end: '2025-06-20', days: 2, total: 130000, deposit: 300000, status: 'pending'   },
  { id: 'BK005', car: 'Hyundai Tucson 2021',     renter: 'Marie Kanté',   phone: '+229 93 65 43 21', start: '2025-05-28', end: '2025-05-30', days: 2, total: 56000,  deposit: 120000, status: 'completed' },
]

const fmt = (n) => new Intl.NumberFormat('fr-FR').format(n) + ' FCFA'

const STATUS = {
  pending:   { label: 'En attente',  bg: '#fef9e7', color: '#b8860b', border: '#d4a017' },
  confirmed: { label: 'Confirmée',   bg: '#e8f5ee', color: '#1a6b3c', border: '#2d9a5a' },
  completed: { label: 'Terminée',    bg: '#f0f0f0', color: '#555',    border: '#aaa'    },
  cancelled: { label: 'Annulée',     bg: '#fdecea', color: '#c0392b', border: '#e74c3c' },
}

const TABS = ['Vue d\'ensemble', 'Mes voitures', 'Réservations', 'Ajouter une voiture']

export default function DashboardOwner() {
  const { user }   = useAuth()

  if (typeof document !== 'undefined' && !document.getElementById('dashboard-responsive')) {
    const s = document.createElement('style')
    s.id = 'dashboard-responsive'
    s.textContent = `
      @media (max-width: 768px) {
        .dashboard-tabs-bar { overflow-x: auto; -webkit-overflow-scrolling: touch; scrollbar-width: none; }
        .dashboard-tabs-bar::-webkit-scrollbar { display: none; }
        .dashboard-stats-grid { grid-template-columns: 1fr 1fr !important; gap: 0.8rem !important; }
        .dashboard-cars-grid { grid-template-columns: 1fr !important; }
        .booking-row { flex-direction: column !important; align-items: flex-start !important; }
      }
      @media (max-width: 480px) {
        .dashboard-stats-grid { grid-template-columns: 1fr 1fr !important; }
        .dashboard-header { padding: 1.5rem 5% !important; }
      }
    `
    document.head.appendChild(s)
  }
  const navigate   = useNavigate()

  const OWNER = {
    name:     user?.name       || 'Propriétaire',
    city:     user?.city       || '',
    rating:   user?.rating     || 0,
    verified: user?.isVerified || false,
  }

  // ── Tous les hooks AVANT tout return conditionnel ──
  const [myCars,       setMyCars]       = useState([])
  const [myBK,         setMyBK]         = useState([])
  const [dataLoading,  setDataLoading]  = useState(true)
  const [tab,          setTab]          = useState(0)
  const [bookingFilter,setBookingFilter] = useState('all')
  const [addSuccess,   setAddSuccess]   = useState(false)
  const [form,         setForm]         = useState({ brand:'', model:'', year:'', city:'Cotonou', type:'Berline', fuel:'Essence', transmission:'Manuelle', seats:'5', price:'', deposit:'', description:'', photos: null })
  const [formErrors,   setFormErrors]   = useState({})
  const [saving,       setSaving]       = useState(false)
  const [notif,        setNotif]        = useState('')
  const [editCar,      setEditCar]      = useState(null)  // voiture en cours de modification
  const [editForm,     setEditForm]     = useState({})
  const [editSaving,   setEditSaving]   = useState(false)
  const [toggling,     setToggling]     = useState(null)  // ID voiture en cours de toggle

  const showNotif = (msg) => { setNotif(msg); setTimeout(() => setNotif(''), 4000) }

  const downloadContract = (bookingId) => {
    const token = localStorage.getItem('token')
    fetch(`http://localhost:5000/api/contracts/${bookingId}`, {
      headers: { Authorization: `Bearer ${token}` }
    })
    .then(r => r.blob())
    .then(blob => {
      const url  = URL.createObjectURL(blob)
      const link = document.createElement('a')
      link.href  = url
      link.setAttribute('download', `contrat-${bookingId.slice(-6)}.pdf`)
      document.body.appendChild(link)
      link.click()
      document.body.removeChild(link)
      URL.revokeObjectURL(url)
    })
    .catch(err => showNotif('❌ Erreur téléchargement contrat'))
  }

  // Rediriger si pas propriétaire
  useEffect(() => {
    if (user && user.role !== 'owner') navigate('/profile')
  }, [user])

  // Charger les données API
  useEffect(() => {
    if (!user || user.role !== 'owner') return
    Promise.all([
      getMyCars().catch(() => ({ data: [] })),
      getOwnerBookings().catch(() => ({ data: [] })),
    ]).then(([carsRes, bkRes]) => {
      setMyCars(carsRes.data)
      setMyBK(bkRes.data)
    }).finally(() => setDataLoading(false))
  }, [user])

  // ── Returns conditionnels APRES tous les hooks ──
  if (!user) return (
    <div style={{ fontFamily: "'DM Sans', sans-serif", textAlign: 'center', padding: '8rem 2rem', paddingTop: 120 }}>
      <div style={{ fontSize: '2rem', marginBottom: 16 }}>⏳</div>
      <p style={{ color: '#5a7a62' }}>Chargement...</p>
    </div>
  )

  const MY_CARS  = myCars
  const BOOKINGS = myBK

  const totalEarnings  = MY_CARS.reduce((s, c) => s + (c.earnings || 0), 0)
  const totalTrips     = MY_CARS.reduce((s, c) => s + (c.trips || 0), 0)
  const pendingCount   = BOOKINGS.filter(b => b.status === 'pending').length
  const filteredBK     = bookingFilter === 'all' ? BOOKINGS : BOOKINGS.filter(b => b.status === bookingFilter)

  const handleFormChange = (k, v) => setForm(f => ({ ...f, [k]: v }))

  const validateForm = () => {
    const e = {}
    if (!form.brand)       e.brand    = 'Requis'
    if (!form.model)       e.model    = 'Requis'
    if (!form.year)        e.year     = 'Requis'
    if (!form.price)       e.price    = 'Requis'
    // deposit optionnel — 0 = sans caution
    setFormErrors(e)
    return Object.keys(e).length === 0
  }

  const handleSubmit = async () => {
    if (!validateForm()) return
    setSaving(true)
    try {
      // Construire le FormData pour envoyer les fichiers + données
      const formData = new FormData()
      formData.append('brand',        form.brand)
      formData.append('model',        form.model)
      formData.append('year',         form.year)
      formData.append('city',         form.city)
      formData.append('type',         form.type)
      formData.append('fuel',         form.fuel)
      formData.append('transmission', form.transmission)
      formData.append('seats',        form.seats)
      formData.append('pricePerDay',  form.price)
      formData.append('depositAmount',form.deposit)
      formData.append('description',  form.description)
      formData.append('plateNumber',  'XX-0000-XX') // placeholder

      // Ajouter les photos si présentes
      if (form.photos) {
        Array.from(form.photos).forEach(photo => formData.append('images', photo))
      }

      await createCar(formData)

      // Recharger les voitures après ajout
      const carsRes = await getMyCars()
      setMyCars(carsRes.data)

      setAddSuccess(true)
    } catch (err) {
      setFormErrors({ submit: err.response?.data?.message || 'Erreur lors de l\'ajout de la voiture.' })
    } finally {
      setSaving(false)
    }
  }

  // Toggle disponibilité
  const toggleAvailability = async (car) => {
    setToggling(car._id || car.id)
    try {
      await updateCar(car._id || car.id, { isAvailable: !(car.isAvailable !== undefined ? car.isAvailable : car.available) })
      const res = await getMyCars()
      setMyCars(res.data)
    } catch (err) {
      console.error('Toggle error:', err.message)
    } finally {
      setToggling(null)
    }
  }

  // Ouvrir le modal d'édition
  const openEdit = (car) => {
    setEditCar(car)
    setEditForm({
      brand:        car.brand        || '',
      model:        car.model        || '',
      year:         car.year         || '',
      city:         car.city         || 'Cotonou',
      type:         car.type         || 'Berline',
      fuel:         car.fuel         || 'Essence',
      transmission: car.transmission || 'Manuelle',
      seats:        car.seats        || 5,
      price:        car.pricePerDay  || car.price || '',
      deposit:      car.depositAmount|| car.deposit || '',
      description:  car.description  || '',
      photos:       null,
    })
  }

  // Sauvegarder les modifications
  const saveEdit = async () => {
    setEditSaving(true)
    try {
      const formData = new FormData()
      formData.append('brand',         editForm.brand)
      formData.append('model',         editForm.model)
      formData.append('year',          editForm.year)
      formData.append('city',          editForm.city)
      formData.append('type',          editForm.type)
      formData.append('fuel',          editForm.fuel)
      formData.append('transmission',  editForm.transmission)
      formData.append('seats',         editForm.seats)
      formData.append('pricePerDay',   editForm.price)
      formData.append('depositAmount', editForm.deposit)
      formData.append('description',   editForm.description)
      if (editForm.photos) {
        Array.from(editForm.photos).forEach(p => formData.append('images', p))
      }
      await updateCar(editCar._id || editCar.id, formData)
      const res = await getMyCars()
      setMyCars(res.data)
      setEditCar(null)
    } catch (err) {
      console.error('Edit error:', err.message)
    } finally {
      setEditSaving(false)
    }
  }

  // Confirmer une réservation
  const handleConfirmPayment = async (bookingId) => {
    try {
      await confirmBooking(bookingId)
      setMyBK(bk => bk.map(b => (b._id || b.id) === bookingId ? { ...b, status: 'confirmed' } : b))
      showNotif('💰 Paiement confirmé — réservation activée !')
    } catch (err) {
      showNotif('❌ Erreur : ' + (err.response?.data?.message || err.message))
    }
  }

  const handleConfirm = async (bookingId) => {
    try {
      await confirmBooking(bookingId)
      setMyBK(bk => bk.map(b => (b._id || b.id) === bookingId ? { ...b, status: 'confirmed' } : b))
      showNotif('✅ Réservation confirmée — le locataire a été notifié !')
    } catch (err) {
      showNotif('❌ Erreur : ' + (err.response?.data?.message || err.message))
    }
  }

  // Refuser une réservation
  const handleCancel = async (bookingId) => {
    try {
      await cancelBooking(bookingId)
      setMyBK(bk => bk.map(b => (b._id || b.id) === bookingId ? { ...b, status: 'cancelled' } : b))
      showNotif('❌ Réservation refusée.')
    } catch (err) {
      showNotif('❌ Erreur : ' + (err.response?.data?.message || err.message))
    }
  }

  const reloadCars = async () => {
    const res = await getMyCars().catch(() => ({ data: [] }))
    setMyCars(res.data)
  }

  const resetForm = () => {
    setForm({ brand:'', model:'', year:'', city:'Cotonou', type:'Berline', fuel:'Essence', transmission:'Manuelle', seats:'5', price:'', deposit:'', description:'', photos: null })
    setFormErrors({})
    setAddSuccess(false)
  }

  // ── Styles communs ──
  const card = { background: '#fff', borderRadius: 16, border: '1px solid #d5e8da', padding: '1.5rem' }
  const inp  = (err) => ({ width: '100%', padding: '10px 12px', border: `1.5px solid ${err ? '#e74c3c' : '#d5e8da'}`, borderRadius: 10, fontSize: '0.92rem', outline: 'none', boxSizing: 'border-box', fontFamily: "'DM Sans', sans-serif" })
  const lbl  = { display: 'block', fontSize: '0.7rem', fontWeight: 700, color: '#5a7a62', textTransform: 'uppercase', letterSpacing: '0.07em', marginBottom: 5 }
  const sel  = (err) => ({ ...inp(err), cursor: 'pointer', background: '#fff' })

  return (
    <div style={{ fontFamily: "'DM Sans', sans-serif", background: '#f7faf8', minHeight: '100vh', paddingTop: 68 }}>

      {/* ── HEADER DASHBOARD ── */}
      <div style={{ background: '#0d1f13', padding: '2.5rem 5%', borderBottom: '1px solid rgba(212,160,23,0.15)' }}>
        <div style={{ maxWidth: 1200, margin: '0 auto', display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 16 }}>
          <div>
            <div style={{ color: '#d4a017', fontSize: '0.75rem', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.1em', marginBottom: 6 }}>
              Espace propriétaire
            </div>
            <h1 style={{ fontFamily: "'Playfair Display', serif", fontSize: '2rem', fontWeight: 900, color: '#fff', margin: 0 }}>
              Bonjour, {OWNER.name.split(' ')[0]} 👋
            </h1>
            <div style={{ color: 'rgba(255,255,255,0.5)', fontSize: '0.85rem', marginTop: 4 }}>
              📍 {OWNER.city} · ⭐ {OWNER.rating}/5 · {OWNER.verified ? '✓ Compte vérifié' : 'Non vérifié'}
            </div>
          </div>
          {pendingCount > 0 && (
            <div style={{ background: 'rgba(212,160,23,0.15)', border: '1px solid rgba(212,160,23,0.4)', borderRadius: 12, padding: '12px 20px', cursor: 'pointer' }}
              onClick={() => { setTab(2); setBookingFilter('pending') }}>
              <div style={{ color: '#d4a017', fontWeight: 700, fontSize: '1.3rem' }}>{pendingCount}</div>
              <div style={{ color: 'rgba(255,255,255,0.6)', fontSize: '0.78rem' }}>réservation{pendingCount > 1 ? 's' : ''} en attente</div>
            </div>
          )}
        </div>
      </div>

      {/* ── TABS ── */}
      <div style={{ background: '#fff', borderBottom: '1px solid #d5e8da', overflowX: 'auto', WebkitOverflowScrolling: 'touch', scrollbarWidth: 'none' }}>
        <div style={{ maxWidth: 1200, margin: '0 auto', display: 'flex', gap: 0, minWidth: 'max-content', padding: '0 5%' }}>
          {TABS.map((t, i) => (
            <button key={i} onClick={() => setTab(i)} style={{
              background: 'none', border: 'none', cursor: 'pointer',
              padding: '1rem 1.4rem', fontFamily: "'DM Sans', sans-serif",
              fontSize: '0.9rem', fontWeight: tab === i ? 700 : 500,
              color: tab === i ? '#1a6b3c' : '#5a7a62',
              borderBottom: tab === i ? '2.5px solid #1a6b3c' : '2.5px solid transparent',
              whiteSpace: 'nowrap', transition: 'all 0.2s',
            }}>
              {i === 3 ? '＋ ' : ''}{t}
              {i === 2 && pendingCount > 0 && (
                <span style={{ marginLeft: 6, background: '#d4a017', color: '#0d1f13', borderRadius: 50, padding: '1px 7px', fontSize: '0.7rem', fontWeight: 700 }}>
                  {pendingCount}
                </span>
              )}
            </button>
          ))}
        </div>
      </div>

      <div style={{ maxWidth: 1200, margin: '0 auto', padding: '2.5rem 5%' }}>

        {/* ══════════════════════════════
            TAB 0 — VUE D'ENSEMBLE
        ══════════════════════════════ */}
        {tab === 0 && (
          <div>
            {/* Stats cards */}
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '1.5rem', marginBottom: '2.5rem' }}>
              {[
                { icon: '💰', label: 'Revenus totaux',       value: fmt(totalEarnings), color: '#1a6b3c' },
                { icon: '🚗', label: 'Voitures publiées',    value: MY_CARS.length,     color: '#1a6b3c' },
                { icon: '📋', label: 'Locations effectuées', value: totalTrips,         color: '#1a6b3c' },
                { icon: '⏳', label: 'En attente',           value: pendingCount,       color: '#d4a017' },
              ].map(s => (
                <div key={s.label} style={{ ...card, textAlign: 'center' }}>
                  <div style={{ fontSize: '2rem', marginBottom: 8 }}>{s.icon}</div>
                  <div style={{ fontFamily: "'Playfair Display', serif", fontSize: '1.7rem', fontWeight: 900, color: s.color }}>{s.value}</div>
                  <div style={{ fontSize: '0.8rem', color: '#5a7a62', marginTop: 4 }}>{s.label}</div>
                </div>
              ))}
            </div>

            {/* Réservations récentes */}
            <div style={card}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem' }}>
                <h3 style={{ fontFamily: "'Playfair Display', serif", fontSize: '1.2rem', fontWeight: 700 }}>Dernières réservations</h3>
                <button onClick={() => setTab(2)} style={{ background: 'none', border: 'none', color: '#1a6b3c', fontWeight: 700, cursor: 'pointer', fontSize: '0.85rem' }}>Tout voir →</button>
              </div>
              {BOOKINGS.slice(0, 3).map(b => <BookingRow key={b._id || b.id} b={b} />)}
            </div>
          </div>
        )}

        {/* ══════════════════════════════
            TAB 1 — MES VOITURES
        ══════════════════════════════ */}
        {tab === 1 && (
          <div>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem' }}>
              <h2 style={{ fontFamily: "'Playfair Display', serif", fontSize: '1.5rem', fontWeight: 900 }}>Mes véhicules</h2>
              <button onClick={() => setTab(3)} style={{ background: '#1a6b3c', color: '#fff', border: 'none', borderRadius: 50, padding: '10px 20px', fontWeight: 700, cursor: 'pointer', fontSize: '0.88rem' }}>
                ＋ Ajouter une voiture
              </button>
            </div>
            {MY_CARS.length === 0 ? (
              <div style={{ background: '#fff', border: '1px solid #d5e8da', borderRadius: 16, padding: '3rem', textAlign: 'center' }}>
                <div style={{ fontSize: '2.5rem', marginBottom: 12 }}>🚗</div>
                <p style={{ color: '#5a7a62', marginBottom: 16 }}>Tu n'as pas encore ajouté de voiture.</p>
                <button onClick={() => setTab(3)} style={{ background: '#1a6b3c', color: '#fff', border: 'none', borderRadius: 50, padding: '10px 24px', fontWeight: 700, cursor: 'pointer' }}>
                  ＋ Ajouter ma première voiture
                </button>
              </div>
            ) : (
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(320px, 1fr))', gap: '1.5rem' }}>
              {MY_CARS.map(car => (
                <div key={car._id || car.id} style={card}>
                  <div style={{ display: 'flex', gap: '1rem', alignItems: 'center', marginBottom: '1rem' }}>
                    <div style={{ width: 64, height: 64, borderRadius: 12, background: 'linear-gradient(135deg, #1a3d25, #040e07)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '2rem' }}>
                      {car.emoji}
                    </div>
                    <div style={{ flex: 1 }}>
                      <div style={{ fontWeight: 700, fontSize: '1rem', color: '#0d1f13' }}>{car.brand} {car.model}</div>
                      <div style={{ fontSize: '0.78rem', color: '#5a7a62' }}>📍 {car.city} · {car.type} · {car.transmission}</div>
                    </div>
                    <div style={{ background: car.available ? '#e8f5ee' : '#fdecea', color: car.available ? '#1a6b3c' : '#c0392b', border: `1px solid ${car.available ? '#2d9a5a' : '#e74c3c'}`, borderRadius: 50, padding: '3px 10px', fontSize: '0.72rem', fontWeight: 700 }}>
                      {car.available ? '✓ Dispo' : '✗ Indispo'}
                    </div>
                  </div>
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 8, background: '#f7faf8', borderRadius: 10, padding: '12px', marginBottom: '1rem' }}>
                    <div style={{ textAlign: 'center' }}>
                      <div style={{ fontWeight: 700, color: '#1a6b3c', fontSize: '0.95rem' }}>{fmt(car.price)}</div>
                      <div style={{ fontSize: '0.68rem', color: '#5a7a62' }}>par jour</div>
                    </div>
                    <div style={{ textAlign: 'center', borderLeft: '1px solid #d5e8da', borderRight: '1px solid #d5e8da' }}>
                      <div style={{ fontWeight: 700, color: '#0d1f13', fontSize: '0.95rem' }}>{car.trips}</div>
                      <div style={{ fontSize: '0.68rem', color: '#5a7a62' }}>locations</div>
                    </div>
                    <div style={{ textAlign: 'center' }}>
                      <div style={{ fontWeight: 700, color: '#d4a017', fontSize: '0.95rem' }}>{fmt(car.earnings)}</div>
                      <div style={{ fontSize: '0.68rem', color: '#5a7a62' }}>revenus</div>
                    </div>
                  </div>
                  <div style={{ display: 'flex', gap: 8 }}>
                    <button onClick={() => openEdit(car)} style={{ flex: 1, padding: '8px', border: '1.5px solid #d5e8da', borderRadius: 10, background: '#fff', color: '#1a2e1e', fontWeight: 600, fontSize: '0.82rem', cursor: 'pointer' }}>
                      ✏️ Modifier
                    </button>
                    <button
                      onClick={() => toggleAvailability(car)}
                      disabled={toggling === (car._id || car.id)}
                      style={{ flex: 1, padding: '8px', border: 'none', borderRadius: 10, background: (car.isAvailable !== undefined ? car.isAvailable : car.available) ? '#fdecea' : '#e8f5ee', color: (car.isAvailable !== undefined ? car.isAvailable : car.available) ? '#c0392b' : '#1a6b3c', fontWeight: 600, fontSize: '0.82rem', cursor: 'pointer', opacity: toggling === (car._id || car.id) ? 0.6 : 1 }}>
                      {toggling === (car._id || car.id) ? '⏳' : (car.isAvailable !== undefined ? car.isAvailable : car.available) ? '⏸ Désactiver' : '▶ Activer'}
                    </button>
                  </div>
                </div>
              ))}
            </div>
            )}
          </div>
        )}

        {/* ══════════════════════════════
            TAB 2 — RÉSERVATIONS
        ══════════════════════════════ */}
        {tab === 2 && (
          <div>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem', flexWrap: 'wrap', gap: 12 }}>
              <h2 style={{ fontFamily: "'Playfair Display', serif", fontSize: '1.5rem', fontWeight: 900 }}>Réservations</h2>
              <div style={{ display: 'flex', gap: 8 }}>
                {[['all','Toutes'],['pending','En attente'],['confirmed','Confirmées'],['completed','Terminées']].map(([v, l]) => (
                  <button key={v} onClick={() => setBookingFilter(v)} style={{
                    padding: '7px 14px', borderRadius: 50, border: '1.5px solid',
                    borderColor: bookingFilter === v ? '#1a6b3c' : '#d5e8da',
                    background: bookingFilter === v ? '#1a6b3c' : '#fff',
                    color: bookingFilter === v ? '#fff' : '#5a7a62',
                    fontWeight: 600, fontSize: '0.8rem', cursor: 'pointer',
                  }}>{l}</button>
                ))}
              </div>
            </div>
            <div style={{ ...card, padding: 0, overflow: 'hidden' }}>
              {filteredBK.length === 0 ? (
                <div style={{ padding: '3rem', textAlign: 'center', color: '#5a7a62' }}>Aucune réservation dans cette catégorie.</div>
              ) : (
                filteredBK.map((b, i) => (
                  <div key={b._id || b.id || i} style={{ padding: '1.4rem 1.8rem', borderBottom: i < filteredBK.length - 1 ? '1px solid #d5e8da' : 'none' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: 12 }}>
                      <div style={{ flex: 1 }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 6 }}>
                          <span style={{ fontWeight: 700, fontSize: '0.95rem', color: '#0d1f13' }}>{b.renter?.name || (typeof b.renter === 'string' ? b.renter : '—')}</span>
                          <span style={{ fontSize: '0.72rem', color: '#5a7a62', background: '#f7faf8', border: '1px solid #d5e8da', borderRadius: 50, padding: '2px 8px' }}>{b.id}</span>
                          <span style={{ fontSize: '0.72rem', fontWeight: 700, padding: '3px 10px', borderRadius: 50, background: STATUS[b.status].bg, color: STATUS[b.status].color, border: `1px solid ${STATUS[b.status].border}` }}>
                            {STATUS[b.status].label}
                          </span>
                        </div>
                        <div style={{ fontSize: '0.82rem', color: '#5a7a62', marginBottom: 4 }}>🚗 {b.car?.brand ? b.car.brand + ' ' + b.car.model : (typeof b.car === 'string' ? b.car : 'Véhicule')}</div>
                        <div style={{ fontSize: '0.82rem', color: '#5a7a62' }}>
                          📅 {b.startDate ? new Date(b.startDate).toLocaleDateString('fr-FR') : '—'} → {b.endDate ? new Date(b.endDate).toLocaleDateString('fr-FR') : '—'}
                          &nbsp;·&nbsp;📱 {b.renter?.phone || b.phone || ''}
                        </div>
                      </div>
                      <div style={{ textAlign: 'right' }}>
                        <div style={{ fontFamily: "'Playfair Display', serif", fontWeight: 700, fontSize: '1.1rem', color: '#1a6b3c' }}>{fmt(b.totalPrice || b.total || 0)}</div>
                        <div style={{ fontSize: '0.75rem', color: '#5a7a62' }}>Caution : {fmt(b.depositAmount || b.deposit || 0)}</div>
                        {b.status === 'pending' && (
                          <div style={{ display: 'flex', gap: 6, marginTop: 10, justifyContent: 'flex-end' }}>
                            <button onClick={() => handleConfirm(b._id || b.id)} style={{ padding: '6px 14px', background: '#1a6b3c', color: '#fff', border: 'none', borderRadius: 8, fontWeight: 700, fontSize: '0.8rem', cursor: 'pointer' }}>✓ Accepter</button>
                            <button onClick={() => handleCancel(b._id || b.id)} style={{ padding: '6px 14px', background: '#fdecea', color: '#c0392b', border: '1px solid #e74c3c', borderRadius: 8, fontWeight: 600, fontSize: '0.8rem', cursor: 'pointer' }}>✕ Refuser</button>
                            <button onClick={() => downloadContract(b._id || b.id)} style={{ padding: '6px 14px', background: '#e8f5ee', color: '#1a6b3c', border: '1px solid #2d9a5a', borderRadius: 8, fontWeight: 700, fontSize: '0.8rem', cursor: 'pointer' }}>📄 PDF</button>
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>
        )}

        {/* ══════════════════════════════
            TAB 3 — AJOUTER UNE VOITURE
        ══════════════════════════════ */}
        {tab === 3 && (
          <div style={{ maxWidth: 700 }}>
            <h2 style={{ fontFamily: "'Playfair Display', serif", fontSize: '1.5rem', fontWeight: 900, marginBottom: '0.3rem' }}>Ajouter une voiture</h2>
            <p style={{ color: '#5a7a62', fontSize: '0.88rem', marginBottom: '2rem' }}>Ton véhicule sera vérifié par notre équipe avant publication (sous 24h).</p>

            {addSuccess ? (
              <div style={{ ...card, textAlign: 'center', padding: '3rem' }}>
                <div style={{ fontSize: '3.5rem', marginBottom: 16 }}>🎉</div>
                <h3 style={{ fontFamily: "'Playfair Display', serif", fontSize: '1.6rem', fontWeight: 900, marginBottom: 8 }}>Voiture soumise !</h3>
                <p style={{ color: '#5a7a62', marginBottom: 24 }}>Notre équipe va vérifier ta carte grise et les photos. Tu recevras une confirmation par SMS sous 24h.</p>
                <button onClick={resetForm} style={{ background: '#1a6b3c', color: '#fff', border: 'none', borderRadius: 50, padding: '12px 28px', fontWeight: 700, cursor: 'pointer' }}>
                  ＋ Ajouter une autre voiture
                </button>
              </div>
            ) : (
              <div style={card}>
                {/* Marque & Modèle */}
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16, marginBottom: 16 }}>
                  <div>
                    <label style={lbl}>Marque *</label>
                    <input value={form.brand} onChange={e => handleFormChange('brand', e.target.value)} placeholder="Toyota" style={inp(formErrors.brand)} />
                    {formErrors.brand && <div style={{ color: '#e74c3c', fontSize: '0.75rem', marginTop: 3 }}>{formErrors.brand}</div>}
                  </div>
                  <div>
                    <label style={lbl}>Modèle *</label>
                    <input value={form.model} onChange={e => handleFormChange('model', e.target.value)} placeholder="Corolla 2020" style={inp(formErrors.model)} />
                    {formErrors.model && <div style={{ color: '#e74c3c', fontSize: '0.75rem', marginTop: 3 }}>{formErrors.model}</div>}
                  </div>
                </div>

                {/* Année & Ville */}
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16, marginBottom: 16 }}>
                  <div>
                    <label style={lbl}>Année *</label>
                    <input type="number" value={form.year} onChange={e => handleFormChange('year', e.target.value)} placeholder="2020" style={inp(formErrors.year)} />
                    {formErrors.year && <div style={{ color: '#e74c3c', fontSize: '0.75rem', marginTop: 3 }}>{formErrors.year}</div>}
                  </div>
                  <div>
                    <label style={lbl}>Ville</label>
                    <select value={form.city} onChange={e => handleFormChange('city', e.target.value)} style={sel()}>
                      {['Cotonou','Porto-Novo','Parakou','Abomey-Calavi','Bohicon','Natitingou'].map(c => <option key={c}>{c}</option>)}
                    </select>
                  </div>
                </div>

                {/* Type & Carburant & Boîte */}
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 16, marginBottom: 16 }}>
                  <div>
                    <label style={lbl}>Type</label>
                    <select value={form.type} onChange={e => handleFormChange('type', e.target.value)} style={sel()}>
                      {['Berline','SUV','4x4','Minibus'].map(t => <option key={t}>{t}</option>)}
                    </select>
                  </div>
                  <div>
                    <label style={lbl}>Carburant</label>
                    <select value={form.fuel} onChange={e => handleFormChange('fuel', e.target.value)} style={sel()}>
                      {['Essence','Diesel'].map(f => <option key={f}>{f}</option>)}
                    </select>
                  </div>
                  <div>
                    <label style={lbl}>Boîte de vitesse</label>
                    <select value={form.transmission} onChange={e => handleFormChange('transmission', e.target.value)} style={sel()}>
                      {['Manuelle','Automatique'].map(t => <option key={t}>{t}</option>)}
                    </select>
                  </div>
                </div>

                {/* Sièges */}
                <div style={{ marginBottom: 16 }}>
                  <label style={lbl}>Nombre de places</label>
                  <select value={form.seats} onChange={e => handleFormChange('seats', e.target.value)} style={{ ...sel(), maxWidth: 160 }}>
                    {['2','4','5','7','8','9','14'].map(s => <option key={s}>{s}</option>)}
                  </select>
                </div>

                {/* Prix & Caution */}
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16, marginBottom: 16 }}>
                  <div>
                    <label style={lbl}>Prix par jour (FCFA) *</label>
                    <input type="number" value={form.price} onChange={e => handleFormChange('price', e.target.value)} placeholder="25000" style={inp(formErrors.price)} />
                    {formErrors.price && <div style={{ color: '#e74c3c', fontSize: '0.75rem', marginTop: 3 }}>{formErrors.price}</div>}
                  </div>
                  <div>
                    <label style={lbl}>Caution (FCFA) <span style={{ color: '#5a7a62', fontWeight: 400 }}>(0 = sans caution)</span></label>
                    <input type="number" value={form.deposit} onChange={e => handleFormChange('deposit', e.target.value)} placeholder="0" style={inp(false)} />
                    {formErrors.deposit && <div style={{ color: '#e74c3c', fontSize: '0.75rem', marginTop: 3 }}>{formErrors.deposit}</div>}
                  </div>
                </div>

                {/* Description */}
                <div style={{ marginBottom: 16 }}>
                  <label style={lbl}>Description (optionnel)</label>
                  <textarea value={form.description} onChange={e => handleFormChange('description', e.target.value)}
                    placeholder="Voiture en excellent état, climatisée, idéale pour les longs trajets..."
                    rows={3}
                    style={{ ...inp(false), resize: 'vertical', fontFamily: "'DM Sans', sans-serif" }} />
                </div>

                {/* Upload documents */}
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16, marginBottom: 16 }}>
                  <div>
                    <label style={lbl}>📄 Carte grise *</label>
                    <input type="file" accept="image/*,application/pdf" style={{ ...inp(false), padding: '8px 12px', fontSize: '0.82rem' }} />
                  </div>
                  <div>
                    <label style={lbl}>📸 Photos du véhicule * <span style={{ color: '#1a6b3c', fontWeight: 700 }}>(max 10)</span></label>
                    <input type="file" accept="image/*" multiple onChange={e => handleFormChange('photos', e.target.files)} style={{ ...inp(false), padding: '8px 12px', fontSize: '0.82rem' }} />
                  </div>
                </div>

                {/* Conseils photos */}
                <div style={{ background: '#f7faf8', border: '1px solid #d5e8da', borderRadius: 12, padding: '1rem', marginBottom: 16 }}>
                  <div style={{ fontWeight: 700, fontSize: '0.82rem', color: '#0d1f13', marginBottom: 8 }}>📷 Conseils pour de bonnes photos</div>
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 6 }}>
                    {[['✓ Vue avant',"L'avant de la voiture"],['✓ Vue arrière',"L'arrière"],['✓ Vue côté gauche','Profil gauche'],['✓ Vue côté droit','Profil droit'],['✓ Intérieur','Tableau de bord'],['✓ Coffre','Espace de rangement']].map(([t,d]) => (
                      <div key={t} style={{ fontSize: '0.78rem', color: '#5a7a62' }}>
                        <span style={{ color: '#1a6b3c', fontWeight: 700 }}>{t}</span> — {d}
                      </div>
                    ))}
                  </div>
                  <div style={{ fontSize: '0.75rem', color: '#5a7a62', marginTop: 8 }}>
                    💡 Les annonces avec 4+ photos reçoivent <strong style={{ color: '#1a6b3c' }}>3x plus de réservations</strong>
                  </div>
                </div>

                {/* Info vérification */}
                {formErrors.submit && (
                  <div style={{ background: '#fdecea', border: '1px solid #e74c3c', borderRadius: 10, padding: '12px', color: '#c0392b', fontSize: '0.85rem', marginBottom: '1rem' }}>
                    ⚠️ {formErrors.submit}
                  </div>
                )}
                <div style={{ background: '#e8f5ee', border: '1px solid #1a6b3c', borderRadius: 10, padding: '12px 14px', fontSize: '0.82rem', color: '#1a6b3c', marginBottom: '1.5rem' }}>
                  🛡 Ton véhicule sera vérifié avant publication : carte grise, photos et numéro de châssis. Cette étape protège les deux parties.
                </div>

                <button onClick={handleSubmit} disabled={saving} style={{
                  width: '100%', background: saving ? '#aaa' : '#1a6b3c',
                  color: '#fff', border: 'none', borderRadius: 12,
                  padding: '14px', fontWeight: 700, fontSize: '1rem',
                  cursor: saving ? 'not-allowed' : 'pointer',
                  fontFamily: "'DM Sans', sans-serif"
                }}>
                  {saving ? '⏳ Soumission en cours...' : '✅ Soumettre pour vérification'}
                </button>
              </div>
            )}
          </div>
        )}

      {/* ── NOTIFICATION FLASH ── */}
      {notif && (
        <div style={{ position: 'fixed', top: 80, right: 24, background: '#0d1f13', color: '#fff', padding: '12px 20px', borderRadius: 12, zIndex: 9999, fontWeight: 600, fontSize: '0.9rem', boxShadow: '0 8px 30px rgba(0,0,0,0.3)' }}>
          {notif}
        </div>
      )}

      {/* ── MODAL MODIFICATION VOITURE ── */}
      {editCar && (
        <EditCarModal
          car={editCar}
          form={editForm}
          setForm={setEditForm}
          onSave={saveEdit}
          onClose={() => setEditCar(null)}
          saving={editSaving}
        />
      )}
      </div>
    </div>
  )
}

// ── MODAL MODIFICATION VOITURE ──
function EditCarModal({ car, form, setForm, onSave, onClose, saving }) {
  const inp  = (err) => ({ width: '100%', padding: '10px 12px', border: `1.5px solid ${err ? '#e74c3c' : '#d5e8da'}`, borderRadius: 10, fontSize: '0.92rem', outline: 'none', boxSizing: 'border-box', fontFamily: "'DM Sans', sans-serif" })
  const lbl  = { display: 'block', fontSize: '0.7rem', fontWeight: 700, color: '#5a7a62', textTransform: 'uppercase', letterSpacing: '0.07em', marginBottom: 5 }

  return (
    <div onClick={onClose} style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.65)', zIndex: 1000, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '1rem' }}>
      <div onClick={e => e.stopPropagation()} style={{ background: '#fff', borderRadius: 24, padding: '2.5rem', maxWidth: 560, width: '100%', maxHeight: '90vh', overflowY: 'auto' }}>
        <h3 style={{ fontFamily: "'Playfair Display', serif", fontSize: '1.5rem', fontWeight: 900, marginBottom: '0.3rem' }}>Modifier la voiture</h3>
        <p style={{ color: '#5a7a62', fontSize: '0.85rem', marginBottom: '1.5rem' }}>{car.brand} {car.model}</p>

        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 14, marginBottom: 14 }}>
          <div><label style={lbl}>Marque</label><input value={form.brand} onChange={e => setForm(f=>({...f,brand:e.target.value}))} style={inp()} /></div>
          <div><label style={lbl}>Modèle</label><input value={form.model} onChange={e => setForm(f=>({...f,model:e.target.value}))} style={inp()} /></div>
        </div>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 14, marginBottom: 14 }}>
          <div><label style={lbl}>Année</label><input type="number" value={form.year} onChange={e => setForm(f=>({...f,year:e.target.value}))} style={inp()} /></div>
          <div><label style={lbl}>Ville</label>
            <select value={form.city} onChange={e => setForm(f=>({...f,city:e.target.value}))} style={{...inp(), cursor:'pointer'}}>
              {['Cotonou','Porto-Novo','Parakou','Abomey-Calavi','Bohicon','Natitingou'].map(c=><option key={c}>{c}</option>)}
            </select>
          </div>
        </div>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 14, marginBottom: 14 }}>
          <div><label style={lbl}>Type</label>
            <select value={form.type} onChange={e => setForm(f=>({...f,type:e.target.value}))} style={{...inp(),cursor:'pointer'}}>
              {['Berline','SUV','4x4','Minibus'].map(t=><option key={t}>{t}</option>)}
            </select>
          </div>
          <div><label style={lbl}>Carburant</label>
            <select value={form.fuel} onChange={e => setForm(f=>({...f,fuel:e.target.value}))} style={{...inp(),cursor:'pointer'}}>
              {['Essence','Diesel'].map(f=><option key={f}>{f}</option>)}
            </select>
          </div>
          <div><label style={lbl}>Boîte</label>
            <select value={form.transmission} onChange={e => setForm(f=>({...f,transmission:e.target.value}))} style={{...inp(),cursor:'pointer'}}>
              {['Manuelle','Automatique'].map(t=><option key={t}>{t}</option>)}
            </select>
          </div>
        </div>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 14, marginBottom: 14 }}>
          <div><label style={lbl}>Prix / jour (FCFA)</label><input type="number" value={form.price} onChange={e => setForm(f=>({...f,price:e.target.value}))} style={inp()} /></div>
          <div><label style={lbl}>Caution (FCFA) <span style={{ fontWeight:400, color:'#5a7a62' }}>(0 = sans caution)</span></label><input type="number" value={form.deposit} onChange={e => setForm(f=>({...f,deposit:e.target.value}))} placeholder="0" style={inp()} /></div>
        </div>
        <div style={{ marginBottom: 14 }}>
          <label style={lbl}>Description</label>
          <textarea value={form.description} onChange={e => setForm(f=>({...f,description:e.target.value}))} rows={3} style={{...inp(), resize:'vertical'}} />
        </div>
        <div style={{ marginBottom: 20 }}>
          <label style={lbl}>📸 Nouvelles photos (remplace les anciennes)</label>
          <input type="file" accept="image/*" multiple onChange={e => setForm(f=>({...f,photos:e.target.files}))} style={{...inp(), padding:'8px 12px', fontSize:'0.82rem', cursor:'pointer'}} />
          <div style={{ fontSize: '0.75rem', color: '#5a7a62', marginTop: 4 }}>Laisse vide pour garder les photos actuelles</div>
        </div>
        <div style={{ display: 'flex', gap: 10 }}>
          <button onClick={onClose} style={{ flex: 1, background: '#f7faf8', border: '1.5px solid #d5e8da', borderRadius: 12, padding: '12px', fontWeight: 600, cursor: 'pointer', color: '#5a7a62', fontFamily: "'DM Sans', sans-serif" }}>Annuler</button>
          <button onClick={onSave} disabled={saving} style={{ flex: 2, background: saving ? '#aaa' : '#1a6b3c', color: '#fff', border: 'none', borderRadius: 12, padding: '12px', fontWeight: 700, cursor: saving ? 'not-allowed' : 'pointer', fontFamily: "'DM Sans', sans-serif" }}>
            {saving ? '⏳ Sauvegarde...' : '✅ Enregistrer les modifications'}
          </button>
        </div>
      </div>
    </div>
  )
}

function BookingRow({ b }) {
  return (
    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '1rem 0', borderBottom: '1px solid #f0f0f0', flexWrap: 'wrap', gap: 8 }}>
      <div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 3 }}>
          <span style={{ fontWeight: 700, fontSize: '0.92rem' }}>{b.renter?.name || (typeof b.renter === 'string' ? b.renter : '—')}</span>
          <span style={{ fontSize: '0.7rem', fontWeight: 700, padding: '2px 8px', borderRadius: 50, background: STATUS[b.status].bg, color: STATUS[b.status].color, border: `1px solid ${STATUS[b.status].border}` }}>
            {STATUS[b.status].label}
          </span>
        </div>
        <div style={{ fontSize: '0.8rem', color: '#5a7a62' }}>🚗 {b.car?.brand ? b.car.brand + ' ' + b.car.model : (typeof b.car === 'string' ? b.car : 'Véhicule')} · 📅 {b.start} → {b.end}</div>
      </div>
      <div style={{ fontFamily: "'Playfair Display', serif", fontWeight: 700, color: '#1a6b3c', fontSize: '1rem' }}>
        {new Intl.NumberFormat('fr-FR').format(b.total)} FCFA
      </div>
    </div>
  )
}
