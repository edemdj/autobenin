import { useState, useEffect, useMemo } from 'react'
import { useNavigate, useSearchParams } from 'react-router-dom'
import { getCars } from '../services/carService'
import { ALL_CARS } from '../data/cars'

const fmt = (n) => new Intl.NumberFormat('fr-FR').format(n || 0) + ' FCFA'

const CITIES = ['Toutes les villes','Cotonou','Porto-Novo','Parakou','Abomey-Calavi','Bohicon','Natitingou','Lokossa','Ouidah']
const TYPES  = ['Tous les types','Berline','SUV','4x4','Minibus','Citadine']
const TRANS  = ['Toutes','Manuelle','Automatique']
const FUELS  = ['Tous','Essence','Diesel']
const SORTS  = [
  { value: 'price_asc',  label: '💰 Prix croissant'   },
  { value: 'price_desc', label: '💰 Prix décroissant'  },
  { value: 'newest',     label: '🆕 Plus récent'       },
  { value: 'rating',     label: '⭐ Mieux noté'        },
]

export default function Search() {
  const navigate       = useNavigate()
  const [searchParams, setSearchParams] = useSearchParams()

  // Init depuis URL params
  const [query,    setQuery]    = useState(searchParams.get('q')    || '')
  const [city,     setCity]     = useState(searchParams.get('city') || 'Toutes les villes')
  const [type,     setType]     = useState(searchParams.get('type') || 'Tous les types')
  const [trans,    setTrans]    = useState('Toutes')
  const [fuel,     setFuel]     = useState('Tous')
  const [priceMin, setPriceMin] = useState('')
  const [priceMax, setPriceMax] = useState('')
  const [seats,    setSeats]    = useState('')
  const [sort,     setSort]     = useState('price_asc')
  const [noDeposit,setNoDeposit]= useState(false)
  const [verified, setVerified] = useState(false)
  const [allCars,  setAllCars]  = useState([])
  const [loading,  setLoading]  = useState(true)
  const [view,       setView]       = useState('grid') // grid | list
  const [showFilters, setShowFilters] = useState(false) // mobile sidebar toggle

  useEffect(() => {
    getCars()
      .then(res => setAllCars(res.data?.length > 0 ? res.data : ALL_CARS))
      .catch(() => setAllCars(ALL_CARS))
      .finally(() => setLoading(false))
  }, [])

  // Sync URL params
  useEffect(() => {
    const params = {}
    if (query) params.q    = query
    if (city !== 'Toutes les villes') params.city = city
    if (type !== 'Tous les types')    params.type = type
    setSearchParams(params, { replace: true })
  }, [query, city, type])

  const results = useMemo(() => {
    let list = allCars.filter(car => {
      const avail = car.isAvailable !== undefined ? car.isAvailable : car.available
      const price = car.pricePerDay || car.price || 0
      const dep   = car.depositAmount || car.deposit || 0
      const ownerName = car.owner?.name || ''

      if (query) {
        const q = query.toLowerCase()
        const match = (
          car.brand?.toLowerCase().includes(q) ||
          car.model?.toLowerCase().includes(q) ||
          car.city?.toLowerCase().includes(q)  ||
          car.type?.toLowerCase().includes(q)  ||
          ownerName.toLowerCase().includes(q)
        )
        if (!match) return false
      }
      if (city !== 'Toutes les villes' && car.city !== city) return false
      if (type !== 'Tous les types'    && car.type !== type) return false
      if (trans !== 'Toutes'           && car.transmission !== trans) return false
      if (fuel  !== 'Tous'             && car.fuel !== fuel) return false
      if (priceMin && price < Number(priceMin)) return false
      if (priceMax && price > Number(priceMax)) return false
      if (seats && (car.seats || 5) < Number(seats)) return false
      if (noDeposit && dep > 0) return false
      if (verified  && !car.isVerified) return false
      return true
    })

    // Tri
    if (sort === 'price_asc')  list.sort((a,b) => (a.pricePerDay||a.price||0) - (b.pricePerDay||b.price||0))
    if (sort === 'price_desc') list.sort((a,b) => (b.pricePerDay||b.price||0) - (a.pricePerDay||a.price||0))
    if (sort === 'newest')     list.sort((a,b) => new Date(b.createdAt||0) - new Date(a.createdAt||0))
    if (sort === 'rating')     list.sort((a,b) => (b.rating||0) - (a.rating||0))
    return list
  }, [allCars, query, city, type, trans, fuel, priceMin, priceMax, seats, noDeposit, verified, sort])

  const resetFilters = () => {
    setQuery(''); setCity('Toutes les villes'); setType('Tous les types')
    setTrans('Toutes'); setFuel('Tous'); setPriceMin(''); setPriceMax('')
    setSeats(''); setNoDeposit(false); setVerified(false); setSort('price_asc')
  }

  const inp = { width: '100%', padding: '8px 12px', border: '1.5px solid #d5e8da', borderRadius: 8, fontSize: '0.85rem', outline: 'none', background: '#fff', fontFamily: "'DM Sans', sans-serif", boxSizing: 'border-box' }
  const lbl = { display: 'block', fontSize: '0.68rem', fontWeight: 700, color: '#5a7a62', textTransform: 'uppercase', letterSpacing: '0.07em', marginBottom: 5 }

  return (
    <div style={{ fontFamily: "'DM Sans', sans-serif", background: '#f7faf8', minHeight: '100vh', paddingTop: 68 }}>

      {/* ── HERO SEARCH BAR ── */}
      <div style={{ background: '#0d1f13', padding: '2rem 5%' }}>
        <div style={{ maxWidth: 900, margin: '0 auto' }}>
          <h1 style={{ fontFamily: "'Playfair Display', serif", fontSize: '1.8rem', fontWeight: 900, color: '#fff', margin: '0 0 16px' }}>
            🔍 Recherche avancée
          </h1>
          <div style={{ display: 'flex', gap: 10 }}>
            <input
              value={query}
              onChange={e => setQuery(e.target.value)}
              placeholder="Marque, modèle, ville, propriétaire..."
              style={{ ...inp, flex: 1, padding: '12px 16px', fontSize: '1rem', borderRadius: 12, border: 'none' }}
            />
            <select value={city} onChange={e => setCity(e.target.value)}
              style={{ ...inp, padding: '12px 16px', borderRadius: 12, border: 'none', minWidth: 160, cursor: 'pointer' }}>
              {CITIES.map(c => <option key={c}>{c}</option>)}
            </select>
          </div>
        </div>
      </div>

      {/* Mobile filter toggle button */}
      <div style={{ maxWidth: 1300, margin: '0 auto', padding: '0.8rem 5% 0' }}>
        <style>{`
          @media (min-width: 901px) { .search-sidebar-wrap { display: block !important; } .filter-toggle-btn { display: none !important; } }
          @media (max-width: 900px) { .search-layout { grid-template-columns: 1fr !important; } }
        `}</style>
        <button className="filter-toggle-btn" onClick={() => setShowFilters(f => !f)}
          style={{ display: 'none', width: '100%', padding: '12px', background: '#fff', border: '1.5px solid #d5e8da', borderRadius: 12, fontWeight: 700, fontSize: '0.9rem', cursor: 'pointer', marginBottom: 8, color: '#1a6b3c' }}>
          {showFilters ? '✕ Masquer les filtres' : `🎛 Filtres${results.length < allCars.length ? ` (${results.length} résultats)` : ''}`}
        </button>
      </div>

      <div className="search-layout" style={{ maxWidth: 1300, margin: '0 auto', padding: '0.5rem 5% 1.5rem', display: 'grid', gridTemplateColumns: '260px 1fr', gap: '1.5rem', alignItems: 'start' }}>

        {/* ── SIDEBAR FILTRES ── */}
        <div className="search-sidebar-wrap" style={{ display: showFilters ? 'block' : undefined }}>
        <div style={{ background: '#fff', borderRadius: 16, border: '1px solid #d5e8da', padding: '1.5rem', position: 'sticky', top: 80 }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.2rem' }}>
            <h3 style={{ fontFamily: "'Playfair Display', serif", fontSize: '1.1rem', fontWeight: 700, margin: 0 }}>Filtres</h3>
            <button onClick={resetFilters} style={{ background: 'none', border: 'none', color: '#c0392b', fontSize: '0.78rem', cursor: 'pointer', fontWeight: 600 }}>
              Réinitialiser
            </button>
          </div>

          {/* Type de véhicule */}
          <div style={{ marginBottom: '1.2rem' }}>
            <label style={lbl}>Type de véhicule</label>
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6 }}>
              {TYPES.map(t => (
                <button key={t} onClick={() => setType(t)} style={{ padding: '5px 12px', borderRadius: 50, border: '1.5px solid', borderColor: type===t?'#1a6b3c':'#d5e8da', background: type===t?'#1a6b3c':'#fff', color: type===t?'#fff':'#5a7a62', fontWeight: 600, fontSize: '0.78rem', cursor: 'pointer' }}>
                  {t === 'Tous les types' ? 'Tous' : t}
                </button>
              ))}
            </div>
          </div>

          {/* Boîte de vitesse */}
          <div style={{ marginBottom: '1.2rem' }}>
            <label style={lbl}>Boîte de vitesse</label>
            <div style={{ display: 'flex', gap: 6 }}>
              {TRANS.map(t => (
                <button key={t} onClick={() => setTrans(t)} style={{ flex: 1, padding: '5px 8px', borderRadius: 8, border: '1.5px solid', borderColor: trans===t?'#1a6b3c':'#d5e8da', background: trans===t?'#1a6b3c':'#fff', color: trans===t?'#fff':'#5a7a62', fontWeight: 600, fontSize: '0.75rem', cursor: 'pointer' }}>
                  {t}
                </button>
              ))}
            </div>
          </div>

          {/* Carburant */}
          <div style={{ marginBottom: '1.2rem' }}>
            <label style={lbl}>Carburant</label>
            <div style={{ display: 'flex', gap: 6 }}>
              {FUELS.map(f => (
                <button key={f} onClick={() => setFuel(f)} style={{ flex: 1, padding: '5px 8px', borderRadius: 8, border: '1.5px solid', borderColor: fuel===f?'#1a6b3c':'#d5e8da', background: fuel===f?'#1a6b3c':'#fff', color: fuel===f?'#fff':'#5a7a62', fontWeight: 600, fontSize: '0.75rem', cursor: 'pointer' }}>
                  {f}
                </button>
              ))}
            </div>
          </div>

          {/* Prix */}
          <div style={{ marginBottom: '1.2rem' }}>
            <label style={lbl}>Prix / jour (FCFA)</label>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8 }}>
              <input value={priceMin} onChange={e => setPriceMin(e.target.value)} placeholder="Min" type="number" style={inp} />
              <input value={priceMax} onChange={e => setPriceMax(e.target.value)} placeholder="Max" type="number" style={inp} />
            </div>
          </div>

          {/* Places min */}
          <div style={{ marginBottom: '1.2rem' }}>
            <label style={lbl}>Places minimum</label>
            <select value={seats} onChange={e => setSeats(e.target.value)} style={{ ...inp, cursor: 'pointer' }}>
              <option value="">Toutes</option>
              {['2','4','5','7','9'].map(s => <option key={s} value={s}>{s}+ places</option>)}
            </select>
          </div>

          {/* Options */}
          <div style={{ marginBottom: '1.2rem' }}>
            <label style={lbl}>Options</label>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
              {[
                [noDeposit,  setNoDeposit, '🎉 Sans caution uniquement'],
                [verified,   setVerified,  '✓ Voitures vérifiées uniquement'],
              ].map(([val, setter, label]) => (
                <label key={label} style={{ display: 'flex', alignItems: 'center', gap: 8, cursor: 'pointer', fontSize: '0.85rem', color: '#0d1f13' }}>
                  <input type="checkbox" checked={val} onChange={e => setter(e.target.checked)}
                    style={{ width: 16, height: 16, cursor: 'pointer', accentColor: '#1a6b3c' }} />
                  {label}
                </label>
              ))}
            </div>
          </div>

          {/* Résultats count */}
          <div style={{ background: '#f7faf8', border: '1px solid #d5e8da', borderRadius: 10, padding: '10px', textAlign: 'center', fontSize: '0.85rem', color: '#5a7a62' }}>
            <strong style={{ color: '#1a6b3c', fontSize: '1.1rem' }}>{results.length}</strong> voiture{results.length > 1 ? 's' : ''} trouvée{results.length > 1 ? 's' : ''}
          </div>
        </div>
        </div>

        {/* ── RÉSULTATS ── */}
        <div>
          {/* Barre tri + vue */}
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem', flexWrap: 'wrap', gap: 10 }}>
            <div style={{ fontSize: '0.85rem', color: '#5a7a62' }}>
              {loading ? 'Chargement...' : `${results.length} résultat${results.length > 1 ? 's' : ''}`}
              {query && <span> pour <strong>"{query}"</strong></span>}
            </div>
            <div style={{ display: 'flex', gap: 10, alignItems: 'center' }}>
              <select value={sort} onChange={e => setSort(e.target.value)} style={{ ...inp, width: 'auto', padding: '7px 12px', cursor: 'pointer' }}>
                {SORTS.map(s => <option key={s.value} value={s.value}>{s.label}</option>)}
              </select>
              <div style={{ display: 'flex', gap: 4 }}>
                {[['grid','▦'],['list','☰']].map(([v, icon]) => (
                  <button key={v} onClick={() => setView(v)} style={{ width: 34, height: 34, borderRadius: 8, border: '1.5px solid', borderColor: view===v?'#1a6b3c':'#d5e8da', background: view===v?'#1a6b3c':'#fff', color: view===v?'#fff':'#5a7a62', cursor: 'pointer', fontSize: '1rem', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                    {icon}
                  </button>
                ))}
              </div>
            </div>
          </div>

          {loading ? (
            <div style={{ textAlign: 'center', padding: '4rem', color: '#5a7a62' }}>
              <div style={{ fontSize: '2rem', marginBottom: 12 }}>⏳</div>
              <p>Chargement des voitures...</p>
            </div>
          ) : results.length === 0 ? (
            <div style={{ textAlign: 'center', padding: '4rem', background: '#fff', borderRadius: 16, border: '1px solid #d5e8da' }}>
              <div style={{ fontSize: '3rem', marginBottom: 16 }}>🔍</div>
              <h3 style={{ fontFamily: "'Playfair Display', serif", fontWeight: 700, marginBottom: 8 }}>Aucun résultat</h3>
              <p style={{ color: '#5a7a62', marginBottom: 20 }}>Essaie d'élargir ta recherche ou de changer les filtres.</p>
              <button onClick={resetFilters} style={{ background: '#1a6b3c', color: '#fff', border: 'none', borderRadius: 12, padding: '10px 24px', fontWeight: 700, cursor: 'pointer' }}>
                Réinitialiser les filtres
              </button>
            </div>
          ) : view === 'grid' ? (
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', gap: '1.2rem' }}>
              {results.map(car => <CarCard key={car._id||car.id} car={car} navigate={navigate} />)}
            </div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.8rem' }}>
              {results.map(car => <CarRow key={car._id||car.id} car={car} navigate={navigate} />)}
            </div>
          )}
        </div>
      </div>
    </div>
  )
}

function CarCard({ car, navigate }) {
  const price   = car.pricePerDay || car.price || 0
  const deposit = car.depositAmount || car.deposit || 0
  const avail   = car.isAvailable !== false

  return (
    <div onClick={() => navigate('/cars/' + (car._id || car.id))}
      style={{ background: '#fff', borderRadius: 16, border: '1px solid #d5e8da', overflow: 'hidden', cursor: 'pointer', transition: 'all 0.2s' }}
      onMouseEnter={e => { e.currentTarget.style.transform = 'translateY(-4px)'; e.currentTarget.style.boxShadow = '0 12px 40px rgba(26,107,60,0.12)' }}
      onMouseLeave={e => { e.currentTarget.style.transform = 'none'; e.currentTarget.style.boxShadow = 'none' }}>

      {/* Image */}
      <div style={{ height: 160, background: 'linear-gradient(135deg,#1a3d25,#040e07)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '3.5rem', position: 'relative', overflow: 'hidden' }}>
        <span style={{ position: 'relative', zIndex: 1 }}>{car.emoji || '🚗'}</span>
        {(car.images||car.photos||[])[0] && <img src={(car.images||car.photos)[0]} style={{ position: 'absolute', inset: 0, width: '100%', height: '100%', objectFit: 'cover', zIndex: 2 }} onError={e => e.target.style.display='none'} />}
        <div style={{ position: 'absolute', top: 8, right: 8, zIndex: 3, background: avail?'rgba(45,154,90,0.9)':'rgba(192,57,43,0.9)', color: '#fff', fontSize: '0.65rem', fontWeight: 700, padding: '2px 8px', borderRadius: 50 }}>
          {avail ? '✓ Disponible' : '✗ Indispo'}
        </div>
        {!deposit && <div style={{ position: 'absolute', top: 8, left: 8, zIndex: 3, background: 'rgba(212,160,23,0.92)', color: '#0d1f13', fontSize: '0.65rem', fontWeight: 700, padding: '2px 8px', borderRadius: 50 }}>🎉 Sans caution</div>}
        {car.isVerified && <div style={{ position: 'absolute', bottom: 8, left: 8, zIndex: 3, background: 'rgba(26,107,60,0.85)', color: '#fff', fontSize: '0.65rem', fontWeight: 700, padding: '2px 8px', borderRadius: 50 }}>✓ Vérifié</div>}
      </div>

      {/* Infos */}
      <div style={{ padding: '1rem' }}>
        <div style={{ fontSize: '0.7rem', color: '#5a7a62', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.07em', marginBottom: 3 }}>📍 {car.city}</div>
        <h3 style={{ fontFamily: "'Playfair Display', serif", fontSize: '1.05rem', fontWeight: 700, color: '#0d1f13', margin: '0 0 8px' }}>{car.brand} {car.model}</h3>
        <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap', marginBottom: 10 }}>
          {[['⛽', car.fuel], ['👤', `${car.seats||5} places`], ['⚙️', car.transmission]].map(([icon, val]) => (
            <span key={val} style={{ fontSize: '0.75rem', color: '#5a7a62' }}>{icon} {val}</span>
          ))}
        </div>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderTop: '1px solid #f0f0f0', paddingTop: 8 }}>
          <div>
            <span style={{ fontFamily: "'Playfair Display', serif", fontSize: '1.15rem', fontWeight: 700, color: '#1a6b3c' }}>{fmt(price)}</span>
            <span style={{ fontSize: '0.72rem', color: '#5a7a62' }}>/jour</span>
          </div>
          <div style={{ fontSize: '0.72rem', color: deposit ? '#5a7a62' : '#d4a017', fontWeight: deposit ? 400 : 700 }}>
            {deposit ? `Caution: ${fmt(deposit)}` : '🎉 Sans caution'}
          </div>
        </div>
      </div>
    </div>
  )
}

function CarRow({ car, navigate }) {
  const price   = car.pricePerDay || car.price || 0
  const deposit = car.depositAmount || car.deposit || 0
  const avail   = car.isAvailable !== false

  return (
    <div onClick={() => navigate('/cars/' + (car._id || car.id))}
      style={{ background: '#fff', borderRadius: 14, border: '1px solid #d5e8da', display: 'flex', gap: 16, overflow: 'hidden', cursor: 'pointer', transition: 'all 0.2s' }}
      onMouseEnter={e => e.currentTarget.style.boxShadow = '0 6px 24px rgba(26,107,60,0.1)'}
      onMouseLeave={e => e.currentTarget.style.boxShadow = 'none'}>

      {/* Image */}
      <div style={{ width: 140, flexShrink: 0, background: 'linear-gradient(135deg,#1a3d25,#040e07)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '2.5rem', position: 'relative', overflow: 'hidden' }}>
        <span style={{ position: 'relative', zIndex: 1 }}>{car.emoji || '🚗'}</span>
        {(car.images||car.photos||[])[0] && <img src={(car.images||car.photos)[0]} style={{ position: 'absolute', inset: 0, width: '100%', height: '100%', objectFit: 'cover', zIndex: 2 }} onError={e => e.target.style.display='none'} />}
      </div>

      {/* Infos */}
      <div style={{ flex: 1, padding: '1rem', display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 12 }}>
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 4 }}>
            <h3 style={{ fontFamily: "'Playfair Display', serif", fontSize: '1rem', fontWeight: 700, color: '#0d1f13', margin: 0 }}>{car.brand} {car.model}</h3>
            {car.isVerified && <span style={{ background: '#e8f5ee', color: '#1a6b3c', fontSize: '0.65rem', fontWeight: 700, padding: '1px 7px', borderRadius: 50 }}>✓ Vérifié</span>}
            {!deposit && <span style={{ background: '#fef9e7', color: '#b8860b', fontSize: '0.65rem', fontWeight: 700, padding: '1px 7px', borderRadius: 50 }}>🎉 Sans caution</span>}
            <span style={{ background: avail?'#e8f5ee':'#fdecea', color: avail?'#1a6b3c':'#c0392b', fontSize: '0.65rem', fontWeight: 700, padding: '1px 7px', borderRadius: 50 }}>{avail?'✓ Dispo':'✗ Indispo'}</span>
          </div>
          <div style={{ fontSize: '0.78rem', color: '#5a7a62', marginBottom: 4 }}>📍 {car.city} · {car.type}</div>
          <div style={{ display: 'flex', gap: 12 }}>
            {[['⛽', car.fuel], ['👤', `${car.seats||5} places`], ['⚙️', car.transmission]].map(([icon, val]) => (
              <span key={val} style={{ fontSize: '0.75rem', color: '#5a7a62' }}>{icon} {val}</span>
            ))}
          </div>
        </div>
        <div style={{ textAlign: 'right' }}>
          <div style={{ fontFamily: "'Playfair Display', serif", fontSize: '1.2rem', fontWeight: 700, color: '#1a6b3c' }}>{fmt(price)}<span style={{ fontFamily: "'DM Sans', sans-serif", fontSize: '0.72rem', color: '#5a7a62', fontWeight: 400 }}>/jour</span></div>
          <div style={{ fontSize: '0.72rem', color: deposit?'#5a7a62':'#d4a017', fontWeight: deposit?400:700 }}>{deposit ? `Caution: ${fmt(deposit)}` : '🎉 Sans caution'}</div>
        </div>
      </div>
    </div>
  )
}
