import { useState, useEffect } from 'react'
import { useAuth } from '../context/AuthContext'
import { getMyBookings } from '../services/bookingService'
import DisputeModal from '../components/DisputeModal'

const fmt = (n) => new Intl.NumberFormat('fr-FR').format(n) + ' FCFA'

const STATUS = {
  pending:   { label: 'En attente',  bg: '#fef9e7', color: '#b8860b', border: '#d4a017' },
  confirmed: { label: 'Confirmée',   bg: '#e8f5ee', color: '#1a6b3c', border: '#2d9a5a' },
  completed: { label: 'Terminée',    bg: '#f0f0f0', color: '#555',    border: '#aaa'    },
  cancelled: { label: 'Annulée',     bg: '#fdecea', color: '#c0392b', border: '#e74c3c' },
}

const TABS = ['Mon profil', 'Mes réservations', 'Sécurité']

export default function Profile() {
  const { user: authUser } = useAuth()

  // Données dynamiques depuis le compte connecté
  const USER = {
    name:       authUser?.name       || 'Utilisateur',
    email:      authUser?.email      || '',
    phone:      authUser?.phone      || '',
    city:       authUser?.city       || '',
    role:       authUser?.role       || 'renter',
    avatar:     authUser?.name?.split(' ').map(n => n[0]).join('').toUpperCase() || '??',
    joined:     authUser?.createdAt
                  ? new Date(authUser.createdAt).toLocaleDateString('fr-FR', { month: 'long', year: 'numeric' })
                  : 'Récemment',
    verified:   authUser?.isVerified || false,
    rating:     authUser?.rating     || 0,
    totalTrips: authUser?.totalTrips || 0,
  }
  const [tab,        setTab]        = useState(0)
  const [myBookings,  setMyBookings]  = useState([])
  const [bkLoading,   setBkLoading]   = useState(true)

  // Charger les vraies réservations depuis l'API
  useEffect(() => {
    getMyBookings()
      .then(res => setMyBookings(res.data))
      .catch(() => setMyBookings([]))  // silencieux si pas connecté
      .finally(() => setBkLoading(false))
  }, [])
  const [editMode,   setEditMode]   = useState(false)
  const [saved,      setSaved]      = useState(false)
  const [filter,     setFilter]     = useState('all')
  const [form,       setForm]       = useState({ name: USER.name, email: USER.email, phone: USER.phone, city: USER.city })
  const [pwForm,     setPwForm]     = useState({ current: '', newPw: '', confirm: '' })
  const [pwSaved,    setPwSaved]    = useState(false)
  const [reviewModal,setReviewModal]= useState(null)
  const [disputeModal,setDisputeModal]= useState(null)

  const downloadContract = (bookingId) => {
    const token = localStorage.getItem('token')
    const link  = document.createElement('a')
    link.href   = `http://localhost:5000/api/contracts/${bookingId}?token=${token}`
    link.setAttribute('download', `contrat-${bookingId.slice(-6)}.pdf`)
    // Use fetch to handle auth header
    fetch(`http://localhost:5000/api/contracts/${bookingId}`, {
      headers: { Authorization: `Bearer ${token}` }
    })
    .then(r => r.blob())
    .then(blob => {
      const url = URL.createObjectURL(blob)
      link.href = url
      document.body.appendChild(link)
      link.click()
      document.body.removeChild(link)
      URL.revokeObjectURL(url)
    })
    .catch(err => console.error('Contract error:', err))
  }
  const [reviewSent, setReviewSent] = useState(false)
  const [starHover,  setStarHover]  = useState(0)
  const [starPick,   setStarPick]   = useState(0)
  const [comment,    setComment]    = useState('')

  const filteredBK = filter === 'all' ? myBookings : myBookings.filter(b => b.status === filter)
  const totalSpent = myBookings.filter(b => b.status === 'completed').reduce((s, b) => s + b.total, 0)

  const handleSave = () => {
    setSaved(true)
    setEditMode(false)
    setTimeout(() => setSaved(false), 3000)
  }

  const handlePwSave = () => {
    setPwSaved(true)
    setPwForm({ current: '', newPw: '', confirm: '' })
    setTimeout(() => setPwSaved(false), 3000)
  }

  const handleReview = () => {
    setTimeout(() => setReviewSent(true), 1200)
  }

  const inp  = { width: '100%', padding: '10px 12px', border: '1.5px solid #d5e8da', borderRadius: 10, fontSize: '0.92rem', outline: 'none', boxSizing: 'border-box', fontFamily: "'DM Sans', sans-serif" }
  const lbl  = { display: 'block', fontSize: '0.7rem', fontWeight: 700, color: '#5a7a62', textTransform: 'uppercase', letterSpacing: '0.07em', marginBottom: 5 }
  const card = { background: '#fff', borderRadius: 16, border: '1px solid #d5e8da', padding: '1.5rem', marginBottom: '1.5rem' }

  return (
    <div style={{ fontFamily: "'DM Sans', sans-serif", background: '#f7faf8', minHeight: '100vh', paddingTop: 68 }}>

      {/* ── HEADER ── */}
      <div style={{ background: '#0d1f13', padding: '2.5rem 5%', borderBottom: '1px solid rgba(212,160,23,0.15)' }}>
        <div style={{ maxWidth: 900, margin: '0 auto', display: 'flex', alignItems: 'center', gap: '1.5rem', flexWrap: 'wrap' }}>
          <div style={{ width: 72, height: 72, borderRadius: '50%', background: 'linear-gradient(135deg, #1a6b3c, #d4a017)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#fff', fontWeight: 900, fontSize: '1.6rem', fontFamily: "'Playfair Display', serif", flexShrink: 0 }}>
            {USER.avatar}
          </div>
          <div style={{ flex: 1 }}>
            <h1 style={{ fontFamily: "'Playfair Display', serif", fontSize: '1.8rem', fontWeight: 900, color: '#fff', margin: 0, marginBottom: 4 }}>
              {USER.name}
            </h1>
            <div style={{ color: 'rgba(255,255,255,0.5)', fontSize: '0.85rem' }}>
              📍 {USER.city} · Membre depuis {USER.joined}
              {USER.verified && <span style={{ marginLeft: 10, color: '#2d9a5a', fontWeight: 700 }}>✓ Vérifié</span>}
            </div>
          </div>
          {/* Mini stats */}
          <div style={{ display: 'flex', gap: '2rem' }}>
            {[
              ['⭐', USER.rating, 'Note'],
              ['🚗', USER.totalTrips, 'Locations'],
              ['💰', myBookings.filter(b=>b.status==='completed').length, 'Terminées'],
            ].map(([icon, val, lbl]) => (
              <div key={lbl} style={{ textAlign: 'center' }}>
                <div style={{ fontFamily: "'Playfair Display', serif", fontSize: '1.5rem', fontWeight: 900, color: '#d4a017' }}>{val}</div>
                <div style={{ fontSize: '0.7rem', color: 'rgba(255,255,255,0.45)', textTransform: 'uppercase', letterSpacing: '0.06em' }}>{lbl}</div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* ── TABS ── */}
      <div style={{ background: '#fff', borderBottom: '1px solid #d5e8da', padding: '0 5%' }}>
        <div style={{ maxWidth: 900, margin: '0 auto', display: 'flex' }}>
          {TABS.map((t, i) => (
            <button key={t} onClick={() => setTab(i)} style={{
              background: 'none', border: 'none', cursor: 'pointer',
              padding: '1rem 1.4rem', fontFamily: "'DM Sans', sans-serif",
              fontSize: '0.9rem', fontWeight: tab === i ? 700 : 500,
              color: tab === i ? '#1a6b3c' : '#5a7a62',
              borderBottom: tab === i ? '2.5px solid #1a6b3c' : '2.5px solid transparent',
              whiteSpace: 'nowrap', transition: 'all 0.2s',
            }}>{t}</button>
          ))}
        </div>
      </div>

      <div style={{ maxWidth: 900, margin: '0 auto', padding: '2.5rem 5%' }}>

        {/* ══ TAB 0 — MON PROFIL ══ */}
        {tab === 0 && (
          <div>
            {saved && (
              <div style={{ background: '#e8f5ee', border: '1px solid #2d9a5a', borderRadius: 12, padding: '12px 16px', color: '#1a6b3c', fontWeight: 700, marginBottom: '1.5rem', display: 'flex', alignItems: 'center', gap: 8 }}>
                ✅ Profil mis à jour avec succès !
              </div>
            )}

            {/* Infos personnelles */}
            <div style={card}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem' }}>
                <h3 style={{ fontFamily: "'Playfair Display', serif", fontSize: '1.2rem', fontWeight: 700, margin: 0 }}>Informations personnelles</h3>
                {!editMode ? (
                  <button onClick={() => setEditMode(true)} style={{ background: 'none', border: '1.5px solid #d5e8da', borderRadius: 50, padding: '7px 18px', color: '#1a2e1e', fontWeight: 600, fontSize: '0.85rem', cursor: 'pointer' }}>
                    ✏️ Modifier
                  </button>
                ) : (
                  <div style={{ display: 'flex', gap: 8 }}>
                    <button onClick={() => setEditMode(false)} style={{ background: 'none', border: '1.5px solid #d5e8da', borderRadius: 50, padding: '7px 18px', color: '#5a7a62', fontWeight: 600, fontSize: '0.85rem', cursor: 'pointer' }}>Annuler</button>
                    <button onClick={handleSave} style={{ background: '#1a6b3c', border: 'none', borderRadius: 50, padding: '7px 18px', color: '#fff', fontWeight: 700, fontSize: '0.85rem', cursor: 'pointer' }}>✓ Enregistrer</button>
                  </div>
                )}
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
                {[
                  ['Nom complet',  'name',  'text',  'Koffi Adjovi'],
                  ['Email',        'email', 'email', 'koffi@gmail.com'],
                  ['Téléphone',    'phone', 'tel',   '+229 97 11 22 33'],
                  ['Ville',        'city',  'text',  'Cotonou'],
                ].map(([label, key, type, ph]) => (
                  <div key={key}>
                    <label style={lbl}>{label}</label>
                    {editMode ? (
                      <input type={type} value={form[key]} onChange={e => setForm(f => ({ ...f, [key]: e.target.value }))} style={inp} />
                    ) : (
                      <div style={{ padding: '10px 0', fontSize: '0.95rem', color: '#1a2e1e', fontWeight: 500, borderBottom: '1px solid #f0f0f0' }}>
                        {form[key]}
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </div>

            {/* Documents */}
            <div style={card}>
              <h3 style={{ fontFamily: "'Playfair Display', serif", fontSize: '1.2rem', fontWeight: 700, marginBottom: '1.2rem' }}>Documents de vérification</h3>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 14 }}>
                {[
                  ['🪪', 'Carte d\'identité / Passeport', true],
                  ['🚗', 'Permis de conduire',             true],
                  ['🤳', 'Selfie de confirmation',         true],
                ].map(([icon, label, ok]) => (
                  <div key={label} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', background: ok ? '#e8f5ee' : '#f7faf8', border: `1px solid ${ok ? '#2d9a5a' : '#d5e8da'}`, borderRadius: 12, padding: '12px 14px' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                      <span style={{ fontSize: '1.3rem' }}>{icon}</span>
                      <span style={{ fontSize: '0.85rem', fontWeight: 500, color: '#1a2e1e' }}>{label}</span>
                    </div>
                    <span style={{ fontSize: '0.78rem', fontWeight: 700, color: ok ? '#1a6b3c' : '#5a7a62' }}>{ok ? '✓ Vérifié' : 'À fournir'}</span>
                  </div>
                ))}
                {/* Upload nouveau doc */}
                <div style={{ background: '#f7faf8', border: '1.5px dashed #d5e8da', borderRadius: 12, padding: '12px 14px', display: 'flex', alignItems: 'center', gap: 10, cursor: 'pointer' }}>
                  <span style={{ fontSize: '1.3rem' }}>📤</span>
                  <span style={{ fontSize: '0.85rem', color: '#5a7a62' }}>Ajouter un document</span>
                </div>
              </div>
            </div>

            {/* Stats */}
            <div style={card}>
              <h3 style={{ fontFamily: "'Playfair Display', serif", fontSize: '1.2rem', fontWeight: 700, marginBottom: '1.2rem' }}>Statistiques</h3>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(160px, 1fr))', gap: 14 }}>
                {[
                  ['💰', 'Total dépensé',    fmt(totalSpent)],
                  ['🚗', 'Locations totales', USER.totalTrips],
                  ['⭐', 'Ma note',           `${USER.rating}/5`],
                  ['📅', 'Membre depuis',     USER.joined],
                ].map(([icon, label, val]) => (
                  <div key={label} style={{ textAlign: 'center', background: '#f7faf8', borderRadius: 12, padding: '1.2rem' }}>
                    <div style={{ fontSize: '1.5rem', marginBottom: 6 }}>{icon}</div>
                    <div style={{ fontFamily: "'Playfair Display', serif", fontWeight: 700, fontSize: '1rem', color: '#1a6b3c', marginBottom: 2 }}>{val}</div>
                    <div style={{ fontSize: '0.72rem', color: '#5a7a62' }}>{label}</div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* ══ TAB 1 — MES RÉSERVATIONS ══ */}
        {tab === 1 && (
          <div>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem', flexWrap: 'wrap', gap: 12 }}>
              <h2 style={{ fontFamily: "'Playfair Display', serif", fontSize: '1.5rem', fontWeight: 900, margin: 0 }}>Mes réservations</h2>
              <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
                {[['all','Toutes'],['pending','En attente'],['confirmed','Confirmées'],['completed','Terminées']].map(([v, l]) => (
                  <button key={v} onClick={() => setFilter(v)} style={{ padding: '7px 14px', borderRadius: 50, border: '1.5px solid', borderColor: filter === v ? '#1a6b3c' : '#d5e8da', background: filter === v ? '#1a6b3c' : '#fff', color: filter === v ? '#fff' : '#5a7a62', fontWeight: 600, fontSize: '0.8rem', cursor: 'pointer' }}>
                    {l}
                  </button>
                ))}
              </div>
            </div>

            {filteredBK.length === 0 ? (
              <div style={{ ...card, textAlign: 'center', padding: '3rem' }}>
                <div style={{ fontSize: '2.5rem', marginBottom: 12 }}>📋</div>
                <p style={{ color: '#5a7a62' }}>Aucune réservation dans cette catégorie.</p>
              </div>
            ) : (
              filteredBK.map(b => (
                <div key={b.id} style={{ ...card, padding: '1.4rem' }}>
                  <div style={{ display: 'flex', gap: '1rem', flexWrap: 'wrap' }}>
                    {/* Emoji voiture */}
                    <div style={{ width: 56, height: 56, borderRadius: 12, background: 'linear-gradient(135deg, #1a3d25, #040e07)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '1.8rem', flexShrink: 0 }}>
                      {b.emoji}
                    </div>
                    <div style={{ flex: 1 }}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: 8, marginBottom: 6 }}>
                        <div>
                          <span style={{ fontWeight: 700, fontSize: '1rem', color: '#0d1f13' }}>{b.car?.brand ? b.car.brand + " " + b.car.model : b.car}</span>
                          <span style={{ marginLeft: 10, fontSize: '0.72rem', fontWeight: 700, padding: '3px 10px', borderRadius: 50, background: STATUS[b.status].bg, color: STATUS[b.status].color, border: `1px solid ${STATUS[b.status].border}` }}>
                            {STATUS[b.status].label}
                          </span>
                        </div>
                        <div style={{ fontFamily: "'Playfair Display', serif", fontWeight: 700, color: '#1a6b3c', fontSize: '1.05rem' }}>{fmt(b.total)}</div>
                      </div>
                      <div style={{ fontSize: '0.82rem', color: '#5a7a62', marginBottom: 4 }}>
                        📍 {b.car?.city || b.city} · 👤 Propriétaire : {b.owner?.name || b.owner}
                      </div>
                      <div style={{ fontSize: '0.82rem', color: '#5a7a62', marginBottom: 10 }}>
                        📅 {b.start} → {b.end} · {b.days} jour{b.days > 1 ? 's' : ''} · 🔒 Caution : {fmt(b.deposit)}
                      </div>
                      <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
                        {b.status === 'pending' && (
                          <button style={{ padding: '6px 14px', background: '#fdecea', color: '#c0392b', border: '1px solid #e74c3c', borderRadius: 8, fontWeight: 600, fontSize: '0.8rem', cursor: 'pointer' }}>
                            ✕ Annuler
                          </button>
                        )}
                        {(b.status === 'completed' || b.status === 'confirmed') && (
                          <button onClick={() => downloadContract(b._id || b.id)} style={{ padding: '6px 14px', background: '#e8f5ee', color: '#1a6b3c', border: '1px solid #2d9a5a', borderRadius: 8, fontWeight: 700, fontSize: '0.8rem', cursor: 'pointer' }}>
                            📄 Contrat PDF
                          </button>
                        )}
                        {b.status === 'completed' && (
                          <>
                          <button onClick={() => { setReviewModal(b); setReviewSent(false); setStarPick(0); setComment('') }}
                            style={{ padding: '6px 14px', background: '#fef9e7', color: '#b8860b', border: '1px solid #d4a017', borderRadius: 8, fontWeight: 600, fontSize: '0.8rem', cursor: 'pointer' }}>
                            ⭐ Laisser un avis
                          </button>
                          <button onClick={() => setDisputeModal(b)}
                            style={{ padding: '6px 14px', background: '#fdecea', color: '#c0392b', border: '1px solid #e74c3c', borderRadius: 8, fontWeight: 600, fontSize: '0.8rem', cursor: 'pointer' }}>
                            🚨 Signaler un problème
                          </button>
                          </>
                        )}
                        <button style={{ padding: '6px 14px', background: '#f7faf8', color: '#1a2e1e', border: '1px solid #d5e8da', borderRadius: 8, fontWeight: 600, fontSize: '0.8rem', cursor: 'pointer' }}>
                          📄 Voir le contrat
                        </button>
                      </div>
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>
        )}

        {/* ══ TAB 2 — SÉCURITÉ ══ */}
        {tab === 2 && (
          <div style={{ maxWidth: 540 }}>
            {pwSaved && (
              <div style={{ background: '#e8f5ee', border: '1px solid #2d9a5a', borderRadius: 12, padding: '12px 16px', color: '#1a6b3c', fontWeight: 700, marginBottom: '1.5rem' }}>
                ✅ Mot de passe mis à jour !
              </div>
            )}

            <div style={card}>
              <h3 style={{ fontFamily: "'Playfair Display', serif", fontSize: '1.2rem', fontWeight: 700, marginBottom: '1.5rem' }}>Changer le mot de passe</h3>
              {[
                ['Mot de passe actuel',   'current', 'Entrer le mot de passe actuel'],
                ['Nouveau mot de passe',  'newPw',   'Minimum 8 caractères'],
                ['Confirmer',             'confirm', 'Répéter le nouveau mot de passe'],
              ].map(([label, key, ph]) => (
                <div key={key} style={{ marginBottom: 14 }}>
                  <label style={lbl}>{label}</label>
                  <input type="password" placeholder={ph} value={pwForm[key]} onChange={e => setPwForm(f => ({ ...f, [key]: e.target.value }))} style={inp} />
                </div>
              ))}
              <button onClick={handlePwSave} style={{ width: '100%', background: '#1a6b3c', color: '#fff', border: 'none', borderRadius: 12, padding: '12px', fontWeight: 700, fontSize: '0.95rem', cursor: 'pointer', fontFamily: "'DM Sans', sans-serif", marginTop: 4 }}>
                🔒 Mettre à jour le mot de passe
              </button>
            </div>

            <div style={card}>
              <h3 style={{ fontFamily: "'Playfair Display', serif", fontSize: '1.2rem', fontWeight: 700, marginBottom: '1.2rem' }}>Sécurité du compte</h3>
              {[
                ['📱', 'Numéro vérifié',        USER.phone,  true],
                ['📧', 'Email vérifié',          USER.email,  true],
                ['🔐', 'Double authentification','Désactivé', false],
              ].map(([icon, label, val, ok]) => (
                <div key={label} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '12px 0', borderBottom: '1px solid #f0f0f0' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                    <span style={{ fontSize: '1.2rem' }}>{icon}</span>
                    <div>
                      <div style={{ fontWeight: 600, fontSize: '0.9rem' }}>{label}</div>
                      <div style={{ fontSize: '0.78rem', color: '#5a7a62' }}>{val}</div>
                    </div>
                  </div>
                  <span style={{ fontSize: '0.78rem', fontWeight: 700, padding: '3px 10px', borderRadius: 50, background: ok ? '#e8f5ee' : '#fef9e7', color: ok ? '#1a6b3c' : '#b8860b', border: `1px solid ${ok ? '#2d9a5a' : '#d4a017'}` }}>
                    {ok ? '✓ Actif' : 'Inactif'}
                  </span>
                </div>
              ))}
            </div>

            <div style={{ ...card, border: '1px solid #fdecea', background: '#fff' }}>
              <h3 style={{ fontFamily: "'Playfair Display', serif", fontSize: '1.1rem', fontWeight: 700, color: '#c0392b', marginBottom: '0.8rem' }}>Zone de danger</h3>
              <p style={{ fontSize: '0.85rem', color: '#5a7a62', marginBottom: '1rem' }}>La suppression de ton compte est irréversible. Toutes tes données seront effacées.</p>
              <button style={{ background: 'none', border: '1.5px solid #e74c3c', color: '#c0392b', borderRadius: 10, padding: '9px 20px', fontWeight: 700, fontSize: '0.85rem', cursor: 'pointer' }}>
                🗑 Supprimer mon compte
              </button>
            </div>
          </div>
        )}
      </div>

      {/* ── MODAL LITIGE ── */}
      {disputeModal && (
        <DisputeModal
          booking={disputeModal}
          onClose={() => setDisputeModal(null)}
        />
      )}

      {/* ── MODAL AVIS ── */}
      {reviewModal && (
        <div onClick={() => setReviewModal(null)} style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.65)', zIndex: 1000, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '1rem' }}>
          <div onClick={e => e.stopPropagation()} style={{ background: '#fff', borderRadius: 24, padding: '2.5rem', maxWidth: 440, width: '100%' }}>
            {reviewSent ? (
              <div style={{ textAlign: 'center', padding: '1.5rem 0' }}>
                <div style={{ fontSize: '3rem', marginBottom: 12 }}>⭐</div>
                <h3 style={{ fontFamily: "'Playfair Display', serif", fontSize: '1.4rem', fontWeight: 900, marginBottom: 8 }}>Merci pour ton avis !</h3>
                <p style={{ color: '#5a7a62', marginBottom: 20 }}>Ton retour aide la communauté AutoBénin.</p>
                <button onClick={() => setReviewModal(null)} style={{ background: '#1a6b3c', color: '#fff', border: 'none', borderRadius: 12, padding: '10px 24px', fontWeight: 700, cursor: 'pointer' }}>Fermer</button>
              </div>
            ) : (
              <>
                <h3 style={{ fontFamily: "'Playfair Display', serif", fontSize: '1.4rem', fontWeight: 900, marginBottom: 4 }}>Laisser un avis</h3>
                <p style={{ color: '#5a7a62', fontSize: '0.85rem', marginBottom: '1.5rem' }}>{reviewModal.car} · {reviewModal.start} → {reviewModal.end}</p>
                {/* Étoiles */}
                <div style={{ marginBottom: '1.2rem' }}>
                  <label style={lbl}>Note</label>
                  <div style={{ display: 'flex', gap: 8 }}>
                    {[1,2,3,4,5].map(s => (
                      <span key={s} onMouseEnter={() => setStarHover(s)} onMouseLeave={() => setStarHover(0)} onClick={() => setStarPick(s)}
                        style={{ fontSize: '2rem', cursor: 'pointer', color: s <= (starHover || starPick) ? '#d4a017' : '#d5e8da', transition: 'color 0.1s' }}>★</span>
                    ))}
                  </div>
                </div>
                <div style={{ marginBottom: '1.5rem' }}>
                  <label style={lbl}>Commentaire</label>
                  <textarea value={comment} onChange={e => setComment(e.target.value)} rows={3} placeholder="Voiture propre, propriétaire sympa..." style={{ ...inp, resize: 'vertical' }} />
                </div>
                <button onClick={handleReview} disabled={!starPick} style={{ width: '100%', background: starPick ? '#1a6b3c' : '#aaa', color: '#fff', border: 'none', borderRadius: 12, padding: '12px', fontWeight: 700, fontSize: '0.95rem', cursor: starPick ? 'pointer' : 'not-allowed', fontFamily: "'DM Sans', sans-serif" }}>
                  ✅ Envoyer l'avis
                </button>
              </>
            )}
          </div>
        </div>
      )}
    </div>
  )
}
