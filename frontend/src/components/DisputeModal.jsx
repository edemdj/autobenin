import { useState } from 'react'
import api from '../services/api'

const TYPES = [
  { value: 'damage',   label: '🔧 Dommage sur le véhicule' },
  { value: 'payment',  label: '💰 Problème de paiement / caution' },
  { value: 'no_show',  label: '🚫 No-show (personne absente)' },
  { value: 'other',    label: '❓ Autre problème' },
]

export default function DisputeModal({ booking, onClose }) {
  const [type,        setType]        = useState('')
  const [description, setDescription] = useState('')
  const [photos,      setPhotos]      = useState(null)
  const [loading,     setLoading]     = useState(false)
  const [success,     setSuccess]     = useState(false)
  const [error,       setError]       = useState('')

  const handleSubmit = async () => {
    if (!type || !description) { setError('Remplis tous les champs.'); return }
    setLoading(true)
    setError('')
    try {
      const formData = new FormData()
      formData.append('bookingId',  booking._id || booking.id)
      formData.append('againstId',  booking.owner?._id || booking.owner)
      formData.append('type',       type)
      formData.append('description',description)
      if (photos) Array.from(photos).forEach(p => formData.append('photos', p))

      await api.post('/disputes', formData)
      setSuccess(true)
    } catch (err) {
      setError(err.response?.data?.message || 'Erreur lors du signalement.')
    } finally {
      setLoading(false)
    }
  }

  const inp = { width: '100%', padding: '10px 12px', border: '1.5px solid #d5e8da', borderRadius: 10, fontSize: '0.92rem', outline: 'none', boxSizing: 'border-box', fontFamily: "'DM Sans', sans-serif" }
  const lbl = { display: 'block', fontSize: '0.72rem', fontWeight: 700, color: '#5a7a62', textTransform: 'uppercase', letterSpacing: '0.07em', marginBottom: 6 }

  return (
    <div onClick={onClose} style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.65)', zIndex: 2000, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '1rem' }}>
      <div onClick={e => e.stopPropagation()} style={{ background: '#fff', borderRadius: 24, padding: '2.5rem', maxWidth: 500, width: '100%', maxHeight: '90vh', overflowY: 'auto' }}>

        {success ? (
          <div style={{ textAlign: 'center', padding: '1.5rem 0' }}>
            <div style={{ fontSize: '3rem', marginBottom: 16 }}>🚨</div>
            <h3 style={{ fontFamily: "'Playfair Display', serif", fontSize: '1.5rem', fontWeight: 900, marginBottom: 8 }}>Litige signalé !</h3>
            <p style={{ color: '#5a7a62', marginBottom: 20 }}>Notre équipe va examiner votre signalement et vous recontactera sous 24h.</p>
            <button onClick={onClose} style={{ background: '#1a6b3c', color: '#fff', border: 'none', borderRadius: 12, padding: '12px 28px', fontWeight: 700, cursor: 'pointer' }}>Fermer</button>
          </div>
        ) : (
          <>
            <h3 style={{ fontFamily: "'Playfair Display', serif", fontSize: '1.5rem', fontWeight: 900, marginBottom: 4 }}>🚨 Signaler un problème</h3>
            <p style={{ color: '#5a7a62', fontSize: '0.85rem', marginBottom: '1.5rem' }}>
              Réservation du {new Date(booking.startDate).toLocaleDateString('fr-FR')} — {booking.car?.brand || 'Véhicule'}
            </p>

            {/* Type de problème */}
            <div style={{ marginBottom: '1.2rem' }}>
              <label style={lbl}>Type de problème</label>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                {TYPES.map(t => (
                  <div key={t.value} onClick={() => setType(t.value)}
                    style={{ border: `2px solid ${type === t.value ? '#c0392b' : '#d5e8da'}`, background: type === t.value ? '#fdecea' : '#fff', borderRadius: 10, padding: '10px 14px', cursor: 'pointer', fontSize: '0.9rem', color: type === t.value ? '#c0392b' : '#1a2e1e', fontWeight: type === t.value ? 700 : 400, transition: 'all 0.15s' }}>
                    {t.label}
                  </div>
                ))}
              </div>
            </div>

            {/* Description */}
            <div style={{ marginBottom: '1.2rem' }}>
              <label style={lbl}>Description détaillée</label>
              <textarea
                value={description}
                onChange={e => setDescription(e.target.value)}
                placeholder="Décrivez le problème en détail..."
                rows={4}
                style={{ ...inp, resize: 'vertical' }}
              />
            </div>

            {/* Photos preuves */}
            <div style={{ marginBottom: '1.5rem' }}>
              <label style={lbl}>📸 Photos / preuves (optionnel)</label>
              <input type="file" accept="image/*" multiple onChange={e => setPhotos(e.target.files)}
                style={{ ...inp, padding: '8px 12px', fontSize: '0.82rem', cursor: 'pointer' }} />
            </div>

            {error && (
              <div style={{ background: '#fdecea', border: '1px solid #e74c3c', borderRadius: 10, padding: '10px', color: '#c0392b', fontSize: '0.85rem', marginBottom: '1rem' }}>
                ⚠️ {error}
              </div>
            )}

            <div style={{ background: '#fef9e7', border: '1px solid #d4a017', borderRadius: 10, padding: '10px 14px', fontSize: '0.82rem', color: '#b8860b', marginBottom: '1.2rem' }}>
              ⚠️ Notre équipe examinera votre dossier sous 24h. En cas de dommage constaté, la caution peut être retenue partiellement ou totalement.
            </div>

            <div style={{ display: 'flex', gap: 10 }}>
              <button onClick={onClose} style={{ flex: 1, background: '#f7faf8', border: '1.5px solid #d5e8da', borderRadius: 12, padding: '12px', fontWeight: 600, cursor: 'pointer', color: '#5a7a62', fontFamily: "'DM Sans', sans-serif" }}>
                Annuler
              </button>
              <button onClick={handleSubmit} disabled={loading} style={{ flex: 2, background: loading ? '#aaa' : '#c0392b', color: '#fff', border: 'none', borderRadius: 12, padding: '12px', fontWeight: 700, cursor: loading ? 'not-allowed' : 'pointer', fontFamily: "'DM Sans', sans-serif" }}>
                {loading ? '⏳ Envoi...' : '🚨 Signaler le problème'}
              </button>
            </div>
          </>
        )}
      </div>
    </div>
  )
}
