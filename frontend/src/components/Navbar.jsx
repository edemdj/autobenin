import { useState } from 'react'
import { Link, useLocation, useNavigate } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'

export default function Navbar() {
  const { user, logout } = useAuth()
  const location = useLocation()
  const navigate  = useNavigate()
  const [menuOpen, setMenuOpen] = useState(false)

  const handleLogout = () => { logout(); navigate('/'); setMenuOpen(false) }
  const isActive = (path) => location.pathname === path

  return (
    <nav style={{
      position: 'fixed', top: 0, left: 0, right: 0, zIndex: 1000,
      background: 'rgba(13,31,19,0.97)',
      backdropFilter: 'blur(12px)',
      borderBottom: '1px solid rgba(212,160,23,0.12)',
      height: 68,
    }}>
      <div style={{ maxWidth: 1400, margin: '0 auto', padding: '0 5%', height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>

        {/* Logo */}
        <Link to="/" onClick={() => setMenuOpen(false)} style={{ textDecoration: 'none', display: 'flex', alignItems: 'center', gap: 2, flexShrink: 0 }}>
          <span style={{ fontFamily: "'Playfair Display', serif", fontSize: '1.5rem', fontWeight: 900, color: '#fff' }}>Auto</span>
          <span style={{ fontFamily: "'Playfair Display', serif", fontSize: '1.5rem', fontWeight: 900, color: '#d4a017' }}>Bénin</span>
        </Link>

        {/* Desktop nav */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '1.8rem' }} className="desktop-nav">
          <style>{`
            @media (max-width: 768px) { .desktop-nav { display: none !important; } .mobile-menu-btn { display: flex !important; } }
            @media (min-width: 769px) { .mobile-menu-btn { display: none !important; } .mobile-menu { display: none !important; } }
          `}</style>

          {[['/', 'Accueil'], ['/cars', 'Voitures'], ['/search', '🔍 Recherche']].map(([path, label]) => (
            <Link key={path} to={path} style={{
              color: isActive(path) ? '#d4a017' : 'rgba(255,255,255,0.75)',
              textDecoration: 'none', fontSize: '0.88rem', fontWeight: isActive(path) ? 700 : 500,
              transition: 'color 0.2s',
            }}>{label}</Link>
          ))}

          {user ? (
            <>
              <Link to="/dashboard" style={{ color: 'rgba(255,255,255,0.75)', textDecoration: 'none', fontSize: '0.88rem', fontWeight: 500 }}>
                👤 {user.name?.split(' ')[0]}
              </Link>
              {user.role === 'admin' && (
                <Link to="/admin" style={{ color: '#d4a017', textDecoration: 'none', fontSize: '0.88rem', fontWeight: 700 }}>🛡 Admin</Link>
              )}
              {(user.role === 'admin' || user.role === 'owner') && (
                <Link to="/finance" style={{ color: '#d4a017', textDecoration: 'none', fontSize: '0.88rem', fontWeight: 700 }}>💰 Finance</Link>
              )}
              <button onClick={handleLogout} style={{ background: 'rgba(255,255,255,0.1)', border: '1px solid rgba(255,255,255,0.2)', color: '#fff', padding: '8px 18px', borderRadius: 50, fontSize: '0.85rem', fontWeight: 600, cursor: 'pointer' }}>
                Déconnexion
              </button>
            </>
          ) : (
            <>
              <Link to="/login" style={{ color: 'rgba(255,255,255,0.75)', textDecoration: 'none', fontSize: '0.88rem', fontWeight: 500 }}>Connexion</Link>
              <Link to="/register" style={{ background: '#1a6b3c', color: '#fff', padding: '9px 20px', borderRadius: 50, fontSize: '0.85rem', fontWeight: 700, textDecoration: 'none' }}>
                S'inscrire
              </Link>
            </>
          )}
        </div>

        {/* Burger button mobile */}
        <button
          className="mobile-menu-btn"
          onClick={() => setMenuOpen(o => !o)}
          style={{ background: 'none', border: 'none', cursor: 'pointer', padding: 8, display: 'flex', flexDirection: 'column', gap: 5, alignItems: 'center', justifyContent: 'center' }}
        >
          <span style={{ display: 'block', width: 24, height: 2, background: menuOpen ? '#d4a017' : '#fff', transition: 'all 0.3s', transform: menuOpen ? 'rotate(45deg) translate(5px, 5px)' : 'none' }} />
          <span style={{ display: 'block', width: 24, height: 2, background: '#fff', transition: 'all 0.3s', opacity: menuOpen ? 0 : 1 }} />
          <span style={{ display: 'block', width: 24, height: 2, background: menuOpen ? '#d4a017' : '#fff', transition: 'all 0.3s', transform: menuOpen ? 'rotate(-45deg) translate(5px, -5px)' : 'none' }} />
        </button>
      </div>

      {/* Mobile menu */}
      <div className="mobile-menu" style={{
        position: 'absolute', top: 68, left: 0, right: 0,
        background: 'rgba(13,31,19,0.99)',
        borderBottom: '1px solid rgba(212,160,23,0.2)',
        padding: menuOpen ? '1.5rem 5%' : '0 5%',
        maxHeight: menuOpen ? '100vh' : 0,
        overflow: 'hidden',
        transition: 'all 0.3s ease',
        display: 'flex', flexDirection: 'column', gap: menuOpen ? 16 : 0,
      }}>
        {[
          ['/', 'Accueil'],
          ['/cars', '🚗 Voitures'],
          ['/search', '🔍 Recherche avancée'],
        ].map(([path, label]) => (
          <Link key={path} to={path} onClick={() => setMenuOpen(false)} style={{ color: isActive(path) ? '#d4a017' : 'rgba(255,255,255,0.85)', textDecoration: 'none', fontSize: '1rem', fontWeight: isActive(path) ? 700 : 400, padding: '4px 0', borderBottom: '1px solid rgba(255,255,255,0.05)' }}>
            {label}
          </Link>
        ))}

        {user ? (
          <>
            <div style={{ borderTop: '1px solid rgba(255,255,255,0.1)', paddingTop: 12, display: 'flex', flexDirection: 'column', gap: 12 }}>
              <span style={{ color: 'rgba(255,255,255,0.4)', fontSize: '0.72rem', textTransform: 'uppercase', letterSpacing: '0.1em' }}>Mon compte</span>
              <Link to="/profile"   onClick={() => setMenuOpen(false)} style={{ color: 'rgba(255,255,255,0.85)', textDecoration: 'none', fontSize: '1rem' }}>👤 {user.name}</Link>
              {(user.role === 'owner' || user.role === 'admin') && (
                <Link to="/dashboard" onClick={() => setMenuOpen(false)} style={{ color: 'rgba(255,255,255,0.85)', textDecoration: 'none', fontSize: '1rem' }}>🚗 Mon dashboard</Link>
              )}
              {(user.role === 'owner' || user.role === 'admin') && (
                <Link to="/finance"   onClick={() => setMenuOpen(false)} style={{ color: '#d4a017', textDecoration: 'none', fontSize: '1rem', fontWeight: 700 }}>💰 Finance</Link>
              )}
              {user.role === 'admin' && (
                <Link to="/admin"     onClick={() => setMenuOpen(false)} style={{ color: '#d4a017', textDecoration: 'none', fontSize: '1rem', fontWeight: 700 }}>🛡 Administration</Link>
              )}
              <button onClick={handleLogout} style={{ background: '#fdecea', border: 'none', color: '#c0392b', padding: '12px', borderRadius: 10, fontWeight: 700, cursor: 'pointer', textAlign: 'left', fontSize: '0.95rem', marginTop: 4 }}>
                Déconnexion
              </button>
            </div>
          </>
        ) : (
          <div style={{ borderTop: '1px solid rgba(255,255,255,0.1)', paddingTop: 12, display: 'flex', flexDirection: 'column', gap: 10 }}>
            <Link to="/login"    onClick={() => setMenuOpen(false)} style={{ color: 'rgba(255,255,255,0.85)', textDecoration: 'none', fontSize: '1rem', padding: '10px', background: 'rgba(255,255,255,0.05)', borderRadius: 10, textAlign: 'center' }}>Connexion</Link>
            <Link to="/register" onClick={() => setMenuOpen(false)} style={{ background: '#1a6b3c', color: '#fff', textDecoration: 'none', fontSize: '1rem', fontWeight: 700, padding: '12px', borderRadius: 10, textAlign: 'center' }}>S'inscrire</Link>
          </div>
        )}
      </div>
    </nav>
  )
}
