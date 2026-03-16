import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { ALL_CARS } from '../data/cars'
import { getCars } from '../services/carService'

// données importées depuis src/data/cars.js
const CITIES = ['Toutes les villes', 'Cotonou', 'Porto-Novo', 'Parakou', 'Abomey-Calavi', 'Bohicon', 'Natitingou']
const TYPES  = ['Tous les types', 'Berline', 'SUV', '4x4', 'Minibus']
const TRANSMISSIONS = ['Toutes', 'Automatique', 'Manuelle']
const PRIX_MAX = [
  { label: 'Tous les prix',   value: Infinity },
  { label: '≤ 20 000 FCFA/j', value: 20000 },
  { label: '≤ 30 000 FCFA/j', value: 30000 },
  { label: '≤ 50 000 FCFA/j', value: 50000 },
  { label: '≤ 70 000 FCFA/j', value: 70000 },
]

const fmt = (n) => new Intl.NumberFormat('fr-FR').format(n) + ' FCFA'

const selStyle = {
  border: 'none', background: 'transparent',
  fontSize: '0.92rem', fontWeight: 500, color: '#1a2e1e',
  outline: 'none', width: '100%', cursor: 'pointer',
}
const labelStyle = {
  fontSize: '0.68rem', fontWeight: 700, color: '#5a7a62',
  textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: 5,
}
const divider = <div style={{ width: 1, background: '#d5e8da', alignSelf: 'stretch', margin: '0 4px' }}/>

export default function Home() {
  const navigate = useNavigate()

  // Inject responsive styles
  if (typeof document !== 'undefined' && !document.getElementById('home-responsive')) {
    const s = document.createElement('style')
    s.id = 'home-responsive'
    s.textContent = `
      @media (max-width: 768px) {
        .home-hero { min-height: 70vh !important; padding: 80px 5% 2rem !important; }
        .home-hero h1 { font-size: 2rem !important; }
        .home-filters { flex-direction: column !important; gap: 10px !important; }
        .home-filters select { width: 100% !important; }
        .home-filters button { width: 100% !important; }
        .home-cars-grid { grid-template-columns: 1fr 1fr !important; gap: 1rem !important; }
        .home-steps { grid-template-columns: 1fr 1fr !important; gap: 1.5rem !important; }
        .home-stats { position: static !important; justify-content: center; gap: 20px; padding-top: 20px; }
      }
      @media (max-width: 480px) {
        .home-cars-grid { grid-template-columns: 1fr !important; }
        .home-steps { grid-template-columns: 1fr !important; }
        .home-hero h1 { font-size: 1.6rem !important; }
      }
    `
    document.head.appendChild(s)
  }

  const [apiCars, setApiCars] = useState([])

  useEffect(() => {
    getCars()
      .then(res => { if (res.data?.length > 0) setApiCars(res.data) })
      .catch(() => {})
  }, [])

  const CARS_SOURCE = apiCars.length > 0 ? apiCars : ALL_CARS

  const [city,         setCity]         = useState('Toutes les villes')
  const [type,         setType]         = useState('Tous les types')
  const [transmission, setTransmission] = useState('Toutes')
  const [prixMax,      setPrixMax]      = useState(Infinity)
  const [modal,        setModal]        = useState(null)
  const [booked,       setBooked]       = useState(false)

  const filtered = CARS_SOURCE.filter(c =>
    (city         === 'Toutes les villes' || c.city         === city)         &&
    (type         === 'Tous les types'    || c.type         === type)         &&
    (transmission === 'Toutes'            || c.transmission === transmission) &&
    (c.pricePerDay || c.price) <= prixMax
  )

  const handleBook = () => {
    setTimeout(() => setBooked(true), 1500)
  }

  return (
    <div style={{ fontFamily: "'DM Sans', sans-serif", background: '#f7faf8', minHeight: '100vh', paddingTop: 68 }}>

      {/* ── HERO ── */}
      <section style={{
        background: '#0d1f13', minHeight: '100vh',
        display: 'flex', alignItems: 'center',
        padding: '0 6%', position: 'relative', overflow: 'hidden'
      }}>
        <div style={{ position: 'absolute', width: 600, height: 600, borderRadius: '50%', background: 'radial-gradient(circle, rgba(26,107,60,0.45) 0%, transparent 70%)', top: -150, right: -150, pointerEvents: 'none' }}/>
        <div style={{ position: 'absolute', width: 350, height: 350, borderRadius: '50%', background: 'radial-gradient(circle, rgba(212,160,23,0.15) 0%, transparent 70%)', bottom: -80, left: '8%', pointerEvents: 'none' }}/>

        <div style={{ position: 'relative', zIndex: 1, maxWidth: 680 }}>
          <div style={{ display: 'inline-flex', alignItems: 'center', gap: 8, background: 'rgba(212,160,23,0.12)', border: '1px solid rgba(212,160,23,0.35)', color: '#d4a017', padding: '6px 16px', borderRadius: 50, fontSize: 12, fontWeight: 700, letterSpacing: '0.1em', textTransform: 'uppercase', marginBottom: 24 }}>
            🇧🇯 La plateforme #1 au Bénin
          </div>
          <h1 style={{ fontFamily: "'Playfair Display', serif", fontSize: 'clamp(2.8rem, 7vw, 5rem)', fontWeight: 900, lineHeight: 1.05, color: '#fff', marginBottom: 24 }}>
            Loue une voiture<br /><span style={{ color: '#d4a017' }}>en toute confiance</span>
          </h1>
          <p style={{ fontSize: '1.1rem', color: 'rgba(255,255,255,0.6)', lineHeight: 1.75, maxWidth: 460, marginBottom: 36 }}>
            Location entre particuliers au Bénin. Paiement Mobile Money, contrat numérique et caution sécurisée.
          </p>
          <div style={{ display: 'flex', gap: 14, flexWrap: 'wrap' }}>
            <button onClick={() => document.getElementById('cars').scrollIntoView({ behavior: 'smooth' })}
              style={{ background: '#d4a017', color: '#0d1f13', padding: '14px 28px', borderRadius: 50, border: 'none', fontWeight: 700, fontSize: '1rem', cursor: 'pointer' }}>
              🔍 Trouver une voiture
            </button>
            <button onClick={() => document.getElementById('how').scrollIntoView({ behavior: 'smooth' })}
              style={{ background: 'transparent', color: '#fff', padding: '14px 28px', borderRadius: 50, border: '1.5px solid rgba(255,255,255,0.3)', fontWeight: 600, fontSize: '1rem', cursor: 'pointer' }}>
              Comment ça marche
            </button>
          </div>
        </div>

        <div style={{ position: 'absolute', bottom: 40, right: '6%', display: 'flex', gap: 40 }}>
          {[['240+','Voitures'],['18','Villes'],['1 200+','Locations']].map(([n, l]) => (
            <div key={l} style={{ textAlign: 'center' }}>
              <div style={{ fontFamily: "'Playfair Display', serif", fontSize: '2.2rem', fontWeight: 900, color: '#d4a017', lineHeight: 1 }}>{n}</div>
              <div style={{ fontSize: '0.7rem', color: 'rgba(255,255,255,0.45)', marginTop: 4, textTransform: 'uppercase', letterSpacing: '0.08em' }}>{l}</div>
            </div>
          ))}
        </div>
      </section>

      {/* ── FILTRES DE RECHERCHE ── */}
      <div style={{ background: '#fff', padding: '2rem 6%', boxShadow: '0 4px 30px rgba(0,0,0,0.07)' }}>
        <div style={{ maxWidth: 1200, margin: '0 auto' }}>

          {/* Ligne 1 : Ville + Type + Boîte + Prix */}
          <div style={{
            display: 'flex', gap: 0, alignItems: 'stretch', flexWrap: 'wrap',
            background: '#f7faf8', border: '1.5px solid #d5e8da',
            borderRadius: 16, padding: '1.1rem 1.4rem',
            marginBottom: 12,
          }}>
            {/* Ville */}
            <div style={{ flex: 1, minWidth: 130 }}>
              <div style={labelStyle}>🏙 Ville</div>
              <select value={city} onChange={e => setCity(e.target.value)} style={selStyle}>
                {CITIES.map(c => <option key={c}>{c}</option>)}
              </select>
            </div>
            {divider}

            {/* Type */}
            <div style={{ flex: 1, minWidth: 130 }}>
              <div style={labelStyle}>🚗 Type</div>
              <select value={type} onChange={e => setType(e.target.value)} style={selStyle}>
                {TYPES.map(t => <option key={t}>{t}</option>)}
              </select>
            </div>
            {divider}

            {/* Boîte de vitesse */}
            <div style={{ flex: 1, minWidth: 130 }}>
              <div style={labelStyle}>⚙️ Boîte</div>
              <select value={transmission} onChange={e => setTransmission(e.target.value)} style={selStyle}>
                {TRANSMISSIONS.map(t => <option key={t}>{t}</option>)}
              </select>
            </div>
            {divider}

            {/* Prix max */}
            <div style={{ flex: 1, minWidth: 150 }}>
              <div style={labelStyle}>💰 Budget / jour</div>
              <select
                value={prixMax}
                onChange={e => setPrixMax(e.target.value === 'Infinity' ? Infinity : Number(e.target.value))}
                style={selStyle}>
                {PRIX_MAX.map(p => <option key={p.label} value={p.value}>{p.label}</option>)}
              </select>
            </div>
            {divider}

            {/* Bouton */}
            <button
              onClick={() => document.getElementById('cars').scrollIntoView({ behavior: 'smooth' })}
              style={{ background: '#1a6b3c', color: '#fff', padding: '10px 22px', borderRadius: 12, border: 'none', fontWeight: 700, fontSize: '0.9rem', cursor: 'pointer', whiteSpace: 'nowrap', alignSelf: 'center', marginLeft: 8 }}>
              🔍 Rechercher
            </button>
          </div>

          {/* Résultat du filtre */}
          <div style={{ fontSize: '0.82rem', color: '#5a7a62', paddingLeft: 4 }}>
            <span style={{ fontWeight: 700, color: '#1a6b3c' }}>{filtered.length}</span> voiture{filtered.length > 1 ? 's' : ''} trouvée{filtered.length > 1 ? 's' : ''}
            {transmission !== 'Toutes' && <span style={{ marginLeft: 8, background: '#e8f5ee', border: '1px solid #1a6b3c', color: '#1a6b3c', borderRadius: 50, padding: '2px 10px', fontSize: '0.75rem', fontWeight: 600 }}>⚙️ {transmission}</span>}
            {type !== 'Tous les types' && <span style={{ marginLeft: 6, background: '#e8f5ee', border: '1px solid #1a6b3c', color: '#1a6b3c', borderRadius: 50, padding: '2px 10px', fontSize: '0.75rem', fontWeight: 600 }}>🏷 {type}</span>}
            {prixMax !== Infinity && <span style={{ marginLeft: 6, background: '#fef9e7', border: '1px solid #d4a017', color: '#b8860b', borderRadius: 50, padding: '2px 10px', fontSize: '0.75rem', fontWeight: 600 }}>💰 ≤ {fmt(prixMax)}</span>}
            {city !== 'Toutes les villes' && <span style={{ marginLeft: 6, background: '#e8f5ee', border: '1px solid #1a6b3c', color: '#1a6b3c', borderRadius: 50, padding: '2px 10px', fontSize: '0.75rem', fontWeight: 600 }}>📍 {city}</span>}
          </div>
        </div>
      </div>

      {/* ── VOITURES ── */}
      <section id="cars" style={{ padding: '5rem 6%' }}>
        <div style={{ textAlign: 'center', marginBottom: '3rem' }}>
          <div style={{ color: '#1a6b3c', fontWeight: 700, fontSize: '0.8rem', letterSpacing: '0.15em', textTransform: 'uppercase', marginBottom: 8 }}>Disponibles maintenant</div>
          <h2 style={{ fontFamily: "'Playfair Display', serif", fontSize: 'clamp(2rem, 4vw, 2.8rem)', fontWeight: 900, color: '#0d1f13' }}>
            Voitures <span style={{ color: '#1a6b3c' }}>vérifiées</span>
          </h2>
        </div>

        {filtered.length === 0 ? (
          <div style={{ textAlign: 'center', padding: '4rem 2rem' }}>
            <div style={{ fontSize: '3rem', marginBottom: 16 }}>🔍</div>
            <p style={{ color: '#5a7a62', fontSize: '1.1rem', marginBottom: 12 }}>Aucune voiture ne correspond à ces filtres.</p>
            <button onClick={() => { setCity('Toutes les villes'); setType('Tous les types'); setTransmission('Toutes'); setPrixMax(Infinity) }}
              style={{ background: '#1a6b3c', color: '#fff', border: 'none', borderRadius: 50, padding: '10px 24px', fontWeight: 700, cursor: 'pointer' }}>
              Réinitialiser les filtres
            </button>
          </div>
        ) : (
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))', gap: '2rem', maxWidth: 1300, margin: '0 auto' }}>
            {filtered.map(car => (
              <div key={car._id || car.id}
                onClick={() => navigate('/cars/' + (car._id || car.id))}
                style={{ background: '#fff', borderRadius: 20, border: '1px solid #d5e8da', overflow: 'hidden', cursor: (car.isAvailable !== undefined ? car.isAvailable : car.available) ? 'pointer' : 'default', transition: 'all 0.25s', opacity: (car.isAvailable !== undefined ? car.isAvailable : car.available) ? 1 : 0.7 }}
                onMouseEnter={e => { if(car.isAvailable !== false) { e.currentTarget.style.transform = 'translateY(-6px)'; e.currentTarget.style.boxShadow = '0 20px 50px rgba(26,107,60,0.13)' }}}
                onMouseLeave={e => { e.currentTarget.style.transform = 'none'; e.currentTarget.style.boxShadow = 'none' }}
              >
                <div style={{ height: 190, display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'linear-gradient(135deg, #1a3d25 0%, #040e07 100%)', position: 'relative', fontSize: '4.5rem', overflow: 'hidden' }}>
                  <span style={{ position: 'relative', zIndex: 1 }}>{car.emoji || '🚗'}</span>
                  {(car.images || car.photos || []).length > 0 && (
                    <img
                      src={(car.images || car.photos || [])[0]}
                      alt={car.model}
                      style={{ width: '100%', height: '100%', objectFit: 'cover', position: 'absolute', inset: 0, zIndex: 2 }}
                      onError={e => e.target.style.display = 'none'}
                    />
                  )}
                  <div style={{ position: 'absolute', top: 12, right: 12, background: (car.isAvailable !== undefined ? car.isAvailable : car.available) ? 'rgba(45,154,90,0.9)' : 'rgba(192,57,43,0.9)', color: '#fff', fontSize: '0.7rem', fontWeight: 700, padding: '4px 10px', borderRadius: 50 }}>
                    {(car.isAvailable !== undefined ? car.isAvailable : car.available) ? '✓ Disponible' : '✗ Indisponible'}
                  </div>
                  {/* Badge boîte de vitesse */}
                  <div style={{ position: 'absolute', top: 12, left: 12, background: 'rgba(0,0,0,0.5)', color: '#fff', fontSize: '0.68rem', fontWeight: 600, padding: '3px 9px', borderRadius: 50 }}>
                    ⚙️ {car.transmission}
                  </div>
                </div>

                <div style={{ padding: '1.4rem' }}>
                  <div style={{ fontSize: '0.72rem', color: '#5a7a62', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: 4 }}>📍 {car.city}</div>
                  <div style={{ fontFamily: "'Playfair Display', serif", fontSize: '1.3rem', fontWeight: 700, color: '#0d1f13', marginBottom: 10 }}>{car.brand} {car.model}</div>

                  <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px 14px', marginBottom: 14 }}>
                    {[['⛽', car.fuel], ['👤', `${car.seats} places`], ['🏷', car.type], ['⚙️', car.transmission]].map(([icon, val]) => (
                      <span key={val} style={{ fontSize: '0.78rem', color: '#5a7a62' }}>{icon} {val}</span>
                    ))}
                  </div>

                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderTop: '1px solid #d5e8da', paddingTop: 12 }}>
                    <div>
                      <span style={{ fontFamily: "'Playfair Display', serif", fontSize: '1.4rem', fontWeight: 700, color: '#1a6b3c' }}>{fmt(car.pricePerDay || car.price)}</span>
                      <span style={{ fontSize: '0.78rem', color: '#5a7a62' }}> / jour</span>
                    </div>
                    <div style={{ fontSize: '0.83rem', color: '#5a7a62' }}>
                      ★ <span style={{ color: '#d4a017' }}>{car.rating}</span> ({car.reviews})
                    </div>
                  </div>

                  <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginTop: 10 }}>
                    <div style={{ width: 26, height: 26, borderRadius: '50%', background: 'linear-gradient(135deg, #1a6b3c, #2d9a5a)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#fff', fontSize: '0.7rem', fontWeight: 700 }}>
                      {(car.owner?.name || car.owner || 'P').toString().split(' ').map(n => n[0]).join('')}
                    </div>
                    <span style={{ fontSize: '0.78rem', color: '#5a7a62' }}>{car.owner?.name || 'Propriétaire'}</span>
                    <span style={{ fontSize: '0.7rem', color: '#1a6b3c', fontWeight: 700 }}>✓ Vérifié</span>
                  </div>

                  <button onClick={e => { e.stopPropagation(); navigate('/cars/' + (car._id || car.id)) }}
                    style={{ width: '100%', marginTop: 14, background: (car.isAvailable !== false) ? '#1a6b3c' : '#aaa', color: '#fff', border: 'none', borderRadius: 12, padding: '10px', fontWeight: 700, fontSize: '0.9rem', cursor: 'pointer' }}>
                    {(car.isAvailable !== false) ? `Réserver — Caution ${fmt(car.depositAmount || car.deposit || 0)}` : 'Indisponible'}
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </section>

      {/* ── COMMENT ÇA MARCHE ── */}
      <section id="how" style={{ background: '#0d1f13', padding: '5rem 6%' }}>
        <div style={{ textAlign: 'center', marginBottom: '3rem' }}>
          <div style={{ color: '#d4a017', fontWeight: 700, fontSize: '0.8rem', letterSpacing: '0.15em', textTransform: 'uppercase', marginBottom: 8 }}>Simple & rapide</div>
          <h2 style={{ fontFamily: "'Playfair Display', serif", fontSize: 'clamp(2rem, 4vw, 2.8rem)', fontWeight: 900, color: '#fff' }}>
            Comment ça <span style={{ color: '#d4a017' }}>marche</span>
          </h2>
        </div>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '2rem', maxWidth: 1100, margin: '0 auto' }}>
          {[
            ['🔍','01','Cherche ta voiture',   'Filtre par ville, prix, boîte de vitesse. Chaque voiture est vérifiée (carte grise + assurance).'],
            ['📋','02','Réserve & signe',       'Contrat numérique automatique. Upload ton permis + CNI. Signature en 2 minutes.'],
            ['📱','03','Paye via Mobile Money', 'MTN MoMo ou Moov Money. La caution est bloquée et rendue en fin de location.'],
            ['🚗','04','Prends le volant',      'Inspection photo avant départ. Retour simple avec restitution de caution.'],
          ].map(([icon, num, title, desc]) => (
            <div key={num} style={{ textAlign: 'center' }}>
              <div style={{ width: 68, height: 68, borderRadius: 18, margin: '0 auto 16px', background: 'rgba(212,160,23,0.1)', border: '1.5px solid rgba(212,160,23,0.3)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '1.7rem' }}>{icon}</div>
              <div style={{ color: '#d4a017', fontSize: '0.72rem', fontWeight: 700, letterSpacing: '0.15em', textTransform: 'uppercase', marginBottom: 6 }}>Étape {num}</div>
              <h3 style={{ color: '#fff', fontWeight: 700, fontSize: '1rem', marginBottom: 8 }}>{title}</h3>
              <p style={{ color: 'rgba(255,255,255,0.48)', fontSize: '0.84rem', lineHeight: 1.65 }}>{desc}</p>
            </div>
          ))}
        </div>
      </section>

      {/* ── CTA ── */}
      <section style={{ padding: '5rem 6%', background: '#fff', textAlign: 'center' }}>
        <div style={{ maxWidth: 680, margin: '0 auto', background: '#0d1f13', borderRadius: 24, padding: '4rem 3rem', position: 'relative', overflow: 'hidden' }}>
          <div style={{ position: 'absolute', top: -80, left: '50%', transform: 'translateX(-50%)', width: 400, height: 280, background: 'radial-gradient(circle, rgba(212,160,23,0.18) 0%, transparent 70%)', pointerEvents: 'none' }}/>
          <h2 style={{ fontFamily: "'Playfair Display', serif", fontSize: '2.2rem', fontWeight: 900, color: '#fff', marginBottom: 12, position: 'relative' }}>
            Ta voiture peut <span style={{ color: '#d4a017' }}>gagner</span> pour toi
          </h2>
          <p style={{ color: 'rgba(255,255,255,0.55)', marginBottom: 28, position: 'relative' }}>
            Ajoute ton véhicule en 10 minutes. Tu contrôles tes disponibilités, tes prix et tes locataires.
          </p>
          <div style={{ display: 'flex', gap: 14, justifyContent: 'center', flexWrap: 'wrap', position: 'relative' }}>
            <button onClick={() => navigate('/register')} style={{ background: '#d4a017', color: '#0d1f13', padding: '12px 24px', borderRadius: 50, border: 'none', fontWeight: 700, cursor: 'pointer' }}>
              🚗 Je suis propriétaire
            </button>
            <button onClick={() => document.getElementById('cars').scrollIntoView({ behavior: 'smooth' })} style={{ background: 'transparent', color: '#fff', padding: '12px 24px', borderRadius: 50, border: '1.5px solid rgba(255,255,255,0.3)', fontWeight: 600, cursor: 'pointer' }}>
              Je veux louer
            </button>
          </div>
        </div>
      </section>

      {/* ── MODAL RÉSERVATION ── */}
      {modal && (
        <div onClick={() => { setModal(null); setBooked(false) }}
          style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.65)', zIndex: 1000, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '1rem' }}>
          <div onClick={e => e.stopPropagation()}
            style={{ background: '#fff', borderRadius: 24, padding: '2.5rem', maxWidth: 500, width: '100%', maxHeight: '90vh', overflowY: 'auto' }}>
            {booked ? (
              <div style={{ textAlign: 'center', padding: '2rem 0' }}>
                <div style={{ fontSize: '3.5rem', marginBottom: 16 }}>✅</div>
                <h3 style={{ fontFamily: "'Playfair Display', serif", fontSize: '1.6rem', fontWeight: 900, marginBottom: 8 }}>Demande envoyée !</h3>
                <p style={{ color: '#5a7a62' }}>Tu recevras une confirmation par SMS. Le propriétaire te contactera sous 1h.</p>
                <button onClick={() => { setModal(null); setBooked(false) }} style={{ marginTop: 20, background: '#1a6b3c', color: '#fff', border: 'none', borderRadius: 12, padding: '12px 28px', fontWeight: 700, cursor: 'pointer' }}>Fermer</button>
              </div>
            ) : (
              <>
                <h3 style={{ fontFamily: "'Playfair Display', serif", fontSize: '1.6rem', fontWeight: 900, marginBottom: 4 }}>
                  Réserver — {modal.brand} {modal.model}
                </h3>
                <p style={{ color: '#5a7a62', fontSize: '0.88rem', marginBottom: 24 }}>
                  {modal.city} · ⚙️ {modal.transmission} · {fmt(modal.price)}/jour · Caution : {fmt(modal.deposit)}
                </p>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12, marginBottom: 12 }}>
                  {[['Prénom','Koffi'],['Nom','Adjovi']].map(([label, ph]) => (
                    <div key={label}>
                      <label style={{ display: 'block', fontSize: '0.72rem', fontWeight: 700, color: '#5a7a62', textTransform: 'uppercase', letterSpacing: '0.07em', marginBottom: 5 }}>{label}</label>
                      <input placeholder={ph} style={{ width: '100%', padding: '10px 12px', border: '1.5px solid #d5e8da', borderRadius: 10, fontSize: '0.9rem', outline: 'none', boxSizing: 'border-box' }} />
                    </div>
                  ))}
                </div>
                {[['Téléphone Mobile Money','+229 01 XX XX XX','tel'],['Date de début','','date'],['Date de fin','','date']].map(([label, ph, type]) => (
                  <div key={label} style={{ marginBottom: 12 }}>
                    <label style={{ display: 'block', fontSize: '0.72rem', fontWeight: 700, color: '#5a7a62', textTransform: 'uppercase', letterSpacing: '0.07em', marginBottom: 5 }}>{label}</label>
                    <input type={type} placeholder={ph} style={{ width: '100%', padding: '10px 12px', border: '1.5px solid #d5e8da', borderRadius: 10, fontSize: '0.9rem', outline: 'none', boxSizing: 'border-box' }} />
                  </div>
                ))}
                <div style={{ background: '#e8f5ee', border: '1px solid #1a6b3c', borderRadius: 10, padding: '12px', fontSize: '0.82rem', color: '#1a6b3c', marginBottom: 16 }}>
                  🔒 La caution de <strong>{fmt(modal.deposit)}</strong> sera bloquée via Mobile Money et restituée après la location si aucun dommage n'est constaté.
                </div>
                <button onClick={handleBook} style={{ width: '100%', background: '#1a6b3c', color: '#fff', border: 'none', borderRadius: 12, padding: '13px', fontWeight: 700, fontSize: '1rem', cursor: 'pointer' }}>
                  📱 Confirmer & payer via Mobile Money
                </button>
              </>
            )}
          </div>
        </div>
      )}
    </div>
  )
}
