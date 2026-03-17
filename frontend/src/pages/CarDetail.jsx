import { useState } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import useCarDetail from '../hooks/useCarDetail'
import { createBooking } from '../services/bookingService'
import PaymentModal from '../components/PaymentModal'
import { useAuth } from '../context/AuthContext'

const REVIEWS = [
  { id: 1, author: 'Adjovi K.',  avatar: 'AK', rating: 5, date: 'Il y a 3 jours',    comment: 'Voiture impeccable, propriétaire très réactif. La caution a été rendue immédiatement. Je recommande !' },
  { id: 2, author: 'Seck A.',    avatar: 'SA', rating: 5, date: 'Il y a 1 semaine',  comment: 'Parfait pour mon déplacement professionnel. Voiture propre et en bon état.' },
  { id: 3, author: 'Dossou P.',  avatar: 'DP', rating: 4, date: 'Il y a 2 semaines', comment: 'Bonne expérience globale. Le GPS aurait pu être plus récent mais sinon tout était bien.' },
]

const fmt   = (n) => new Intl.NumberFormat('fr-FR').format(n) + ' FCFA'
const stars = (n) => '★'.repeat(Math.round(n)) + '☆'.repeat(5 - Math.round(n))

// ── Composant galerie photo ──
function PhotoGallery({ photos, emoji }) {
  const [active, setActive] = useState(0)
  const [lightbox, setLightbox] = useState(false)

  const hasPhotos = Array.isArray(photos) && photos.length > 0

  // Si pas de photo → emoji placeholder
  if (!hasPhotos) {
    return (
      <div style={{
        height: 340, borderRadius: 20, overflow: 'hidden',
        background: 'linear-gradient(135deg, #1a3d25 0%, #040e07 100%)',
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        fontSize: '8rem', marginBottom: '1.5rem', position: 'relative',
      }}>
        {emoji}
        <div style={{ position: 'absolute', bottom: 14, left: 14, background: 'rgba(0,0,0,0.5)', color: 'rgba(255,255,255,0.6)', fontSize: '0.75rem', padding: '4px 12px', borderRadius: 50 }}>
          📷 Aucune photo — le propriétaire n'a pas encore ajouté de photos
        </div>
      </div>
    )
  }

  return (
    <div style={{ marginBottom: '1.5rem' }}>
      {/* Photo principale */}
      <div style={{ position: 'relative', height: 340, borderRadius: 20, overflow: 'hidden', cursor: 'zoom-in', marginBottom: 10 }} onClick={() => setLightbox(true)}>
        <img
          src={photos[active]}
          alt="Voiture"
          style={{ width: '100%', height: '100%', objectFit: 'cover', display: 'block', transition: 'transform 0.3s' }}
          onMouseEnter={e => e.target.style.transform = 'scale(1.03)'}
          onMouseLeave={e => e.target.style.transform = 'scale(1)'}
          onError={e => { e.target.style.display = 'none'; e.target.parentNode.style.background = '#1a3d25'; }}
        />
        {/* Compteur photos */}
        <div style={{ position: 'absolute', bottom: 14, right: 14, background: 'rgba(0,0,0,0.6)', color: '#fff', fontSize: '0.78rem', fontWeight: 600, padding: '4px 12px', borderRadius: 50 }}>
          📷 {active + 1} / {photos.length}
        </div>
        {/* Flèches navigation */}
        {photos.length > 1 && (
          <>
            <button onClick={e => { e.stopPropagation(); setActive(a => (a - 1 + photos.length) % photos.length) }}
              style={{ position: 'absolute', left: 12, top: '50%', transform: 'translateY(-50%)', background: 'rgba(0,0,0,0.5)', border: 'none', color: '#fff', width: 36, height: 36, borderRadius: '50%', cursor: 'pointer', fontSize: '1rem', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              ‹
            </button>
            <button onClick={e => { e.stopPropagation(); setActive(a => (a + 1) % photos.length) }}
              style={{ position: 'absolute', right: 12, top: '50%', transform: 'translateY(-50%)', background: 'rgba(0,0,0,0.5)', border: 'none', color: '#fff', width: 36, height: 36, borderRadius: '50%', cursor: 'pointer', fontSize: '1rem', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              ›
            </button>
          </>
        )}
        {/* Hint zoom */}
        <div style={{ position: 'absolute', top: 14, right: 14, background: 'rgba(0,0,0,0.5)', color: '#fff', fontSize: '0.72rem', padding: '4px 10px', borderRadius: 50 }}>
          🔍 Cliquer pour agrandir
        </div>
      </div>

      {/* Miniatures */}
      {photos.length > 1 && (
        <div style={{ display: 'flex', gap: 8, overflowX: 'auto', paddingBottom: 4 }}>
          {photos.map((p, i) => (
            <div key={i} onClick={() => setActive(i)}
              style={{
                width: 80, height: 60, borderRadius: 10, overflow: 'hidden', flexShrink: 0,
                cursor: 'pointer', border: `2.5px solid ${active === i ? '#1a6b3c' : 'transparent'}`,
                transition: 'all 0.2s', opacity: active === i ? 1 : 0.65,
              }}>
              <img src={p} alt={`Vue ${i + 1}`} style={{ width: '100%', height: '100%', objectFit: 'cover', display: 'block' }}
                onError={e => e.target.style.display = 'none'} />
            </div>
          ))}
        </div>
      )}

      {/* Lightbox */}
      {lightbox && (
        <div onClick={() => setLightbox(false)}
          style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.92)', zIndex: 2000, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', padding: '1rem' }}>
          <button onClick={() => setLightbox(false)}
            style={{ position: 'absolute', top: 20, right: 20, background: 'rgba(255,255,255,0.15)', border: 'none', color: '#fff', width: 40, height: 40, borderRadius: '50%', cursor: 'pointer', fontSize: '1.2rem' }}>
            ✕
          </button>
          <img src={photos[active]} alt="Voiture" onClick={e => e.stopPropagation()}
            style={{ maxWidth: '90vw', maxHeight: '80vh', objectFit: 'contain', borderRadius: 12 }} />
          {/* Navigation lightbox */}
          {photos.length > 1 && (
            <div style={{ display: 'flex', gap: 12, marginTop: 20 }}>
              <button onClick={e => { e.stopPropagation(); setActive(a => (a - 1 + photos.length) % photos.length) }}
                style={{ background: 'rgba(255,255,255,0.15)', border: 'none', color: '#fff', padding: '10px 20px', borderRadius: 10, cursor: 'pointer', fontSize: '1rem' }}>
                ‹ Précédent
              </button>
              <span style={{ color: 'rgba(255,255,255,0.5)', alignSelf: 'center', fontSize: '0.85rem' }}>{active + 1} / {photos.length}</span>
              <button onClick={e => { e.stopPropagation(); setActive(a => (a + 1) % photos.length) }}
                style={{ background: 'rgba(255,255,255,0.15)', border: 'none', color: '#fff', padding: '10px 20px', borderRadius: 10, cursor: 'pointer', fontSize: '1rem' }}>
                Suivant ›
              </button>
            </div>
          )}
          {/* Miniatures lightbox */}
          <div style={{ display: 'flex', gap: 8, marginTop: 16 }}>
            {photos.map((p, i) => (
              <div key={i} onClick={e => { e.stopPropagation(); setActive(i) }}
                style={{ width: 60, height: 45, borderRadius: 8, overflow: 'hidden', cursor: 'pointer', border: `2px solid ${active === i ? '#d4a017' : 'rgba(255,255,255,0.3)'}`, opacity: active === i ? 1 : 0.5, transition: 'all 0.2s' }}>
                <img src={p} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}

export default function CarDetail() {
  const { id }           = useParams()
  const navigate         = useNavigate()
  const { car, loading } = useCarDetail(id)
  const { user }         = useAuth()

  const [showModal,  setShowModal]  = useState(false)
  const [paymentBooking, setPaymentBooking] = useState(null) // réservation à payer
  const [booked,     setBooked]     = useState(false)
  const [booking,    setBooking]    = useState(false)
  const [bookError,  setBookError]  = useState('')
  const [startDate,  setStartDate]  = useState('')
  const [endDate,    setEndDate]    = useState('')
  const [phone,      setPhone]      = useState('')

  if (loading) return (
    <div style={{ fontFamily: "'DM Sans', sans-serif", textAlign: 'center', padding: '8rem 2rem', paddingTop: 100 }}>
      <div style={{ fontSize: '2rem', marginBottom: 16, animation: 'spin 1s linear infinite' }}>⏳</div>
      <p style={{ color: '#5a7a62' }}>Chargement...</p>
    </div>
  )

  if (!car) return (
    <div style={{ fontFamily: "'DM Sans', sans-serif", textAlign: 'center', padding: '8rem 2rem', paddingTop: 100 }}>
      <div style={{ fontSize: '3rem', marginBottom: 16 }}>🚗</div>
      <h2 style={{ fontFamily: "'Playfair Display', serif", fontSize: '1.8rem', marginBottom: 12 }}>Voiture introuvable</h2>
      <button onClick={() => navigate('/')} style={{ background: '#1a6b3c', color: '#fff', border: 'none', borderRadius: 50, padding: '12px 28px', fontWeight: 700, cursor: 'pointer' }}>← Retour</button>
    </div>
  )

  const calcDays   = () => { if (!startDate || !endDate) return 0; const d = (new Date(endDate) - new Date(startDate)) / 86400000; return d > 0 ? d : 0 }
  const days       = calcDays()
  const totalPrice = days * (car.pricePerDay || car.price || 0)
  const handleBook = async () => {
    if (!user) { navigate('/login'); return }
    if (!startDate || !endDate) { setBookError('Choisis les dates de location.'); return }
    setBooking(true)
    setBookError('')
    try {
      await createBooking({
        carId:     car._id || car.id,
        startDate,
        endDate,
        phone,
      })
      setBooked(true)
      // Charger la réservation créée pour le paiement
      setPaymentBooking({
        _id:           booking._id,
        totalPrice:    totalPrice,
        depositAmount: car.deposit || car.depositAmount,
        car:           { brand: car.brand, model: car.model },
      })
    } catch (err) {
      setBookError(err.response?.data?.message || 'Erreur lors de la réservation.')
    } finally {
      setBooking(false)
    }
  }

  const inp = { width: '100%', padding: '10px 12px', border: '1.5px solid #d5e8da', borderRadius: 10, fontSize: '0.92rem', outline: 'none', boxSizing: 'border-box', fontFamily: "'DM Sans', sans-serif" }
  const lbl = { display: 'block', fontSize: '0.7rem', fontWeight: 700, color: '#5a7a62', textTransform: 'uppercase', letterSpacing: '0.07em', marginBottom: 5 }

  return (
    <div style={{ fontFamily: "'DM Sans', sans-serif", background: '#f7faf8', minHeight: '100vh', paddingTop: 68 }}>

      {/* Breadcrumb */}
      <div style={{ background: '#fff', padding: '1rem 5%', borderBottom: '1px solid #d5e8da' }}>
        <div style={{ maxWidth: 1200, margin: '0 auto', fontSize: '0.85rem', color: '#5a7a62' }}>
          <span style={{ cursor: 'pointer', color: '#1a6b3c' }} onClick={() => navigate('/')}>Accueil</span>
          <span style={{ margin: '0 8px' }}>›</span>
          <span style={{ cursor: 'pointer', color: '#1a6b3c' }} onClick={() => navigate('/cars')}>Voitures</span>
          <span style={{ margin: '0 8px' }}>›</span>
          <span>{car.brand} {car.model}</span>
        </div>
      </div>

      <div style={{ maxWidth: 1200, margin: '0 auto', padding: '2.5rem 5%' }}>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 380px', gap: '2.5rem', alignItems: 'start' }}>

          {/* ── COLONNE GAUCHE ── */}
          <div>
            {/* GALERIE PHOTO (ou emoji si pas de photo) */}
            <div style={{ position: 'relative' }}>
              <PhotoGallery photos={car.images || car.photos || []} emoji={car.emoji || "🚗"} />
              {/* Badges disponibilité + boîte */}
              <div style={{ position: 'absolute', top: 14, left: 14, display: 'flex', flexDirection: 'column', gap: 6, zIndex: 1 }}>
                <div style={{ background: (car.isAvailable !== false) ? 'rgba(45,154,90,0.9)' : 'rgba(192,57,43,0.9)', color: '#fff', fontSize: '0.75rem', fontWeight: 700, padding: '5px 12px', borderRadius: 50 }}>
                  {(car.isAvailable !== false) ? '✓ Disponible' : '✗ Indisponible'}
                </div>
                <div style={{ background: 'rgba(0,0,0,0.5)', color: '#fff', fontSize: '0.72rem', fontWeight: 600, padding: '4px 10px', borderRadius: 50 }}>
                  ⚙️ {car.transmission}
                </div>
              </div>
            </div>

            {/* Titre */}
            <div style={{ marginBottom: '1.5rem' }}>
              <div style={{ fontSize: '0.78rem', color: '#5a7a62', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: 6 }}>📍 {car.city} · {car.type}</div>
              <h1 style={{ fontFamily: "'Playfair Display', serif", fontSize: 'clamp(1.8rem, 3vw, 2.5rem)', fontWeight: 900, color: '#0d1f13', marginBottom: 10 }}>
                {car.brand} {car.model}
              </h1>
              <div style={{ display: 'flex', alignItems: 'center', gap: 16, flexWrap: 'wrap' }}>
                <span style={{ color: '#d4a017' }}>{stars(car.rating)}</span>
                <span style={{ fontWeight: 700 }}>{car.rating}</span>
                <span style={{ color: '#5a7a62', fontSize: '0.85rem' }}>({car.reviews} avis)</span>
                <span style={{ color: '#d5e8da' }}>|</span>
                <span style={{ fontSize: '0.85rem', color: '#5a7a62' }}>🔑 {car.reviews} locations</span>
                {(car.photos || []).length > 0 && <span style={{ fontSize: '0.85rem', color: '#1a6b3c' }}>📷 {(car.photos || []).length} photo{(car.photos || []).length > 1 ? 's' : ''}</span>}
              </div>
            </div>

            {/* Specs */}
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(110px, 1fr))', gap: 12, marginBottom: '2rem' }}>
              {[['⛽','Carburant',car.fuel],['⚙️','Boîte',car.transmission],['👤','Places',`${car.seats} places`],['🏷','Type',car.type]].map(([icon,label,val]) => (
                <div key={label} style={{ background: '#fff', border: '1px solid #d5e8da', borderRadius: 12, padding: '14px', textAlign: 'center' }}>
                  <div style={{ fontSize: '1.4rem', marginBottom: 4 }}>{icon}</div>
                  <div style={{ fontSize: '0.68rem', color: '#5a7a62', textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: 2 }}>{label}</div>
                  <div style={{ fontWeight: 700, fontSize: '0.85rem', color: '#0d1f13' }}>{val}</div>
                </div>
              ))}
            </div>

            {/* Description */}
            <div style={{ background: '#fff', border: '1px solid #d5e8da', borderRadius: 16, padding: '1.5rem', marginBottom: '1.5rem' }}>
              <h3 style={{ fontFamily: "'Playfair Display', serif", fontSize: '1.2rem', fontWeight: 700, marginBottom: 12 }}>Description</h3>
              <p style={{ color: '#5a7a62', lineHeight: 1.75, fontSize: '0.92rem' }}>{car.description}</p>
            </div>

            {/* Équipements */}
            <div style={{ background: '#fff', border: '1px solid #d5e8da', borderRadius: 16, padding: '1.5rem', marginBottom: '1.5rem' }}>
              <h3 style={{ fontFamily: "'Playfair Display', serif", fontSize: '1.2rem', fontWeight: 700, marginBottom: 14 }}>Équipements</h3>
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: 10 }}>
                {(car.features || []).map(f => (
                  <span key={f} style={{ background: '#e8f5ee', border: '1px solid #2d9a5a', color: '#1a6b3c', borderRadius: 50, padding: '6px 14px', fontSize: '0.82rem', fontWeight: 600 }}>✓ {f}</span>
                ))}
              </div>
            </div>

            {/* Règles */}
            <div style={{ background: '#fff', border: '1px solid #d5e8da', borderRadius: 16, padding: '1.5rem', marginBottom: '1.5rem' }}>
              <h3 style={{ fontFamily: "'Playfair Display', serif", fontSize: '1.2rem', fontWeight: 700, marginBottom: 14 }}>Règles de location</h3>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
                {[['✓','Permis de conduire obligatoire','#1a6b3c','#e8f5ee'],['✓','Caution Mobile Money requise','#1a6b3c','#e8f5ee'],['✓','Inspection photo avant/après','#1a6b3c','#e8f5ee'],['✗','Non-fumeur','#c0392b','#fdecea'],['✗','Animaux non autorisés','#c0392b','#fdecea'],['✓','Kilométrage illimité','#1a6b3c','#e8f5ee']].map(([icon,rule,color,bg]) => (
                  <div key={rule} style={{ display: 'flex', alignItems: 'center', gap: 8, background: bg, borderRadius: 8, padding: '8px 12px' }}>
                    <span style={{ color, fontWeight: 700 }}>{icon}</span>
                    <span style={{ fontSize: '0.82rem', color: '#1a2e1e' }}>{rule}</span>
                  </div>
                ))}
              </div>
            </div>

            {/* Avis */}
            <div style={{ background: '#fff', border: '1px solid #d5e8da', borderRadius: 16, padding: '1.5rem' }}>
              <h3 style={{ fontFamily: "'Playfair Display', serif", fontSize: '1.2rem', fontWeight: 700, marginBottom: '1.2rem' }}>
                Avis <span style={{ color: '#d4a017' }}>★ {car.rating}</span> <span style={{ color: '#5a7a62', fontSize: '0.85rem', fontWeight: 400 }}>({car.reviews})</span>
              </h3>
              {REVIEWS.map(r => (
                <div key={r.id} style={{ paddingBottom: '1.2rem', marginBottom: '1.2rem', borderBottom: '1px solid #f0f0f0' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 8 }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                      <div style={{ width: 36, height: 36, borderRadius: '50%', background: 'linear-gradient(135deg, #1a6b3c, #2d9a5a)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#fff', fontSize: '0.78rem', fontWeight: 700 }}>{r.avatar}</div>
                      <div><div style={{ fontWeight: 700, fontSize: '0.9rem' }}>{r.author}</div><div style={{ color: '#d4a017', fontSize: '0.8rem' }}>{stars(r.rating)}</div></div>
                    </div>
                    <div style={{ fontSize: '0.78rem', color: '#5a7a62' }}>{r.date}</div>
                  </div>
                  <p style={{ fontSize: '0.88rem', color: '#5a7a62', lineHeight: 1.65, margin: 0 }}>{r.comment}</p>
                </div>
              ))}
            </div>
          </div>

          {/* ── COLONNE DROITE ── */}
          <div style={{ position: 'sticky', top: 88 }}>
            <div style={{ background: '#fff', border: '1px solid #d5e8da', borderRadius: 20, padding: '1.8rem', marginBottom: '1rem' }}>
              <div style={{ marginBottom: '1.2rem' }}>
                <span style={{ fontFamily: "'Playfair Display', serif", fontSize: '2rem', fontWeight: 900, color: '#1a6b3c' }}>{fmt((car.pricePerDay || car.price || 0))}</span>
                <span style={{ fontSize: '0.9rem', color: '#5a7a62' }}> / jour</span>
              </div>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10, marginBottom: 14 }}>
                <div><label style={lbl}>📅 Début</label><input type="date" value={startDate} onChange={e => setStartDate(e.target.value)} style={inp} min={new Date().toISOString().split('T')[0]} /></div>
                <div><label style={lbl}>📅 Fin</label><input type="date" value={endDate} onChange={e => setEndDate(e.target.value)} style={inp} min={startDate || new Date().toISOString().split('T')[0]} /></div>
              </div>
              {days > 0 && (
                <div style={{ background: '#f7faf8', border: '1px solid #d5e8da', borderRadius: 12, padding: '1rem', marginBottom: 14 }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.85rem', color: '#5a7a62', marginBottom: 6 }}>
                    <span>{fmt((car.pricePerDay || car.price || 0))} × {days} jour{days > 1 ? 's' : ''}</span><span>{fmt(totalPrice)}</span>
                  </div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.85rem', color: '#5a7a62', marginBottom: 10, paddingBottom: 10, borderBottom: '1px solid #d5e8da' }}>
                    <span>🔒 Caution (remboursable)</span><span>{(car.depositAmount || car.deposit) ? fmt(car.depositAmount || car.deposit) : '🎉 Sans caution'}</span>
                  </div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', fontWeight: 700, fontSize: '1rem' }}>
                    <span>Total</span><span style={{ color: '#1a6b3c' }}>{fmt(totalPrice + car.depositAmount || car.deposit || 0)}</span>
                  </div>
                </div>
              )}
              <button onClick={() => { if (!startDate || !endDate) { alert('Veuillez sélectionner les dates de début et de fin.'); return } if (calcDays() <= 0) { alert('La date de fin doit être après la date de début.'); return } setShowModal(true) }}
                style={{ width: '100%', background: (car.isAvailable !== false) ? '#1a6b3c' : '#aaa', color: '#fff', border: 'none', borderRadius: 12, padding: '14px', fontWeight: 700, fontSize: '1rem', cursor: 'pointer', fontFamily: "'DM Sans', sans-serif", marginBottom: 10 }}>
                {(car.isAvailable !== false) ? '📱 Réserver maintenant' : 'Indisponible'}
              </button>
              <p style={{ textAlign: 'center', fontSize: '0.78rem', color: '#5a7a62', margin: 0 }}>Aucun frais avant confirmation · Caution via Mobile Money</p>
            </div>

            {/* Propriétaire */}
            <div style={{ background: '#fff', border: '1px solid #d5e8da', borderRadius: 20, padding: '1.5rem' }}>
              <h4 style={{ fontWeight: 700, fontSize: '0.92rem', marginBottom: '1rem' }}>Propriétaire</h4>
              <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: '1rem' }}>
                <div style={{ width: 48, height: 48, borderRadius: '50%', background: 'linear-gradient(135deg, #1a6b3c, #d4a017)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#fff', fontWeight: 700, fontSize: '1rem' }}>{(car.owner?.avatar || (car.owner?.name || "P").split(" ").map(n=>n[0]).join(""))}</div>
                <div>
                  <div style={{ fontWeight: 700, fontSize: '0.95rem' }}>{(car.owner?.name || "Propriétaire")}</div>
                  <div style={{ fontSize: '0.78rem', color: '#5a7a62' }}>⭐ {(car.owner?.rating || 0)} · {(car.owner?.trips || 0)} locations · depuis {(car.owner?.joined || "Récemment")}</div>
                </div>
              </div>
              {(car.owner?.verified || car.owner?.isVerified || false) && <div style={{ background: '#e8f5ee', border: '1px solid #2d9a5a', borderRadius: 8, padding: '8px 12px', fontSize: '0.8rem', color: '#1a6b3c', fontWeight: 600, marginBottom: '1rem' }}>✓ Identité vérifiée · ✓ Carte grise vérifiée</div>}
              <a href={`tel:${(car.owner?.phone || "")}`} style={{ display: 'block', textAlign: 'center', padding: '10px', border: '1.5px solid #d5e8da', borderRadius: 12, color: '#1a2e1e', textDecoration: 'none', fontWeight: 600, fontSize: '0.88rem' }}>
                📞 {(car.owner?.phone || "")}
              </a>
            </div>
          </div>
        </div>
      </div>

      {/* ── MODAL RÉSERVATION ── */}
      {/* ── AVIS ET NOTES ── */}
      {reviews.length > 0 && (
        <div style={{ maxWidth: 1100, margin: '0 auto', padding: '0 5% 3rem' }}>
          <div style={{ background: '#fff', borderRadius: 20, border: '1px solid #d5e8da', padding: '2rem' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem' }}>
              <h3 style={{ fontFamily: "'Playfair Display', serif", fontSize: '1.3rem', fontWeight: 700, margin: 0 }}>
                Avis des locataires
              </h3>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                <span style={{ fontSize: '1.5rem', color: '#d4a017' }}>{'★'.repeat(Math.round(car.rating || 0))}</span>
                <span style={{ fontFamily: "'Playfair Display', serif", fontWeight: 700, fontSize: '1.2rem' }}>{car.rating || 0}</span>
                <span style={{ color: '#5a7a62', fontSize: '0.85rem' }}>({reviews.length} avis)</span>
              </div>
            </div>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))', gap: '1rem' }}>
              {reviews.map(r => (
                <div key={r._id} style={{ background: '#f7faf8', borderRadius: 14, padding: '1.2rem', border: '1px solid #d5e8da' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 8 }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                      <div style={{ width: 36, height: 36, borderRadius: '50%', background: 'linear-gradient(135deg,#1a6b3c,#d4a017)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#fff', fontWeight: 700, fontSize: '0.85rem' }}>
                        {r.reviewer?.name?.split(' ').map(n => n[0]).join('').slice(0,2).toUpperCase() || 'U'}
                      </div>
                      <div>
                        <div style={{ fontWeight: 700, fontSize: '0.9rem' }}>{r.reviewer?.name || 'Locataire'}</div>
                        <div style={{ fontSize: '0.72rem', color: '#5a7a62' }}>{new Date(r.createdAt).toLocaleDateString('fr-FR')}</div>
                      </div>
                    </div>
                    <div style={{ color: '#d4a017', fontSize: '1rem' }}>{'★'.repeat(r.rating)}{'☆'.repeat(5 - r.rating)}</div>
                  </div>
                  {r.comment && <p style={{ fontSize: '0.85rem', color: '#0d1f13', margin: 0, lineHeight: 1.6 }}>{r.comment}</p>}
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {showModal && (
        <PaymentModal
          car={car}
          booking={{ startDate, endDate, totalPrice, depositAmount: car.depositAmount || car.deposit || 0 }}
          onClose={() => { setShowModal(false); setBooked(false) }}
          onSuccess={() => { setBooked(true); setShowModal(false) }}
        />
      )}
      {false && (
        <div onClick={() => { setShowModal(false); setBooked(false) }}
          style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.65)', zIndex: 1000, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '1rem' }}>
          <div onClick={e => e.stopPropagation()} style={{ background: '#fff', borderRadius: 24, padding: '2.5rem', maxWidth: 500, width: '100%', maxHeight: '90vh', overflowY: 'auto' }}>
            {booked ? (
              <div style={{ textAlign: 'center', padding: '2rem 0' }}>
                <div style={{ fontSize: '3.5rem', marginBottom: 16 }}>✅</div>
                <h3 style={{ fontFamily: "'Playfair Display', serif", fontSize: '1.6rem', fontWeight: 900, marginBottom: 8 }}>Demande envoyée !</h3>
                <p style={{ color: '#5a7a62', marginBottom: 24 }}>Le propriétaire <strong>{(car.owner?.name || "Propriétaire")}</strong> te contactera sous 1h.</p>
                <button onClick={() => { setShowModal(false); setBooked(false) }} style={{ background: '#1a6b3c', color: '#fff', border: 'none', borderRadius: 12, padding: '12px 28px', fontWeight: 700, cursor: 'pointer' }}>Fermer</button>
              </div>
            ) : (
              <>
                <h3 style={{ fontFamily: "'Playfair Display', serif", fontSize: '1.5rem', fontWeight: 900, marginBottom: 4 }}>Finaliser la réservation</h3>
                <p style={{ color: '#5a7a62', fontSize: '0.85rem', marginBottom: '1.5rem' }}>{car.brand} {car.model} · {car.city} · {fmt((car.pricePerDay || car.price || 0))}/jour</p>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12, marginBottom: 12 }}>
                  {[['Prénom','Koffi'],['Nom','Adjovi']].map(([l,ph]) => (
                    <div key={l}><label style={lbl}>{l}</label><input placeholder={ph} style={inp} /></div>
                  ))}
                </div>
                <div style={{ marginBottom: 12 }}><label style={lbl}>Téléphone Mobile Money</label><input type="tel" placeholder="+229 01 XX XX XX" value={phone} onChange={e => setPhone(e.target.value)} style={inp} /></div>
                {bookError && <div style={{ background: '#fdecea', border: '1px solid #e74c3c', borderRadius: 10, padding: '10px', color: '#c0392b', fontSize: '0.85rem', marginBottom: 12 }}>⚠️ {bookError}</div>}
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12, marginBottom: 12 }}>
                  <div><label style={lbl}>Date de début</label><input type="date" value={startDate} onChange={e => setStartDate(e.target.value)} style={inp} /></div>
                  <div><label style={lbl}>Date de fin</label><input type="date" value={endDate} onChange={e => setEndDate(e.target.value)} style={inp} /></div>
                </div>
                <div style={{ marginBottom: 14 }}><label style={lbl}>Upload permis de conduire</label><input type="file" accept="image/*,application/pdf" style={{ ...inp, padding: '8px 12px', fontSize: '0.82rem' }} /></div>
                {days > 0 && (
                  <div style={{ background: '#f7faf8', border: '1px solid #d5e8da', borderRadius: 10, padding: '12px', marginBottom: 14 }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.85rem', color: '#5a7a62', marginBottom: 4 }}><span>Location ({days}j)</span><span>{fmt(totalPrice)}</span></div>
                    <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.85rem', color: '#5a7a62', marginBottom: 8 }}><span>Caution</span><span>{(car.depositAmount || car.deposit) ? fmt(car.depositAmount || car.deposit) : '🎉 Sans caution'}</span></div>
                    <div style={{ display: 'flex', justifyContent: 'space-between', fontWeight: 700, borderTop: '1px solid #d5e8da', paddingTop: 8 }}><span>Total</span><span style={{ color: '#1a6b3c' }}>{fmt(totalPrice + car.depositAmount || car.deposit || 0)}</span></div>
                  </div>
                )}
                <div style={{ background: '#e8f5ee', border: '1px solid #1a6b3c', borderRadius: 10, padding: '10px 14px', fontSize: '0.8rem', color: '#1a6b3c', marginBottom: '1.2rem' }}>
                  🔒 Caution de <strong>{(car.depositAmount || car.deposit) ? fmt(car.depositAmount || car.deposit) : '🎉 Sans caution'}</strong> bloquée via Mobile Money · Restituée après la location
                </div>
                <button onClick={handleBook} disabled={booking} style={{ width: '100%', background: booking ? '#aaa' : '#1a6b3c', color: '#fff', border: 'none', borderRadius: 12, padding: '13px', fontWeight: 700, fontSize: '1rem', cursor: booking ? 'not-allowed' : 'pointer', fontFamily: "'DM Sans', sans-serif" }}>
                  {booking ? '⏳ Traitement en cours...' : '📱 Confirmer & payer via Mobile Money'}
                </button>
              </>
            )}
          </div>
        </div>
      )}
    </div>
  )
}
