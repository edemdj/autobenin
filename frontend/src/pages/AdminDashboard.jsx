import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import api from '../services/api'

const fmt     = (n) => new Intl.NumberFormat('fr-FR').format(n) + ' FCFA'
const fmtDate = (d) => d ? new Date(d).toLocaleDateString('fr-FR') : '—'

const STATUS = {
  pending:   { label: 'En attente',  bg: '#fef9e7', color: '#b8860b' },
  confirmed: { label: 'Confirmée',   bg: '#e8f5ee', color: '#1a6b3c' },
  completed: { label: 'Terminée',    bg: '#f0f0f0', color: '#555'    },
  cancelled: { label: 'Annulée',     bg: '#fdecea', color: '#c0392b' },
}

const TABS = ['Vue d\'ensemble', 'Utilisateurs', 'Voitures', 'Réservations', 'Litiges']

export default function AdminDashboard() {
  const { user }   = useAuth()
  const navigate   = useNavigate()

  const [tab,      setTab]      = useState(0)
  const [stats,    setStats]    = useState(null)
  const [users,    setUsers]    = useState([])
  const [cars,     setCars]     = useState([])
  const [bookings, setBookings] = useState([])
  const [disputes, setDisputes] = useState([])
  const [loading,  setLoading]  = useState(true)
  const [search,   setSearch]   = useState('')
  const [filter,   setFilter]   = useState('all')
  const [msg,      setMsg]      = useState('')

  useEffect(() => {
    if (user && user.role !== 'admin') navigate('/')
  }, [user])

  useEffect(() => {
    if (!user || user.role !== 'admin') return
    loadData()
  }, [user])

  const loadData = async () => {
    setLoading(true)
    try {
      const [statsRes, usersRes, carsRes, bkRes, dispRes] = await Promise.all([
        api.get('/admin/stats'),
        api.get('/admin/users'),
        api.get('/admin/cars'),
        api.get('/admin/bookings'),
        api.get('/admin/disputes'),
      ])
      setStats(statsRes.data)
      setUsers(usersRes.data)
      setCars(carsRes.data)
      setBookings(bkRes.data)
      setDisputes(dispRes.data)
    } catch (err) {
      console.error('Admin API error:', err.response?.status, err.response?.data || err.message)
    } finally {
      setLoading(false)
    }
  }

  const showMsg = (text) => { setMsg(text); setTimeout(() => setMsg(''), 3000) }

  const verifyUser = async (id) => {
    await api.put(`/admin/users/${id}/verify`)
    setUsers(u => u.map(x => x._id === id ? { ...x, isVerified: true } : x))
    showMsg('✅ Utilisateur vérifié')
  }

  const suspendUser = async (id) => {
    await api.put(`/admin/users/${id}/suspend`)
    setUsers(u => u.map(x => x._id === id ? { ...x, isSuspended: true } : x))
    showMsg('⛔ Utilisateur suspendu')
  }

  const verifyCar = async (id) => {
    await api.put(`/admin/cars/${id}/verify`)
    setCars(c => c.map(x => x._id === id ? { ...x, isVerified: true, isAvailable: true } : x))
    if (stats) setStats(s => ({ ...s, pendingCars: s.pendingCars - 1 }))
    showMsg('✅ Voiture approuvée et publiée')
  }

  const resolveDispute = async (id, resolution) => {
    await api.put(`/admin/disputes/${id}/resolve`, { resolution })
    setDisputes(d => d.map(x => x._id === id ? { ...x, status: 'resolved', resolution } : x))
    showMsg('✅ Litige résolu')
  }

  const rejectDispute = async (id, resolution) => {
    await api.put(`/admin/disputes/${id}/reject`, { resolution })
    setDisputes(d => d.map(x => x._id === id ? { ...x, status: 'rejected', resolution } : x))
    showMsg('❌ Litige rejeté')
  }

  const reviewDispute = async (id) => {
    await api.put(`/admin/disputes/${id}/review`)
    setDisputes(d => d.map(x => x._id === id ? { ...x, status: 'in_review' } : x))
    showMsg('🔍 Litige en révision')
  }

  const rejectCar = async (id) => {
    await api.put(`/admin/cars/${id}/reject`)
    setCars(c => c.map(x => x._id === id ? { ...x, isVerified: false } : x))
    showMsg('❌ Voiture rejetée')
  }

  const card = { background: '#fff', borderRadius: 16, border: '1px solid #d5e8da', padding: '1.5rem' }

  const filteredUsers = users.filter(u => {
    const matchSearch = !search || u.name?.toLowerCase().includes(search.toLowerCase()) || u.email?.toLowerCase().includes(search.toLowerCase())
    const matchFilter = filter === 'all' || u.role === filter
    return matchSearch && matchFilter
  })

  const filteredCars = cars.filter(c => {
    if (filter === 'pending') return !c.isVerified
    if (filter === 'verified') return c.isVerified
    return true
  })

  const filteredBookings = bookings.filter(b => {
    if (filter !== 'all' && filter !== 'pending' && filter !== 'verified') return b.status === filter
    return true
  })

  if (!user || user.role !== 'admin') return null

  return (
    <div style={{ fontFamily: "'DM Sans', sans-serif", background: '#f7faf8', minHeight: '100vh', paddingTop: 68 }}>

      {/* Notification flash */}
      {msg && (
        <div style={{ position: 'fixed', top: 80, right: 24, background: '#0d1f13', color: '#fff', padding: '12px 20px', borderRadius: 12, zIndex: 9999, fontWeight: 600, fontSize: '0.9rem', boxShadow: '0 8px 30px rgba(0,0,0,0.3)' }}>
          {msg}
        </div>
      )}

      {/* Header */}
      <div style={{ background: '#0d1f13', padding: '2rem 5%', borderBottom: '1px solid rgba(212,160,23,0.15)' }}>
        <div style={{ maxWidth: 1300, margin: '0 auto', display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 16 }}>
          <div>
            <div style={{ color: '#d4a017', fontSize: '0.75rem', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.1em', marginBottom: 6 }}>
              🛡 Administration
            </div>
            <h1 style={{ fontFamily: "'Playfair Display', serif", fontSize: '2rem', fontWeight: 900, color: '#fff', margin: 0 }}>
              Dashboard Admin
            </h1>
          </div>
          {stats && (
            <div style={{ display: 'flex', gap: '2rem' }}>
              {[
                ['👥', stats.users,          'Utilisateurs'],
                ['🚗', stats.cars,           'Voitures'],
                ['📋', stats.bookings,       'Réservations'],
                ['⏳', stats.pendingCars,    'En attente'],
              ].map(([icon, val, lbl]) => (
                <div key={lbl} style={{ textAlign: 'center' }}>
                  <div style={{ fontFamily: "'Playfair Display', serif", fontSize: '1.6rem', fontWeight: 900, color: '#d4a017' }}>{val}</div>
                  <div style={{ fontSize: '0.68rem', color: 'rgba(255,255,255,0.45)', textTransform: 'uppercase', letterSpacing: '0.06em' }}>{lbl}</div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Tabs */}
      <div style={{ background: '#fff', borderBottom: '1px solid #d5e8da', padding: '0 5%' }}>
        <div style={{ maxWidth: 1300, margin: '0 auto', display: 'flex' }}>
          {TABS.map((t, i) => (
            <button key={i} onClick={() => { setTab(i); setFilter('all'); setSearch('') }} style={{
              background: 'none', border: 'none', cursor: 'pointer',
              padding: '1rem 1.4rem', fontFamily: "'DM Sans', sans-serif",
              fontSize: '0.9rem', fontWeight: tab === i ? 700 : 500,
              color: tab === i ? '#1a6b3c' : '#5a7a62',
              borderBottom: tab === i ? '2.5px solid #1a6b3c' : '2.5px solid transparent',
              whiteSpace: 'nowrap',
            }}>
              {t}
              {i === 4 && disputes.filter(d => d.status === 'open').length > 0 && (
                <span style={{ marginLeft: 6, background: '#c0392b', color: '#fff', borderRadius: 50, padding: '1px 7px', fontSize: '0.7rem', fontWeight: 700 }}>
                  {disputes.filter(d => d.status === 'open').length}
                </span>
              )}
              {i === 2 && stats?.pendingCars > 0 && (
                <span style={{ marginLeft: 6, background: '#d4a017', color: '#0d1f13', borderRadius: 50, padding: '1px 7px', fontSize: '0.7rem', fontWeight: 700 }}>
                  {stats.pendingCars}
                </span>
              )}
            </button>
          ))}
        </div>
      </div>

      <div style={{ maxWidth: 1300, margin: '0 auto', padding: '2rem 5%' }}>

        {loading ? (
          <div style={{ textAlign: 'center', padding: '4rem', color: '#5a7a62' }}>
            <div style={{ fontSize: '2rem', marginBottom: 12 }}>⏳</div>
            <p>Chargement des données...</p>
          </div>
        ) : (

          <>
          {/* ══ TAB 0 — VUE D'ENSEMBLE ══ */}
          {tab === 0 && stats && (
            <div>
              {/* Stats cards */}
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '1.5rem', marginBottom: '2rem' }}>
                {[
                  ['💰', 'Revenus totaux',      fmt(stats.totalRevenue), '#d4a017'],
                  ['👥', 'Total utilisateurs',  stats.users,             '#1a6b3c'],
                  ['🚗', 'Propriétaires',       stats.owners,            '#1a6b3c'],
                  ['🔑', 'Locataires',          stats.renters,           '#1a6b3c'],
                  ['📋', 'Réservations',        stats.bookings,          '#1a6b3c'],
                  ['⏳', 'Voitures en attente', stats.pendingCars,       '#d4a017'],
                  ['🚨', 'Litiges ouverts',     stats.openDisputes || 0, '#c0392b'],
                ].map(([icon, label, val, color]) => (
                  <div key={label} style={{ ...card, textAlign: 'center' }}>
                    <div style={{ fontSize: '1.8rem', marginBottom: 8 }}>{icon}</div>
                    <div style={{ fontFamily: "'Playfair Display', serif", fontSize: '1.6rem', fontWeight: 900, color }}>{val}</div>
                    <div style={{ fontSize: '0.78rem', color: '#5a7a62', marginTop: 4 }}>{label}</div>
                  </div>
                ))}
              </div>

              {/* Voitures en attente d'approbation */}
              {cars.filter(c => !c.isVerified).length > 0 && (
                <div style={card}>
                  <h3 style={{ fontFamily: "'Playfair Display', serif", fontSize: '1.2rem', fontWeight: 700, marginBottom: '1.2rem', color: '#d4a017' }}>
                    🚗 Voitures en attente d'approbation ({cars.filter(c => !c.isVerified).length})
                  </h3>
                  {cars.filter(c => !c.isVerified).slice(0, 3).map(car => (
                    <CarRow key={car._id} car={car} onVerify={verifyCar} onReject={rejectCar} />
                  ))}
                  {cars.filter(c => !c.isVerified).length > 3 && (
                    <button onClick={() => setTab(2)} style={{ background: 'none', border: 'none', color: '#1a6b3c', fontWeight: 700, cursor: 'pointer', fontSize: '0.85rem' }}>
                      Voir toutes ({cars.filter(c => !c.isVerified).length}) →
                    </button>
                  )}
                </div>
              )}
            </div>
          )}

          {/* ══ TAB 1 — UTILISATEURS ══ */}
          {tab === 1 && (
            <div>
              {/* Barre de recherche + filtre */}
              <div style={{ display: 'flex', gap: 12, marginBottom: '1.5rem', flexWrap: 'wrap' }}>
                <input
                  value={search} onChange={e => setSearch(e.target.value)}
                  placeholder="🔍 Rechercher un utilisateur..."
                  style={{ flex: 1, minWidth: 200, padding: '10px 14px', border: '1.5px solid #d5e8da', borderRadius: 10, fontSize: '0.9rem', outline: 'none', fontFamily: "'DM Sans', sans-serif" }}
                />
                <div style={{ display: 'flex', gap: 8 }}>
                  {[['all','Tous'],['owner','Propriétaires'],['renter','Locataires']].map(([v, l]) => (
                    <button key={v} onClick={() => setFilter(v)} style={{ padding: '8px 16px', borderRadius: 50, border: '1.5px solid', borderColor: filter === v ? '#1a6b3c' : '#d5e8da', background: filter === v ? '#1a6b3c' : '#fff', color: filter === v ? '#fff' : '#5a7a62', fontWeight: 600, fontSize: '0.82rem', cursor: 'pointer' }}>
                      {l}
                    </button>
                  ))}
                </div>
              </div>

              <div style={{ ...card, padding: 0, overflow: 'hidden' }}>
                {filteredUsers.length === 0 ? (
                  <div style={{ padding: '3rem', textAlign: 'center', color: '#5a7a62' }}>Aucun utilisateur trouvé.</div>
                ) : filteredUsers.map((u, i) => (
                  <div key={u._id} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '1.2rem 1.5rem', borderBottom: i < filteredUsers.length - 1 ? '1px solid #d5e8da' : 'none', flexWrap: 'wrap', gap: 12 }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                      <div style={{ width: 40, height: 40, borderRadius: '50%', background: 'linear-gradient(135deg, #1a6b3c, #d4a017)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#fff', fontWeight: 700, fontSize: '0.85rem', flexShrink: 0 }}>
                        {u.name?.split(' ').map(n => n[0]).join('').slice(0,2).toUpperCase()}
                      </div>
                      <div>
                        <div style={{ fontWeight: 700, fontSize: '0.95rem', color: '#0d1f13', display: 'flex', alignItems: 'center', gap: 8 }}>
                          {u.name}
                          {u.isVerified  && <span style={{ background: '#e8f5ee', color: '#1a6b3c', fontSize: '0.68rem', fontWeight: 700, padding: '2px 8px', borderRadius: 50 }}>✓ Vérifié</span>}
                          {u.isSuspended && <span style={{ background: '#fdecea', color: '#c0392b', fontSize: '0.68rem', fontWeight: 700, padding: '2px 8px', borderRadius: 50 }}>⛔ Suspendu</span>}
                        </div>
                        <div style={{ fontSize: '0.8rem', color: '#5a7a62' }}>{u.email} · 📍 {u.city || '—'}</div>
                        <div style={{ fontSize: '0.75rem', color: '#5a7a62' }}>
                          {u.role === 'owner' ? '🚗 Propriétaire' : u.role === 'admin' ? '🛡 Admin' : '🔑 Locataire'} · Inscrit le {fmtDate(u.createdAt)}
                        </div>
                      </div>
                    </div>
                    <div style={{ display: 'flex', gap: 8 }}>
                      {!u.isVerified && !u.isSuspended && u.role !== 'admin' && (
                        <button onClick={() => verifyUser(u._id)} style={{ padding: '6px 14px', background: '#e8f5ee', color: '#1a6b3c', border: '1px solid #2d9a5a', borderRadius: 8, fontWeight: 700, fontSize: '0.8rem', cursor: 'pointer' }}>
                          ✓ Vérifier
                        </button>
                      )}
                      {!u.isSuspended && u.role !== 'admin' && (
                        <button onClick={() => suspendUser(u._id)} style={{ padding: '6px 14px', background: '#fdecea', color: '#c0392b', border: '1px solid #e74c3c', borderRadius: 8, fontWeight: 600, fontSize: '0.8rem', cursor: 'pointer' }}>
                          ⛔ Suspendre
                        </button>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* ══ TAB 2 — VOITURES ══ */}
          {tab === 2 && (
            <div>
              <div style={{ display: 'flex', gap: 8, marginBottom: '1.5rem', flexWrap: 'wrap' }}>
                {[['all','Toutes'],['pending','En attente'],['verified','Approuvées']].map(([v, l]) => (
                  <button key={v} onClick={() => setFilter(v)} style={{ padding: '8px 16px', borderRadius: 50, border: '1.5px solid', borderColor: filter === v ? '#1a6b3c' : '#d5e8da', background: filter === v ? '#1a6b3c' : '#fff', color: filter === v ? '#fff' : '#5a7a62', fontWeight: 600, fontSize: '0.82rem', cursor: 'pointer' }}>
                    {l} {v === 'pending' && cars.filter(c => !c.isVerified).length > 0 && `(${cars.filter(c => !c.isVerified).length})`}
                  </button>
                ))}
              </div>
              <div style={card}>
                {filteredCars.length === 0 ? (
                  <div style={{ padding: '3rem', textAlign: 'center', color: '#5a7a62' }}>Aucune voiture dans cette catégorie.</div>
                ) : filteredCars.map(car => (
                  <CarRow key={car._id} car={car} onVerify={verifyCar} onReject={rejectCar} />
                ))}
              </div>
            </div>
          )}

          {/* ══ TAB 4 — LITIGES ══ */}
          {tab === 4 && (
            <div>
              <div style={{ display: 'flex', gap: 8, marginBottom: '1.5rem', flexWrap: 'wrap' }}>
                {[['all','Tous'],['open','Ouverts'],['in_review','En révision'],['resolved','Résolus'],['rejected','Rejetés']].map(([v, l]) => (
                  <button key={v} onClick={() => setFilter(v)} style={{ padding: '8px 16px', borderRadius: 50, border: '1.5px solid', borderColor: filter === v ? '#c0392b' : '#d5e8da', background: filter === v ? '#c0392b' : '#fff', color: filter === v ? '#fff' : '#5a7a62', fontWeight: 600, fontSize: '0.82rem', cursor: 'pointer' }}>
                    {l}
                  </button>
                ))}
              </div>
              <div style={{ ...card, padding: 0, overflow: 'hidden' }}>
                {disputes.filter(d => filter === 'all' || d.status === filter).length === 0 ? (
                  <div style={{ padding: '3rem', textAlign: 'center', color: '#5a7a62' }}>
                    <div style={{ fontSize: '2rem', marginBottom: 12 }}>🎉</div>
                    <p>Aucun litige dans cette catégorie.</p>
                  </div>
                ) : disputes.filter(d => filter === 'all' || d.status === filter).map((d, i, arr) => (
                  <DisputeRow key={d._id} dispute={d} onResolve={resolveDispute} onReject={rejectDispute} onReview={reviewDispute} isLast={i === arr.length - 1} />
                ))}
              </div>
            </div>
          )}

          {/* ══ TAB 3 — RÉSERVATIONS ══ */}
          {tab === 3 && (
            <div>
              <div style={{ display: 'flex', gap: 8, marginBottom: '1.5rem', flexWrap: 'wrap' }}>
                {[['all','Toutes'],['pending','En attente'],['confirmed','Confirmées'],['completed','Terminées'],['cancelled','Annulées']].map(([v, l]) => (
                  <button key={v} onClick={() => setFilter(v)} style={{ padding: '8px 16px', borderRadius: 50, border: '1.5px solid', borderColor: filter === v ? '#1a6b3c' : '#d5e8da', background: filter === v ? '#1a6b3c' : '#fff', color: filter === v ? '#fff' : '#5a7a62', fontWeight: 600, fontSize: '0.82rem', cursor: 'pointer' }}>
                    {l}
                  </button>
                ))}
              </div>
              <div style={{ ...card, padding: 0, overflow: 'hidden' }}>
                {filteredBookings.length === 0 ? (
                  <div style={{ padding: '3rem', textAlign: 'center', color: '#5a7a62' }}>Aucune réservation.</div>
                ) : filteredBookings.map((b, i) => (
                  <div key={b._id} style={{ padding: '1.2rem 1.5rem', borderBottom: i < filteredBookings.length - 1 ? '1px solid #d5e8da' : 'none' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: 12 }}>
                      <div>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 6 }}>
                          <span style={{ fontWeight: 700, fontSize: '0.95rem' }}>{b.renter?.name || '—'}</span>
                          <span style={{ fontSize: '0.72rem', color: '#5a7a62', background: '#f7faf8', border: '1px solid #d5e8da', borderRadius: 50, padding: '2px 8px' }}>
                            {b._id?.slice(-6).toUpperCase()}
                          </span>
                          <span style={{ fontSize: '0.72rem', fontWeight: 700, padding: '3px 10px', borderRadius: 50, background: STATUS[b.status]?.bg, color: STATUS[b.status]?.color }}>
                            {STATUS[b.status]?.label || b.status}
                          </span>
                        </div>
                        <div style={{ fontSize: '0.82rem', color: '#5a7a62', marginBottom: 2 }}>
                          🚗 {b.car?.brand} {b.car?.model} · 📍 {b.car?.city}
                        </div>
                        <div style={{ fontSize: '0.82rem', color: '#5a7a62', marginBottom: 2 }}>
                          👤 Propriétaire : {b.owner?.name || '—'} · Locataire : {b.renter?.name || '—'}
                        </div>
                        <div style={{ fontSize: '0.8rem', color: '#5a7a62' }}>
                          📅 {fmtDate(b.startDate)} → {fmtDate(b.endDate)}
                        </div>
                      </div>
                      <div style={{ textAlign: 'right' }}>
                        <div style={{ fontFamily: "'Playfair Display', serif", fontWeight: 700, fontSize: '1.1rem', color: '#1a6b3c' }}>
                          {fmt(b.totalPrice || 0)}
                        </div>
                        <div style={{ fontSize: '0.75rem', color: '#5a7a62' }}>
                          Caution : {fmt(b.depositAmount || 0)}
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
          </>
        )}
      </div>
    </div>
  )
}


const DISPUTE_STATUS = {
  open:      { label: 'Ouvert',       bg: '#fdecea', color: '#c0392b' },
  in_review: { label: 'En révision',  bg: '#fef9e7', color: '#b8860b' },
  resolved:  { label: 'Résolu',       bg: '#e8f5ee', color: '#1a6b3c' },
  rejected:  { label: 'Rejeté',       bg: '#f0f0f0', color: '#555'    },
}

const DISPUTE_TYPES = {
  damage:  '🔧 Dommage',
  payment: '💰 Paiement',
  no_show: '🚫 No-show',
  other:   '❓ Autre',
}

function DisputeRow({ dispute: d, onResolve, onReject, onReview, isLast }) {
  const [resolution, setResolution] = useState('')
  const [showForm,   setShowForm]   = useState(false)
  const [action,     setAction]     = useState(null)

  const handleAction = () => {
    if (!resolution) return
    if (action === 'resolve') onResolve(d._id, resolution)
    else onReject(d._id, resolution)
    setShowForm(false)
  }

  return (
    <div style={{ padding: '1.4rem 1.5rem', borderBottom: isLast ? 'none' : '1px solid #d5e8da' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: 12, marginBottom: 12 }}>
        <div style={{ flex: 1 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 6, flexWrap: 'wrap' }}>
            <span style={{ fontWeight: 700, fontSize: '0.95rem' }}>{DISPUTE_TYPES[d.type] || d.type}</span>
            <span style={{ fontSize: '0.72rem', fontWeight: 700, padding: '3px 10px', borderRadius: 50, background: DISPUTE_STATUS[d.status]?.bg, color: DISPUTE_STATUS[d.status]?.color }}>
              {DISPUTE_STATUS[d.status]?.label}
            </span>
            <span style={{ fontSize: '0.72rem', color: '#5a7a62' }}>{new Date(d.createdAt).toLocaleDateString('fr-FR')}</span>
          </div>
          <div style={{ fontSize: '0.85rem', color: '#0d1f13', marginBottom: 4 }}>{d.description}</div>
          <div style={{ fontSize: '0.8rem', color: '#5a7a62' }}>
            👤 Signalé par : <strong>{d.reportedBy?.name}</strong> · Contre : <strong>{d.against?.name}</strong>
          </div>
          {d.photos?.length > 0 && (
            <div style={{ display: 'flex', gap: 8, marginTop: 8, flexWrap: 'wrap' }}>
              {d.photos.map((p, i) => (
                <img key={i} src={p} alt="preuve" style={{ width: 60, height: 50, objectFit: 'cover', borderRadius: 8, border: '1px solid #d5e8da' }} />
              ))}
            </div>
          )}
          {d.resolution && (
            <div style={{ marginTop: 8, background: '#e8f5ee', border: '1px solid #2d9a5a', borderRadius: 8, padding: '8px 12px', fontSize: '0.82rem', color: '#1a6b3c' }}>
              ✅ Décision : {d.resolution}
            </div>
          )}
        </div>

        {/* Actions admin */}
        {(d.status === 'open' || d.status === 'in_review') && (
          <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
            {d.status === 'open' && (
              <button onClick={() => onReview(d._id)} style={{ padding: '6px 14px', background: '#fef9e7', color: '#b8860b', border: '1px solid #d4a017', borderRadius: 8, fontWeight: 600, fontSize: '0.8rem', cursor: 'pointer' }}>
                🔍 En révision
              </button>
            )}
            <button onClick={() => { setShowForm(true); setAction('resolve') }} style={{ padding: '6px 14px', background: '#e8f5ee', color: '#1a6b3c', border: '1px solid #2d9a5a', borderRadius: 8, fontWeight: 700, fontSize: '0.8rem', cursor: 'pointer' }}>
              ✅ Résoudre
            </button>
            <button onClick={() => { setShowForm(true); setAction('reject') }} style={{ padding: '6px 14px', background: '#fdecea', color: '#c0392b', border: '1px solid #e74c3c', borderRadius: 8, fontWeight: 600, fontSize: '0.8rem', cursor: 'pointer' }}>
              ❌ Rejeter
            </button>
          </div>
        )}
      </div>

      {/* Formulaire de résolution */}
      {showForm && (
        <div style={{ background: '#f7faf8', border: '1px solid #d5e8da', borderRadius: 12, padding: '1rem', marginTop: 8 }}>
          <label style={{ display: 'block', fontSize: '0.72rem', fontWeight: 700, color: '#5a7a62', textTransform: 'uppercase', marginBottom: 6 }}>
            {action === 'resolve' ? '✅ Décision de résolution' : '❌ Raison du rejet'}
          </label>
          <textarea value={resolution} onChange={e => setResolution(e.target.value)}
            placeholder="Décrivez la décision prise..."
            rows={2}
            style={{ width: '100%', padding: '10px 12px', border: '1.5px solid #d5e8da', borderRadius: 10, fontSize: '0.9rem', outline: 'none', boxSizing: 'border-box', fontFamily: "'DM Sans', sans-serif", resize: 'vertical', marginBottom: 10 }} />
          <div style={{ display: 'flex', gap: 8 }}>
            <button onClick={() => setShowForm(false)} style={{ flex: 1, background: '#fff', border: '1.5px solid #d5e8da', borderRadius: 10, padding: '8px', fontWeight: 600, cursor: 'pointer', color: '#5a7a62', fontFamily: "'DM Sans', sans-serif" }}>Annuler</button>
            <button onClick={handleAction} style={{ flex: 2, background: action === 'resolve' ? '#1a6b3c' : '#c0392b', color: '#fff', border: 'none', borderRadius: 10, padding: '8px', fontWeight: 700, cursor: 'pointer', fontFamily: "'DM Sans', sans-serif" }}>
              {action === 'resolve' ? '✅ Confirmer la résolution' : '❌ Confirmer le rejet'}
            </button>
          </div>
        </div>
      )}
    </div>
  )
}

// Composant ligne voiture
function CarRow({ car, onVerify, onReject }) {
  return (
    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '1rem 0', borderBottom: '1px solid #f0f0f0', flexWrap: 'wrap', gap: 12 }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
        <div style={{ width: 48, height: 48, borderRadius: 10, background: 'linear-gradient(135deg, #1a3d25, #040e07)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '1.4rem', flexShrink: 0 }}>
          🚗
        </div>
        <div>
          <div style={{ fontWeight: 700, fontSize: '0.95rem', color: '#0d1f13', display: 'flex', alignItems: 'center', gap: 8 }}>
            {car.brand} {car.model}
            {car.isVerified
              ? <span style={{ background: '#e8f5ee', color: '#1a6b3c', fontSize: '0.68rem', fontWeight: 700, padding: '2px 8px', borderRadius: 50 }}>✓ Approuvée</span>
              : <span style={{ background: '#fef9e7', color: '#b8860b', fontSize: '0.68rem', fontWeight: 700, padding: '2px 8px', borderRadius: 50 }}>⏳ En attente</span>
            }
          </div>
          <div style={{ fontSize: '0.8rem', color: '#5a7a62' }}>
            📍 {car.city} · {car.type} · 👤 {car.owner?.name || '—'}
          </div>
          <div style={{ fontSize: '0.78rem', color: '#1a6b3c', fontWeight: 700 }}>
            {new Intl.NumberFormat('fr-FR').format(car.pricePerDay || 0)} FCFA/jour
          </div>
        </div>
      </div>
      {!car.isVerified && (
        <div style={{ display: 'flex', gap: 8 }}>
          <button onClick={() => onVerify(car._id)} style={{ padding: '7px 16px', background: '#1a6b3c', color: '#fff', border: 'none', borderRadius: 8, fontWeight: 700, fontSize: '0.82rem', cursor: 'pointer' }}>
            ✓ Approuver
          </button>
          <button onClick={() => onReject(car._id)} style={{ padding: '7px 16px', background: '#fdecea', color: '#c0392b', border: '1px solid #e74c3c', borderRadius: 8, fontWeight: 600, fontSize: '0.82rem', cursor: 'pointer' }}>
            ✕ Rejeter
          </button>
        </div>
      )}
    </div>
  )
}
