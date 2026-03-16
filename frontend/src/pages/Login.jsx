import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import { login as loginApi } from '../services/authService'

export default function Login() {
  const navigate  = useNavigate()
  const { login } = useAuth()

  const [form,    setForm]    = useState({ email: '', password: '' })
  const [error,   setError]   = useState('')
  const [loading, setLoading] = useState(false)
  const [showPw,  setShowPw]  = useState(false)

  const handleSubmit = async () => {
    setError('')
    if (!form.email || !form.password) { setError('Remplis tous les champs.'); return }
    setLoading(true)
    try {
      const res = await loginApi({ email: form.email, password: form.password })
      await login(res.data.user, res.data.token)
      // Récupérer le vrai rôle depuis l'API
      const meRes = await import('../services/api').then(m => m.default.get('/auth/me'))
      const role = meRes.data.role
      if (role === 'admin')       navigate('/admin')
      else if (role === 'owner')  navigate('/dashboard')
      else                        navigate('/')
    } catch (err) {
      setError(err.response?.data?.message || 'Email ou mot de passe incorrect.')
    } finally {
      setLoading(false)
    }
  }

  const inp = (hasErr) => ({
    width: '100%', padding: '12px 14px',
    border: `1.5px solid ${hasErr ? '#e74c3c' : '#d5e8da'}`,
    borderRadius: 12, fontSize: '0.95rem', outline: 'none',
    boxSizing: 'border-box', fontFamily: "'DM Sans', sans-serif",
    transition: 'border-color 0.2s',
  })
  const lbl = { display: 'block', fontSize: '0.72rem', fontWeight: 700, color: '#5a7a62', textTransform: 'uppercase', letterSpacing: '0.07em', marginBottom: 6 }

  return (
    <div style={{ fontFamily: "'DM Sans', sans-serif", background: '#0d1f13', minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '1rem', paddingTop: 68 }}>

      {/* Glow décoratif */}
      <div style={{ position: 'fixed', width: 500, height: 500, borderRadius: '50%', background: 'radial-gradient(circle, rgba(26,107,60,0.35) 0%, transparent 70%)', top: -150, right: -100, pointerEvents: 'none' }}/>
      <div style={{ position: 'fixed', width: 350, height: 350, borderRadius: '50%', background: 'radial-gradient(circle, rgba(212,160,23,0.12) 0%, transparent 70%)', bottom: -80, left: '5%', pointerEvents: 'none' }}/>

      <div style={{ width: '100%', maxWidth: 440, position: 'relative', zIndex: 1 }}>

        {/* Logo */}
        <div style={{ textAlign: 'center', marginBottom: '2rem' }}>
          <Link to="/" style={{ textDecoration: 'none' }}>
            <span style={{ fontFamily: "'Playfair Display', serif", fontSize: '2rem', fontWeight: 900, color: '#fff' }}>
              Auto<span style={{ color: '#d4a017' }}>Bénin</span>
            </span>
          </Link>
          <p style={{ color: 'rgba(255,255,255,0.45)', fontSize: '0.85rem', marginTop: 6 }}>
            Connecte-toi à ton compte
          </p>
        </div>

        {/* Card */}
        <div style={{ background: '#fff', borderRadius: 24, padding: '2.5rem', boxShadow: '0 24px 60px rgba(0,0,0,0.3)' }}>

          <h2 style={{ fontFamily: "'Playfair Display', serif", fontSize: '1.6rem', fontWeight: 900, marginBottom: '0.3rem', color: '#0d1f13' }}>
            Connexion
          </h2>
          <p style={{ color: '#5a7a62', fontSize: '0.88rem', marginBottom: '1.8rem' }}>
            Pas encore de compte ?{' '}
            <Link to="/register" style={{ color: '#1a6b3c', fontWeight: 700, textDecoration: 'none' }}>Créer un compte</Link>
          </p>

          {/* Erreur */}
          {error && (
            <div style={{ background: '#fdecea', border: '1px solid #e74c3c', borderRadius: 10, padding: '10px 14px', color: '#c0392b', fontSize: '0.85rem', fontWeight: 600, marginBottom: '1.2rem' }}>
              ⚠️ {error}
            </div>
          )}

          {/* Email */}
          <div style={{ marginBottom: 16 }}>
            <label style={lbl}>Email</label>
            <input
              type="email"
              placeholder="koffi@gmail.com"
              value={form.email}
              onChange={e => setForm(f => ({ ...f, email: e.target.value }))}
              onKeyDown={e => e.key === 'Enter' && handleSubmit()}
              style={inp(false)}
            />
          </div>

          {/* Mot de passe */}
          <div style={{ marginBottom: '1.5rem', position: 'relative' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 6 }}>
              <label style={{ ...lbl, marginBottom: 0 }}>Mot de passe</label>
              <span style={{ fontSize: '0.78rem', color: '#1a6b3c', fontWeight: 600, cursor: 'pointer' }}>
                Mot de passe oublié ?
              </span>
            </div>
            <div style={{ position: 'relative' }}>
              <input
                type={showPw ? 'text' : 'password'}
                placeholder="••••••••"
                value={form.password}
                onChange={e => setForm(f => ({ ...f, password: e.target.value }))}
                onKeyDown={e => e.key === 'Enter' && handleSubmit()}
                style={{ ...inp(false), paddingRight: 44 }}
              />
              <button
                onClick={() => setShowPw(v => !v)}
                style={{ position: 'absolute', right: 12, top: '50%', transform: 'translateY(-50%)', background: 'none', border: 'none', cursor: 'pointer', color: '#5a7a62', fontSize: '1rem' }}>
                {showPw ? '🙈' : '👁'}
              </button>
            </div>
          </div>

          {/* Bouton */}
          <button
            onClick={handleSubmit}
            disabled={loading}
            style={{
              width: '100%', background: loading ? '#aaa' : '#1a6b3c',
              color: '#fff', border: 'none', borderRadius: 12,
              padding: '14px', fontWeight: 700, fontSize: '1rem',
              cursor: loading ? 'not-allowed' : 'pointer',
              fontFamily: "'DM Sans', sans-serif", marginBottom: '1.2rem',
              transition: 'background 0.2s',
            }}>
            {loading ? '⏳ Connexion...' : '🔐 Se connecter'}
          </button>

          {/* Séparateur */}
          <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: '1.2rem' }}>
            <div style={{ flex: 1, height: 1, background: '#d5e8da' }}/>
            <span style={{ fontSize: '0.78rem', color: '#5a7a62' }}>ou continuer avec</span>
            <div style={{ flex: 1, height: 1, background: '#d5e8da' }}/>
          </div>

          {/* Mobile Money login */}
          <button style={{
            width: '100%', background: '#f7faf8',
            border: '1.5px solid #d5e8da', borderRadius: 12,
            padding: '12px', fontWeight: 600, fontSize: '0.9rem',
            cursor: 'pointer', color: '#1a2e1e',
            fontFamily: "'DM Sans', sans-serif",
            display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8,
          }}>
            📱 Connexion via numéro de téléphone
          </button>
        </div>

        {/* Footer */}
        {/* Lien admin discret */}
        <p style={{ textAlign: 'center', marginTop: '1rem' }}>
          <span style={{ color: 'rgba(255,255,255,0.25)', fontSize: '0.72rem' }}>Administration ? </span>
          <a href='/admin' style={{ color: 'rgba(212,160,23,0.5)', fontSize: '0.72rem', textDecoration: 'none' }}>🛡 Accès admin</a>
        </p>

        <p style={{ textAlign: 'center', color: 'rgba(255,255,255,0.35)', fontSize: '0.78rem', marginTop: '0.5rem' }}>
          En te connectant, tu acceptes nos{' '}
          <span style={{ color: 'rgba(255,255,255,0.6)', cursor: 'pointer' }}>Conditions d'utilisation</span>
        </p>
      </div>
    </div>
  )
}
