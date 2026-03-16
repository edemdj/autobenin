import { useState, useMemo, useEffect } from 'react'
import { ALL_CARS } from '../data/cars'
import { useNavigate } from 'react-router-dom'
import { getCars } from '../services/carService'


const CITIES        = ['Toutes les villes', 'Cotonou', 'Porto-Novo', 'Parakou', 'Abomey-Calavi', 'Bohicon', 'Natitingou']
const TYPES         = ['Tous les types', 'Berline', 'SUV', '4x4', 'Minibus']
const TRANSMISSIONS = ['Toutes', 'Automatique', 'Manuelle']
const FUELS         = ['Tous', 'Essence', 'Diesel']
const SEATS         = ['Tous', '2', '4', '5', '7', '9', '14+']
const SORT_OPTIONS  = [
  { value: 'price_asc',    label: 'Prix croissant'    },
  { value: 'price_desc',   label: 'Prix décroissant'  },
  { value: 'rating_desc',  label: 'Mieux notés'       },
  { value: 'reviews_desc', label: 'Plus d\'avis'      },
]

const fmt = (n) => new Intl.NumberFormat('fr-FR').format(n) + ' FCFA'

export default function Cars() {
  const navigate = useNavigate()

  // Filtres
  const [apiCars,      setApiCars]      = useState([])
  const [apiLoading,   setApiLoading]   = useState(true)

  // Charger les voitures depuis l'API, fallback sur données locales
  useEffect(() => {
    getCars()
      .then(res => {
        if (res.data && res.data.length > 0) setApiCars(res.data)
        else setApiCars(ALL_CARS)
      })
      .catch(() => setApiCars(ALL_CARS))
      .finally(() => setApiLoading(false))
  }, [])

  // Source de données : API ou local
  const CARS_DATA = apiCars.length > 0 ? apiCars : ALL_CARS

  const [city,         setCity]         = useState('Toutes les villes')
  const [type,         setType]         = useState('Tous les types')
  const [transmission, setTransmission] = useState('Toutes')
  const [fuel,         setFuel]         = useState('Tous')
  const [seats,        setSeats]        = useState('Tous')
  const [priceMin,     setPriceMin]     = useState('')
  const [priceMax,     setPriceMax]     = useState('')
  const [onlyAvail,    setOnlyAvail]    = useState(false)
  const [onlyVerified, setOnlyVerified] = useState(false)
  const [sort,         setSort]         = useState('rating_desc')
  const [search,       setSearch]       = useState('')
  const [sidebarOpen,  setSidebarOpen]  = useState(true)

  // Nombre de filtres actifs (badge)
  const activeFilters = [
    city !== 'Toutes les villes',
    type !== 'Tous les types',
    transmission !== 'Toutes',
    fuel !== 'Tous',
    seats !== 'Tous',
    !!priceMin,
    !!priceMax,
    onlyAvail,
    onlyVerified,
  ].filter(Boolean).length

  const resetFilters = () => {
    setCity('Toutes les villes'); setType('Tous les types')
    setTransmission('Toutes'); setFuel('Tous'); setSeats('Tous')
    setPriceMin(''); setPriceMax('')
    setOnlyAvail(false); setOnlyVerified(false); setSearch('')
  }

  // Filtrage + tri
  const filtered = useMemo(() => {
    let list = CARS_DATA.filter(c => {
      if (search && !`${c.brand} ${c.model} ${c.city}`.toLowerCase().includes(search.toLowerCase())) return false
      if (city !== 'Toutes les villes' && c.city !== city) return false
      if (type !== 'Tous les types'    && c.type !== type) return false
      if (transmission !== 'Toutes'    && c.transmission !== transmission) return false
      if (fuel !== 'Tous'              && c.fuel !== fuel) return false
      if (seats !== 'Tous') {
        if (seats === '14+' && c.seats < 14) return false
        else if (seats !== '14+' && c.seats !== Number(seats)) return false
      }
      if (priceMin && (c.pricePerDay || c.price) < Number(priceMin)) return false
      if (priceMax && (c.pricePerDay || c.price) > Number(priceMax)) return false
      if (onlyAvail    && !(c.isAvailable !== undefined ? c.isAvailable : c.available)) return false
      if (onlyVerified && !(c.isVerified !== undefined ? c.isVerified : c.verified))  return false
      return true
    })
    return list.sort((a, b) => {
      if (sort === 'price_asc')    return a.price  - b.price
      if (sort === 'price_desc')   return b.price  - a.price
      if (sort === 'rating_desc')  return b.rating - a.rating
      if (sort === 'reviews_desc') return b.reviews - a.reviews
      return 0
    })
  }, [city, type, transmission, fuel, seats, priceMin, priceMax, onlyAvail, onlyVerified, sort, search, CARS_DATA])

  const selStyle = { width: '100%', padding: '9px 10px', border: '1.5px solid #d5e8da', borderRadius: 10, fontSize: '0.85rem', outline: 'none', background: '#fff', fontFamily: "'DM Sans', sans-serif", cursor: 'pointer', color: '#1a2e1e' }
  const lbl      = { fontSize: '0.68rem', fontWeight: 700, color: '#5a7a62', textTransform: 'uppercase', letterSpacing: '0.07em', display: 'block', marginBottom: 5 }

  return (
    <div style={{ fontFamily: "'DM Sans', sans-serif", background: '#f7faf8', minHeight: '100vh', paddingTop: 68 }}>

      {/* ── HEADER ── */}
      <div style={{ background: '#0d1f13', padding: '2rem 5%', borderBottom: '1px solid rgba(212,160,23,0.15)' }}>
        <div style={{ maxWidth: 1300, margin: '0 auto' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 16, marginBottom: '1.2rem' }}>
            <div>
              <h1 style={{ fontFamily: "'Playfair Display', serif", fontSize: '2rem', fontWeight: 900, color: '#fff', margin: 0, marginBottom: 4 }}>
                Toutes les voitures
              </h1>
              <p style={{ color: 'rgba(255,255,255,0.5)', fontSize: '0.85rem', margin: 0 }}>
                <span style={{ color: '#d4a017', fontWeight: 700 }}>{filtered.length}</span> véhicule{filtered.length > 1 ? 's' : ''} disponible{filtered.length > 1 ? 's' : ''}
              </p>
            </div>
            {/* Tri */}
            <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
              <span style={{ color: 'rgba(255,255,255,0.5)', fontSize: '0.85rem' }}>Trier par</span>
              <select value={sort} onChange={e => setSort(e.target.value)} style={{ ...selStyle, background: 'rgba(255,255,255,0.1)', color: '#fff', border: '1px solid rgba(255,255,255,0.2)', minWidth: 180 }}>
                {SORT_OPTIONS.map(o => <option key={o.value} value={o.value} style={{ background: '#0d1f13' }}>{o.label}</option>)}
              </select>
            </div>
          </div>

          {/* Barre de recherche + lien recherche avancée */}
          <div style={{ display: 'flex', gap: 10, alignItems: 'center', flexWrap: 'wrap' }}>
          <div style={{ position: 'relative', flex: 1, minWidth: 260 }}>
            <span style={{ position: 'absolute', left: 14, top: '50%', transform: 'translateY(-50%)', fontSize: '1rem', color: '#5a7a62' }}>🔍</span>
            <input
              value={search}
              onChange={e => setSearch(e.target.value)}
              placeholder="Rechercher une marque, modèle, ville..."
              style={{ width: '100%', padding: '12px 14px 12px 40px', border: '1.5px solid rgba(255,255,255,0.15)', borderRadius: 12, background: 'rgba(255,255,255,0.08)', color: '#fff', fontSize: '0.9rem', outline: 'none', boxSizing: 'border-box', fontFamily: "'DM Sans', sans-serif' " }}
            />
            {search && (
              <button onClick={() => setSearch('')} style={{ position: 'absolute', right: 12, top: '50%', transform: 'translateY(-50%)', background: 'none', border: 'none', color: 'rgba(255,255,255,0.5)', cursor: 'pointer', fontSize: '1rem' }}>✕</button>
            )}
          </div>
          <button onClick={() => navigate('/search')} style={{ padding: '11px 18px', background: 'rgba(212,160,23,0.15)', border: '1.5px solid rgba(212,160,23,0.4)', borderRadius: 12, color: '#d4a017', fontWeight: 700, fontSize: '0.85rem', cursor: 'pointer', whiteSpace: 'nowrap', fontFamily: "'DM Sans', sans-serif" }}>
            🎛 Recherche avancée
          </button>
          </div>
        </div>
      </div>

      <div style={{ maxWidth: 1300, margin: '0 auto', padding: '2rem 5%', display: 'flex', gap: '2rem', alignItems: 'flex-start' }}>

        {/* ── SIDEBAR FILTRES ── */}
        <div style={{ width: sidebarOpen ? 260 : 0, flexShrink: 0, overflow: 'hidden', transition: 'width 0.3s' }}>
          <div style={{ width: 260 }}>

            {/* Header sidebar */}
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.2rem' }}>
              <span style={{ fontWeight: 700, fontSize: '0.95rem', color: '#0d1f13' }}>
                Filtres
                {activeFilters > 0 && (
                  <span style={{ marginLeft: 8, background: '#1a6b3c', color: '#fff', borderRadius: 50, padding: '1px 8px', fontSize: '0.72rem', fontWeight: 700 }}>
                    {activeFilters}
                  </span>
                )}
              </span>
              {activeFilters > 0 && (
                <button onClick={resetFilters} style={{ background: 'none', border: 'none', color: '#c0392b', fontSize: '0.8rem', fontWeight: 700, cursor: 'pointer' }}>
                  Réinitialiser
                </button>
              )}
            </div>

            {/* Disponibilité */}
            <div style={{ background: '#fff', border: '1px solid #d5e8da', borderRadius: 14, padding: '1rem', marginBottom: 12 }}>
              <label style={lbl}>Disponibilité</label>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                {[
                  [onlyAvail,    setOnlyAvail,    'Disponibles seulement'],
                  [onlyVerified, setOnlyVerified, 'Propriétaires vérifiés'],
                ].map(([val, set, label]) => (
                  <label key={label} style={{ display: 'flex', alignItems: 'center', gap: 10, cursor: 'pointer', fontSize: '0.88rem', color: '#1a2e1e' }}>
                    <div onClick={() => set(v => !v)} style={{ width: 20, height: 20, borderRadius: 6, border: `2px solid ${val ? '#1a6b3c' : '#d5e8da'}`, background: val ? '#1a6b3c' : '#fff', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0, cursor: 'pointer', transition: 'all 0.15s' }}>
                      {val && <span style={{ color: '#fff', fontSize: '0.7rem' }}>✓</span>}
                    </div>
                    {label}
                  </label>
                ))}
              </div>
            </div>

            {/* Ville */}
            <div style={{ background: '#fff', border: '1px solid #d5e8da', borderRadius: 14, padding: '1rem', marginBottom: 12 }}>
              <label style={lbl}>🏙 Ville</label>
              <select value={city} onChange={e => setCity(e.target.value)} style={selStyle}>
                {CITIES.map(c => <option key={c}>{c}</option>)}
              </select>
            </div>

            {/* Type */}
            <div style={{ background: '#fff', border: '1px solid #d5e8da', borderRadius: 14, padding: '1rem', marginBottom: 12 }}>
              <label style={lbl}>🏷 Type de véhicule</label>
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6 }}>
                {TYPES.filter(t => t !== 'Tous les types').map(t => (
                  <button key={t} onClick={() => setType(type === t ? 'Tous les types' : t)} style={{
                    padding: '5px 12px', borderRadius: 50, fontSize: '0.8rem', fontWeight: 600, cursor: 'pointer', border: '1.5px solid',
                    borderColor: type === t ? '#1a6b3c' : '#d5e8da',
                    background: type === t ? '#1a6b3c' : '#fff',
                    color: type === t ? '#fff' : '#5a7a62',
                  }}>{t}</button>
                ))}
              </div>
            </div>

            {/* Boîte de vitesse */}
            <div style={{ background: '#fff', border: '1px solid #d5e8da', borderRadius: 14, padding: '1rem', marginBottom: 12 }}>
              <label style={lbl}>⚙️ Boîte de vitesse</label>
              <div style={{ display: 'flex', gap: 8 }}>
                {TRANSMISSIONS.map(t => (
                  <button key={t} onClick={() => setTransmission(t)} style={{ flex: 1, padding: '7px 4px', borderRadius: 10, fontSize: '0.78rem', fontWeight: 600, cursor: 'pointer', border: '1.5px solid', borderColor: transmission === t ? '#1a6b3c' : '#d5e8da', background: transmission === t ? '#1a6b3c' : '#fff', color: transmission === t ? '#fff' : '#5a7a62' }}>
                    {t}
                  </button>
                ))}
              </div>
            </div>

            {/* Carburant */}
            <div style={{ background: '#fff', border: '1px solid #d5e8da', borderRadius: 14, padding: '1rem', marginBottom: 12 }}>
              <label style={lbl}>⛽ Carburant</label>
              <div style={{ display: 'flex', gap: 8 }}>
                {FUELS.map(f => (
                  <button key={f} onClick={() => setFuel(f)} style={{ flex: 1, padding: '7px 4px', borderRadius: 10, fontSize: '0.78rem', fontWeight: 600, cursor: 'pointer', border: '1.5px solid', borderColor: fuel === f ? '#1a6b3c' : '#d5e8da', background: fuel === f ? '#1a6b3c' : '#fff', color: fuel === f ? '#fff' : '#5a7a62' }}>
                    {f}
                  </button>
                ))}
              </div>
            </div>

            {/* Nombre de places */}
            <div style={{ background: '#fff', border: '1px solid #d5e8da', borderRadius: 14, padding: '1rem', marginBottom: 12 }}>
              <label style={lbl}>👤 Nombre de places</label>
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6 }}>
                {SEATS.map(s => (
                  <button key={s} onClick={() => setSeats(seats === s ? 'Tous' : s)} style={{ padding: '5px 10px', borderRadius: 50, fontSize: '0.78rem', fontWeight: 600, cursor: 'pointer', border: '1.5px solid', borderColor: seats === s ? '#1a6b3c' : '#d5e8da', background: seats === s ? '#1a6b3c' : '#fff', color: seats === s ? '#fff' : '#5a7a62' }}>
                    {s === 'Tous' ? 'Tous' : s === '14+' ? '14+' : `${s} pl.`}
                  </button>
                ))}
              </div>
            </div>

            {/* Budget */}
            <div style={{ background: '#fff', border: '1px solid #d5e8da', borderRadius: 14, padding: '1rem', marginBottom: 12 }}>
              <label style={lbl}>💰 Budget / jour (FCFA)</label>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8 }}>
                <div>
                  <label style={{ ...lbl, color: '#aaa' }}>Min</label>
                  <input type="number" placeholder="0" value={priceMin} onChange={e => setPriceMin(e.target.value)} style={{ ...selStyle, padding: '8px 10px' }} />
                </div>
                <div>
                  <label style={{ ...lbl, color: '#aaa' }}>Max</label>
                  <input type="number" placeholder="∞" value={priceMax} onChange={e => setPriceMax(e.target.value)} style={{ ...selStyle, padding: '8px 10px' }} />
                </div>
              </div>
              {/* Raccourcis prix */}
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: 5, marginTop: 8 }}>
                {[['≤20k', '', '20000'], ['≤30k', '', '30000'], ['≤50k', '', '50000']].map(([label, min, max]) => (
                  <button key={label} onClick={() => { setPriceMin(min); setPriceMax(max) }} style={{ padding: '3px 8px', borderRadius: 50, fontSize: '0.72rem', fontWeight: 600, cursor: 'pointer', border: '1px solid #d5e8da', background: priceMax === max ? '#e8f5ee' : '#f7faf8', color: priceMax === max ? '#1a6b3c' : '#5a7a62' }}>
                    {label}
                  </button>
                ))}
              </div>
            </div>

          </div>
        </div>

        {/* ── LISTE VOITURES ── */}
        <div style={{ flex: 1, minWidth: 0 }}>

          {/* Toggle sidebar + résultats */}
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.2rem' }}>
            <button onClick={() => setSidebarOpen(v => !v)} style={{ display: 'flex', alignItems: 'center', gap: 6, background: '#fff', border: '1.5px solid #d5e8da', borderRadius: 10, padding: '7px 14px', fontWeight: 600, fontSize: '0.85rem', cursor: 'pointer', color: '#1a2e1e' }}>
              {sidebarOpen ? '◀ Masquer les filtres' : '▶ Afficher les filtres'}
              {activeFilters > 0 && !sidebarOpen && <span style={{ background: '#1a6b3c', color: '#fff', borderRadius: 50, padding: '1px 7px', fontSize: '0.7rem' }}>{activeFilters}</span>}
            </button>
            <span style={{ fontSize: '0.85rem', color: '#5a7a62' }}>
              <span style={{ fontWeight: 700, color: '#0d1f13' }}>{filtered.length}</span> résultat{filtered.length > 1 ? 's' : ''}
            </span>
          </div>

          {/* Tags filtres actifs */}
          {activeFilters > 0 && (
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8, marginBottom: '1.2rem' }}>
              {city !== 'Toutes les villes' && <Tag label={`📍 ${city}`}          onRemove={() => setCity('Toutes les villes')} />}
              {type !== 'Tous les types'    && <Tag label={`🏷 ${type}`}           onRemove={() => setType('Tous les types')} />}
              {transmission !== 'Toutes'    && <Tag label={`⚙️ ${transmission}`}   onRemove={() => setTransmission('Toutes')} />}
              {fuel !== 'Tous'              && <Tag label={`⛽ ${fuel}`}           onRemove={() => setFuel('Tous')} />}
              {seats !== 'Tous'             && <Tag label={`👤 ${seats} places`}   onRemove={() => setSeats('Tous')} />}
              {priceMax                     && <Tag label={`💰 ≤ ${fmt(priceMax)}`} onRemove={() => setPriceMax('')} />}
              {priceMin                     && <Tag label={`💰 ≥ ${fmt(priceMin)}`} onRemove={() => setPriceMin('')} />}
              {onlyAvail                    && <Tag label="✓ Disponibles"           onRemove={() => setOnlyAvail(false)} />}
              {onlyVerified                 && <Tag label="✓ Vérifiés"              onRemove={() => setOnlyVerified(false)} />}
            </div>
          )}

          {/* Chargement */}
          {apiLoading ? (
            <div style={{ textAlign: 'center', padding: '4rem', color: '#5a7a62' }}>
              <div style={{ fontSize: '2rem', marginBottom: 12 }}>⏳</div>
              <p>Chargement des voitures...</p>
            </div>
          ) : filtered.length === 0 ? (
            <div style={{ background: '#fff', border: '1px solid #d5e8da', borderRadius: 20, padding: '4rem 2rem', textAlign: 'center' }}>
              <div style={{ fontSize: '3rem', marginBottom: 16 }}>🔍</div>
              <h3 style={{ fontFamily: "'Playfair Display', serif", fontSize: '1.4rem', fontWeight: 700, marginBottom: 8 }}>Aucune voiture trouvée</h3>
              <p style={{ color: '#5a7a62', marginBottom: 20 }}>Essaie de modifier tes filtres.</p>
              <button onClick={resetFilters} style={{ background: '#1a6b3c', color: '#fff', border: 'none', borderRadius: 50, padding: '10px 24px', fontWeight: 700, cursor: 'pointer' }}>
                Réinitialiser les filtres
              </button>
            </div>
          ) : (
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', gap: '1.5rem' }}>
              {filtered.map(car => (
                <div key={car.id}
                  onClick={() => navigate('/cars/' + (car._id || car.id))}
                  style={{ background: '#fff', borderRadius: 20, border: '1px solid #d5e8da', overflow: 'hidden', cursor: 'pointer', transition: 'all 0.25s', opacity: (car.isAvailable !== undefined ? car.isAvailable : car.available) ? 1 : 0.72 }}
                  onMouseEnter={e => { e.currentTarget.style.transform = 'translateY(-5px)'; e.currentTarget.style.boxShadow = '0 16px 40px rgba(26,107,60,0.13)' }}
                  onMouseLeave={e => { e.currentTarget.style.transform = 'none'; e.currentTarget.style.boxShadow = 'none' }}
                >
                  {/* Image — photo réelle ou emoji si pas de photo */}
                  <div style={{ height: 170, display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'linear-gradient(135deg, #1a3d25 0%, #040e07 100%)', position: 'relative', fontSize: '4rem', overflow: 'hidden' }}>
                    <span style={{ position: 'relative', zIndex: 1 }}>{car.emoji || '🚗'}</span>
                    {(car.images || car.photos || []).length > 0 && (
                      <img
                        src={(car.images || car.photos || [])[0]}
                        alt={car.model}
                        style={{ width: '100%', height: '100%', objectFit: 'cover', position: 'absolute', inset: 0, zIndex: 2 }}
                        onError={e => e.target.style.display = 'none'}
                      />
                    )}
                    <div style={{ position: 'absolute', top: 10, right: 10, background: (car.isAvailable !== undefined ? car.isAvailable : car.available) ? 'rgba(45,154,90,0.9)' : 'rgba(192,57,43,0.9)', color: '#fff', fontSize: '0.68rem', fontWeight: 700, padding: '3px 9px', borderRadius: 50 }}>
                      {(car.isAvailable !== undefined ? car.isAvailable : car.available) ? '✓ Disponible' : '✗ Indispo'}
                    </div>
                    {!(car.depositAmount || car.deposit) && (
                      <div style={{ position: 'absolute', top: 10, left: 10, background: 'rgba(212,160,23,0.92)', color: '#0d1f13', fontSize: '0.65rem', fontWeight: 700, padding: '3px 9px', borderRadius: 50 }}>
                        🎉 Sans caution
                      </div>
                    )}
                    <div style={{ position: 'absolute', top: 10, left: 10, background: 'rgba(0,0,0,0.5)', color: '#fff', fontSize: '0.65rem', fontWeight: 600, padding: '3px 9px', borderRadius: 50 }}>
                      ⚙️ {car.transmission}
                    </div>
                    {(car.isVerified || car.verified) && (
                      <div style={{ position: 'absolute', bottom: 10, left: 10, background: 'rgba(26,107,60,0.85)', color: '#fff', fontSize: '0.65rem', fontWeight: 700, padding: '3px 9px', borderRadius: 50 }}>
                        ✓ Vérifié
                      </div>
                    )}
                  </div>

                  {/* Body */}
                  <div style={{ padding: '1.2rem' }}>
                    <div style={{ fontSize: '0.7rem', color: '#5a7a62', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.07em', marginBottom: 3 }}>📍 {car.city}</div>
                    <div style={{ fontFamily: "'Playfair Display', serif", fontSize: '1.15rem', fontWeight: 700, color: '#0d1f13', marginBottom: 8 }}>{car.brand} {car.model}</div>

                    <div style={{ display: 'flex', flexWrap: 'wrap', gap: '6px 12px', marginBottom: 12 }}>
                      {[['⛽', car.fuel], ['👤', `${car.seats}pl`], ['🏷', car.type]].map(([icon, val]) => (
                        <span key={val} style={{ fontSize: '0.75rem', color: '#5a7a62' }}>{icon} {val}</span>
                      ))}
                    </div>

                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderTop: '1px solid #d5e8da', paddingTop: 10 }}>
                      <div>
                        <span style={{ fontFamily: "'Playfair Display', serif", fontSize: '1.25rem', fontWeight: 700, color: '#1a6b3c' }}>{fmt(car.pricePerDay || car.price)}</span>
                        <span style={{ fontSize: '0.75rem', color: '#5a7a62' }}>/j</span>
                      </div>
                      <span style={{ fontSize: '0.8rem', color: '#5a7a62' }}>
                        ★ <span style={{ color: '#d4a017', fontWeight: 700 }}>{car.rating}</span>
                        <span style={{ color: '#aaa' }}> ({car.reviews})</span>
                      </span>
                    </div>

                    <div style={{ display: 'flex', alignItems: 'center', gap: 7, marginTop: 9 }}>
                      <div style={{ width: 24, height: 24, borderRadius: '50%', background: 'linear-gradient(135deg, #1a6b3c, #2d9a5a)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#fff', fontSize: '0.65rem', fontWeight: 700 }}>
                        {(car.owner?.name || car.owner || 'P').toString().split(' ').map(n => n[0]).join('')}
                      </div>
                      <span style={{ fontSize: '0.75rem', color: '#5a7a62' }}>{car.owner?.name || 'Propriétaire'}</span>
                      {car.verified && <span style={{ fontSize: '0.65rem', color: '#1a6b3c', fontWeight: 700, marginLeft: 'auto' }}>✓</span>}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  )
}

// Composant Tag filtre actif
function Tag({ label, onRemove }) {
  return (
    <div style={{ display: 'inline-flex', alignItems: 'center', gap: 6, background: '#e8f5ee', border: '1px solid #2d9a5a', color: '#1a6b3c', borderRadius: 50, padding: '4px 12px', fontSize: '0.78rem', fontWeight: 600 }}>
      {label}
      <button onClick={onRemove} style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#1a6b3c', fontWeight: 700, fontSize: '0.85rem', padding: 0, lineHeight: 1 }}>✕</button>
    </div>
  )
}
