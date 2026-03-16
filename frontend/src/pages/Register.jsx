import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import { register as registerApi } from '../services/authService'

const CITIES = ['Cotonou', 'Porto-Novo', 'Parakou', 'Abomey-Calavi', 'Bohicon', 'Natitingou']

export default function Register() {
  const navigate  = useNavigate()
  const { login } = useAuth()

  const [step,    setStep]    = useState(1) // 1 = infos, 2 = rôle, 3 = documents
  const [loading, setLoading] = useState(false)
  const [showPw,  setShowPw]  = useState(false)
  const [errors,  setErrors]  = useState({})
  const [form,    setForm]    = useState({
    name: '', email: '', phone: '', city: 'Cotonou',
    password: '', confirm: '', role: '',
    license: null, idCard: null,
  })

  const set = (k, v) => setForm(f => ({ ...f, [k]: v }))

  const validateStep1 = () => {
    const e = {}
    if (!form.name)                               e.name     = 'Requis'
    if (!form.email || !form.email.includes('@')) e.email    = 'Email invalide'
    if (!form.phone)                              e.phone    = 'Requis'
    if (!form.password || form.password.length < 6) e.password = 'Minimum 6 caractères'
    if (form.password !== form.confirm)           e.confirm  = 'Les mots de passe ne correspondent pas'
    setErrors(e)
    return Object.keys(e).length === 0
  }

  const validateStep2 = () => {
    if (!form.role) { setErrors({ role: 'Choisis un rôle' }); return false }
    return true
  }

  const handleNext = () => {
    if (step === 1 && validateStep1()) { setErrors({}); setStep(2) }
    if (step === 2 && validateStep2()) { setErrors({}); setStep(3) }
  }

  const handleSubmit = async () => {
    setLoading(true)
    try {
      const res = await registerApi({
        name:     form.name,
        email:    form.email,
        phone:    form.phone,
        city:     form.city,
        password: form.password,
        role:     form.role,
      })
      login(res.data.user, res.data.token)
      navigate(res.data.user.role === 'owner' ? '/dashboard' : '/')
    } catch (err) {
      setErrors({ submit: err.response?.data?.message || 'Erreur lors de la création du compte.' })
      setStep(1)
    } finally {
      setLoading(false)
    }
  }

  const inp = (key) => ({
    width: '100%', padding: '12px 14px',
    border: `1.5px solid ${errors[key] ? '#e74c3c' : '#d5e8da'}`,
    borderRadius: 12, fontSize: '0.95rem', outline: 'none',
    boxSizing: 'border-box', fontFamily: "'DM Sans', sans-serif",
    transition: 'border-color 0.2s',
  })
  const lbl = { display: 'block', fontSize: '0.72rem', fontWeight: 700, color: '#5a7a62', textTransform: 'uppercase', letterSpacing: '0.07em', marginBottom: 6 }
  const err = (key) => errors[key] && <div style={{ color: '#e74c3c', fontSize: '0.75rem', marginTop: 4 }}>⚠️ {errors[key]}</div>

  return (
    <div style={{ fontFamily: "'DM Sans', sans-serif", background: '#0d1f13', minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '1rem', paddingTop: 88 }}>

      <div style={{ position: 'fixed', width: 500, height: 500, borderRadius: '50%', background: 'radial-gradient(circle, rgba(26,107,60,0.35) 0%, transparent 70%)', top: -150, right: -100, pointerEvents: 'none' }}/>
      <div style={{ position: 'fixed', width: 350, height: 350, borderRadius: '50%', background: 'radial-gradient(circle, rgba(212,160,23,0.12) 0%, transparent 70%)', bottom: -80, left: '5%', pointerEvents: 'none' }}/>

      <div style={{ width: '100%', maxWidth: 480, position: 'relative', zIndex: 1 }}>

        {/* Logo */}
        <div style={{ textAlign: 'center', marginBottom: '1.5rem' }}>
          <Link to="/" style={{ textDecoration: 'none' }}>
            <span style={{ fontFamily: "'Playfair Display', serif", fontSize: '2rem', fontWeight: 900, color: '#fff' }}>
              Auto<span style={{ color: '#d4a017' }}>Bénin</span>
            </span>
          </Link>
        </div>

        {/* Stepper */}
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 0, marginBottom: '1.5rem' }}>
          {[1,2,3].map((s, i) => (
            <div key={s} style={{ display: 'flex', alignItems: 'center' }}>
              <div style={{
                width: 32, height: 32, borderRadius: '50%',
                background: step >= s ? '#d4a017' : 'rgba(255,255,255,0.1)',
                border: `2px solid ${step >= s ? '#d4a017' : 'rgba(255,255,255,0.2)'}`,
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                fontSize: '0.8rem', fontWeight: 700,
                color: step >= s ? '#0d1f13' : 'rgba(255,255,255,0.4)',
                transition: 'all 0.3s',
              }}>
                {step > s ? '✓' : s}
              </div>
              {i < 2 && <div style={{ width: 48, height: 2, background: step > s ? '#d4a017' : 'rgba(255,255,255,0.15)', transition: 'background 0.3s' }}/>}
            </div>
          ))}
        </div>
        <div style={{ display: 'flex', justifyContent: 'space-around', marginBottom: '1.5rem' }}>
          {['Infos', 'Rôle', 'Documents'].map((l, i) => (
            <span key={l} style={{ fontSize: '0.72rem', color: step >= i+1 ? '#d4a017' : 'rgba(255,255,255,0.3)', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.06em' }}>{l}</span>
          ))}
        </div>

        {/* Card */}
        <div style={{ background: '#fff', borderRadius: 24, padding: '2.5rem', boxShadow: '0 24px 60px rgba(0,0,0,0.3)' }}>

          {/* ── ÉTAPE 1 : Infos personnelles ── */}
          {step === 1 && (
            <>
              <h2 style={{ fontFamily: "'Playfair Display', serif", fontSize: '1.5rem', fontWeight: 900, marginBottom: '0.3rem', color: '#0d1f13' }}>Créer un compte</h2>
              <p style={{ color: '#5a7a62', fontSize: '0.88rem', marginBottom: '1.8rem' }}>
                Déjà un compte ?{' '}
                <Link to="/login" style={{ color: '#1a6b3c', fontWeight: 700, textDecoration: 'none' }}>Se connecter</Link>
              </p>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 14, marginBottom: 14 }}>
                <div>
                  <label style={lbl}>Nom complet</label>
                  <input placeholder="Koffi Adjovi" value={form.name} onChange={e => set('name', e.target.value)} style={inp('name')} />
                  {err('name')}
                </div>
                <div>
                  <label style={lbl}>Ville</label>
                  <select value={form.city} onChange={e => set('city', e.target.value)} style={{ ...inp('city'), cursor: 'pointer', background: '#fff' }}>
                    {CITIES.map(c => <option key={c}>{c}</option>)}
                  </select>
                </div>
              </div>

              <div style={{ marginBottom: 14 }}>
                <label style={lbl}>Email</label>
                <input type="email" placeholder="koffi@gmail.com" value={form.email} onChange={e => set('email', e.target.value)} style={inp('email')} />
                {err('email')}
              </div>

              <div style={{ marginBottom: 14 }}>
                <label style={lbl}>Téléphone</label>
                <input type="tel" placeholder="+229 97 XX XX XX" value={form.phone} onChange={e => set('phone', e.target.value)} style={inp('phone')} />
                {err('phone')}
              </div>

              <div style={{ marginBottom: 14, position: 'relative' }}>
                <label style={lbl}>Mot de passe</label>
                <div style={{ position: 'relative' }}>
                  <input type={showPw ? 'text' : 'password'} placeholder="Minimum 6 caractères" value={form.password} onChange={e => set('password', e.target.value)} style={{ ...inp('password'), paddingRight: 44 }} />
                  <button onClick={() => setShowPw(v => !v)} style={{ position: 'absolute', right: 12, top: '50%', transform: 'translateY(-50%)', background: 'none', border: 'none', cursor: 'pointer', color: '#5a7a62' }}>
                    {showPw ? '🙈' : '👁'}
                  </button>
                </div>
                {err('password')}
              </div>

              <div style={{ marginBottom: '1.5rem' }}>
                <label style={lbl}>Confirmer le mot de passe</label>
                <input type="password" placeholder="Répéter le mot de passe" value={form.confirm} onChange={e => set('confirm', e.target.value)} style={inp('confirm')} />
                {err('confirm')}
              </div>

              <button onClick={handleNext} style={{ width: '100%', background: '#1a6b3c', color: '#fff', border: 'none', borderRadius: 12, padding: '14px', fontWeight: 700, fontSize: '1rem', cursor: 'pointer', fontFamily: "'DM Sans', sans-serif" }}>
                Continuer →
              </button>
            </>
          )}

          {/* ── ÉTAPE 2 : Choix du rôle ── */}
          {step === 2 && (
            <>
              <h2 style={{ fontFamily: "'Playfair Display', serif", fontSize: '1.5rem', fontWeight: 900, marginBottom: '0.3rem', color: '#0d1f13' }}>Tu es ?</h2>
              <p style={{ color: '#5a7a62', fontSize: '0.88rem', marginBottom: '1.8rem' }}>Tu pourras changer de rôle plus tard dans ton profil.</p>

              {errors.role && <div style={{ color: '#e74c3c', fontSize: '0.85rem', marginBottom: '1rem' }}>⚠️ {errors.role}</div>}

              <div style={{ display: 'flex', flexDirection: 'column', gap: 14, marginBottom: '2rem' }}>
                {[
                  { role: 'renter', icon: '🔑', title: 'Locataire', desc: 'Je veux louer des voitures pour mes déplacements.' },
                  { role: 'owner',  icon: '🚗', title: 'Propriétaire', desc: 'Je veux mettre ma voiture en location et gagner un revenu.' },
                ].map(({ role, icon, title, desc }) => (
                  <div key={role} onClick={() => set('role', role)} style={{
                    border: `2px solid ${form.role === role ? '#1a6b3c' : '#d5e8da'}`,
                    background: form.role === role ? '#e8f5ee' : '#fff',
                    borderRadius: 16, padding: '1.2rem 1.4rem',
                    cursor: 'pointer', transition: 'all 0.2s',
                    display: 'flex', alignItems: 'center', gap: 14,
                  }}>
                    <div style={{ width: 52, height: 52, borderRadius: 14, background: form.role === role ? '#1a6b3c' : '#f7faf8', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '1.6rem', flexShrink: 0 }}>
                      {icon}
                    </div>
                    <div>
                      <div style={{ fontWeight: 700, fontSize: '1rem', color: form.role === role ? '#1a6b3c' : '#0d1f13', marginBottom: 3 }}>{title}</div>
                      <div style={{ fontSize: '0.83rem', color: '#5a7a62' }}>{desc}</div>
                    </div>
                    <div style={{ marginLeft: 'auto', width: 22, height: 22, borderRadius: '50%', border: `2px solid ${form.role === role ? '#1a6b3c' : '#d5e8da'}`, background: form.role === role ? '#1a6b3c' : '#fff', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                      {form.role === role && <span style={{ color: '#fff', fontSize: '0.75rem' }}>✓</span>}
                    </div>
                  </div>
                ))}
              </div>

              <div style={{ display: 'flex', gap: 10 }}>
                <button onClick={() => setStep(1)} style={{ flex: 1, background: '#f7faf8', border: '1.5px solid #d5e8da', borderRadius: 12, padding: '12px', fontWeight: 600, fontSize: '0.95rem', cursor: 'pointer', fontFamily: "'DM Sans', sans-serif", color: '#5a7a62' }}>← Retour</button>
                <button onClick={handleNext} style={{ flex: 2, background: '#1a6b3c', color: '#fff', border: 'none', borderRadius: 12, padding: '12px', fontWeight: 700, fontSize: '0.95rem', cursor: 'pointer', fontFamily: "'DM Sans', sans-serif" }}>Continuer →</button>
              </div>
            </>
          )}

          {/* ── ÉTAPE 3 : Documents ── */}
          {step === 3 && (
            <>
              <h2 style={{ fontFamily: "'Playfair Display', serif", fontSize: '1.5rem', fontWeight: 900, marginBottom: '0.3rem', color: '#0d1f13' }}>Documents requis</h2>
              <p style={{ color: '#5a7a62', fontSize: '0.88rem', marginBottom: '1.8rem' }}>
                Pour la sécurité de tous. Tes documents sont vérifiés sous 24h.
              </p>

              <div style={{ marginBottom: 16 }}>
                <label style={lbl}>🪪 Carte d'identité ou Passeport</label>
                <input type="file" accept="image/*,application/pdf" onChange={e => set('idCard', e.target.files[0])} style={{ ...inp(''), padding: '10px 12px', fontSize: '0.85rem', cursor: 'pointer' }} />
              </div>

              <div style={{ marginBottom: 16 }}>
                <label style={lbl}>🚗 Permis de conduire</label>
                <input type="file" accept="image/*,application/pdf" onChange={e => set('license', e.target.files[0])} style={{ ...inp(''), padding: '10px 12px', fontSize: '0.85rem', cursor: 'pointer' }} />
              </div>

              {form.role === 'owner' && (
                <div style={{ marginBottom: 16 }}>
                  <label style={lbl}>📄 Carte grise de ton véhicule</label>
                  <input type="file" accept="image/*,application/pdf" style={{ ...inp(''), padding: '10px 12px', fontSize: '0.85rem', cursor: 'pointer' }} />
                </div>
              )}

              <div style={{ background: '#e8f5ee', border: '1px solid #2d9a5a', borderRadius: 10, padding: '10px 14px', fontSize: '0.8rem', color: '#1a6b3c', marginBottom: '1.5rem' }}>
                🔒 Tes documents sont sécurisés et ne sont jamais partagés avec des tiers.
              </div>

              <div style={{ display: 'flex', gap: 10 }}>
                <button onClick={() => setStep(2)} style={{ flex: 1, background: '#f7faf8', border: '1.5px solid #d5e8da', borderRadius: 12, padding: '12px', fontWeight: 600, fontSize: '0.95rem', cursor: 'pointer', fontFamily: "'DM Sans', sans-serif", color: '#5a7a62' }}>← Retour</button>
                <button onClick={handleSubmit} disabled={loading} style={{ flex: 2, background: loading ? '#aaa' : '#1a6b3c', color: '#fff', border: 'none', borderRadius: 12, padding: '12px', fontWeight: 700, fontSize: '0.95rem', cursor: loading ? 'not-allowed' : 'pointer', fontFamily: "'DM Sans', sans-serif" }}>
                  {loading ? '⏳ Création...' : '✅ Créer mon compte'}
                </button>
              </div>
            </>
          )}
        </div>

        <p style={{ textAlign: 'center', color: 'rgba(255,255,255,0.35)', fontSize: '0.78rem', marginTop: '1.5rem' }}>
          En t'inscrivant, tu acceptes nos{' '}
          <span style={{ color: 'rgba(255,255,255,0.6)', cursor: 'pointer' }}>Conditions d'utilisation</span>
        </p>
      </div>
    </div>
  )
}
