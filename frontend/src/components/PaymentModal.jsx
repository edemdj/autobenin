import { useState } from 'react'
import api from '../services/api'

const fmt = (n) => new Intl.NumberFormat('fr-FR').format(n || 0) + ' FCFA'

// Numéro Mobile Money AutoBénin (à mettre à jour avec le vrai numéro)
const AUTOBENIN_MOMO = {
  mtn:  { number: '+229 01 96 38 91 41', name: 'MTN MoMo',    color: '#f5a623', bg: '#fff8ed' },
  moov: { number: '+229 02 XX XX XX', name: 'Moov Money',  color: '#0066cc', bg: '#eef4ff' },
}

export default function PaymentModal({ booking, car, onClose, onSuccess }) {
  const [method,   setMethod]   = useState('mtn')
  const [phone,    setPhone]    = useState('')
  const [loading,  setLoading]  = useState(false)
  const [step,     setStep]     = useState('form') // form → instructions → done
  const [error,    setError]    = useState('')

  const total   = booking?.totalPrice    || car?.pricePerDay || 0
  const deposit = booking?.depositAmount || car?.depositAmount || 0

  const handleSubmit = async () => {
    if (!phone || phone.replace(/\D/g,'').length < 8) {
      setError('Entre un numéro de téléphone valide.')
      return
    }
    setLoading(true)
    setError('')
    try {
      // Créer la réservation avec le numéro de téléphone
      await api.post('/bookings', {
        carId:         car._id || car.id,
        startDate:     booking.startDate,
        endDate:       booking.endDate,
        paymentPhone:  phone,
        paymentMethod: method,
      })
      setStep('instructions')
      onSuccess?.()
    } catch (err) {
      setError(err.response?.data?.message || 'Erreur lors de la réservation.')
    } finally {
      setLoading(false)
    }
  }

  const inp = { width: '100%', padding: '12px 14px', border: '1.5px solid #d5e8da', borderRadius: 10, fontSize: '0.95rem', outline: 'none', boxSizing: 'border-box', fontFamily: "'DM Sans', sans-serif" }

  return (
    <div onClick={onClose} style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.65)', zIndex: 2000, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '1rem' }}>
      <div onClick={e => e.stopPropagation()} style={{ background: '#fff', borderRadius: 24, padding: '2.5rem', maxWidth: 480, width: '100%', maxHeight: '90vh', overflowY: 'auto' }}>

        {step === 'form' && (<>
          {/* Header */}
          <div style={{ textAlign: 'center', marginBottom: '1.5rem' }}>
            <div style={{ fontSize: '2.5rem', marginBottom: 8 }}>📱</div>
            <h3 style={{ fontFamily: "'Playfair Display', serif", fontSize: '1.4rem', fontWeight: 900, margin: '0 0 6px' }}>Confirmer la réservation</h3>
            <p style={{ color: '#5a7a62', fontSize: '0.85rem', margin: 0 }}>{car?.brand} {car?.model}</p>
          </div>

          {/* Récap montants */}
          <div style={{ background: '#f7faf8', border: '1px solid #d5e8da', borderRadius: 12, padding: '1rem', marginBottom: '1.5rem' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 6 }}>
              <span style={{ fontSize: '0.85rem', color: '#5a7a62' }}>Montant location</span>
              <span style={{ fontWeight: 700, color: '#0d1f13' }}>{fmt(total)}</span>
            </div>
            {deposit > 0 && (
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 6 }}>
                <span style={{ fontSize: '0.85rem', color: '#5a7a62' }}>Caution (remboursable)</span>
                <span style={{ fontWeight: 700, color: '#d4a017' }}>{fmt(deposit)}</span>
              </div>
            )}
            <div style={{ borderTop: '1px solid #d5e8da', paddingTop: 8, display: 'flex', justifyContent: 'space-between' }}>
              <span style={{ fontWeight: 700, fontSize: '0.9rem' }}>Total à payer</span>
              <span style={{ fontFamily: "'Playfair Display', serif", fontWeight: 900, fontSize: '1.1rem', color: '#1a6b3c' }}>{fmt(total + deposit)}</span>
            </div>
          </div>

          {/* Choix opérateur */}
          <div style={{ marginBottom: '1.2rem' }}>
            <label style={{ display: 'block', fontSize: '0.72rem', fontWeight: 700, color: '#5a7a62', textTransform: 'uppercase', letterSpacing: '0.07em', marginBottom: 8 }}>Votre opérateur Mobile Money</label>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
              {Object.entries(AUTOBENIN_MOMO).map(([key, op]) => (
                <div key={key} onClick={() => setMethod(key)}
                  style={{ border: `2px solid ${method === key ? op.color : '#d5e8da'}`, background: method === key ? op.bg : '#fff', borderRadius: 12, padding: '12px', cursor: 'pointer', textAlign: 'center', transition: 'all 0.15s' }}>
                  <div style={{ fontWeight: 700, fontSize: '0.9rem', color: method === key ? op.color : '#0d1f13' }}>{op.name}</div>
                </div>
              ))}
            </div>
          </div>

          {/* Numéro de téléphone */}
          <div style={{ marginBottom: '1.5rem' }}>
            <label style={{ display: 'block', fontSize: '0.72rem', fontWeight: 700, color: '#5a7a62', textTransform: 'uppercase', letterSpacing: '0.07em', marginBottom: 8 }}>Votre numéro {AUTOBENIN_MOMO[method].name}</label>
            <input
              value={phone}
              onChange={e => setPhone(e.target.value)}
              placeholder="+229 01 XX XX XX"
              style={{ ...inp, borderColor: error ? '#e74c3c' : '#d5e8da' }}
            />
            {error && <div style={{ color: '#c0392b', fontSize: '0.8rem', marginTop: 4 }}>⚠️ {error}</div>}
          </div>

          {/* Info paiement */}
          <div style={{ background: '#fef9e7', border: '1px solid #d4a017', borderRadius: 10, padding: '10px 14px', fontSize: '0.82rem', color: '#b8860b', marginBottom: '1.5rem' }}>
            📋 Après confirmation, vous recevrez les instructions de paiement par email et sur cette page.
          </div>

          <div style={{ display: 'flex', gap: 10 }}>
            <button onClick={onClose} style={{ flex: 1, background: '#f7faf8', border: '1.5px solid #d5e8da', borderRadius: 12, padding: '12px', fontWeight: 600, cursor: 'pointer', color: '#5a7a62', fontFamily: "'DM Sans', sans-serif" }}>
              Annuler
            </button>
            <button onClick={handleSubmit} disabled={loading} style={{ flex: 2, background: loading ? '#aaa' : '#1a6b3c', color: '#fff', border: 'none', borderRadius: 12, padding: '12px', fontWeight: 700, cursor: loading ? 'not-allowed' : 'pointer', fontFamily: "'DM Sans', sans-serif" }}>
              {loading ? '⏳ En cours...' : '✅ Confirmer la réservation'}
            </button>
          </div>
        </>)}

        {step === 'instructions' && (<>
          {/* Succès + instructions */}
          <div style={{ textAlign: 'center', marginBottom: '1.5rem' }}>
            <div style={{ fontSize: '3rem', marginBottom: 8 }}>✅</div>
            <h3 style={{ fontFamily: "'Playfair Display', serif", fontSize: '1.4rem', fontWeight: 900, margin: '0 0 6px', color: '#1a6b3c' }}>Réservation créée !</h3>
            <p style={{ color: '#5a7a62', fontSize: '0.85rem' }}>Effectuez votre paiement pour confirmer</p>
          </div>

          {/* Instructions paiement */}
          <div style={{ background: AUTOBENIN_MOMO[method].bg, border: `2px solid ${AUTOBENIN_MOMO[method].color}`, borderRadius: 16, padding: '1.5rem', marginBottom: '1.5rem' }}>
            <div style={{ fontWeight: 700, fontSize: '0.9rem', color: AUTOBENIN_MOMO[method].color, marginBottom: 12 }}>
              📱 Instructions de paiement {AUTOBENIN_MOMO[method].name}
            </div>
            <div style={{ fontSize: '0.88rem', color: '#0d1f13', lineHeight: 2 }}>
              <div>1️⃣ Ouvrez votre application <strong>{AUTOBENIN_MOMO[method].name}</strong></div>
              <div>2️⃣ Sélectionnez <strong>"Envoyer de l'argent"</strong></div>
              <div>3️⃣ Entrez le numéro AutoBénin :</div>
              <div style={{ background: '#fff', border: `1px solid ${AUTOBENIN_MOMO[method].color}`, borderRadius: 8, padding: '10px 14px', margin: '8px 0', fontFamily: 'monospace', fontSize: '1.1rem', fontWeight: 900, textAlign: 'center', color: AUTOBENIN_MOMO[method].color, letterSpacing: '0.1em' }}>
                {AUTOBENIN_MOMO[method].number}
              </div>
              <div>4️⃣ Montant exact à envoyer :</div>
              <div style={{ background: '#fff', border: `1px solid ${AUTOBENIN_MOMO[method].color}`, borderRadius: 8, padding: '10px 14px', margin: '8px 0', fontFamily: "'Playfair Display', serif", fontSize: '1.3rem', fontWeight: 900, textAlign: 'center', color: '#1a6b3c' }}>
                {fmt(total + deposit)}
              </div>
              <div>5️⃣ Comme référence, notez : <strong>AutoBénin - {car?.brand} {car?.model}</strong></div>
            </div>
          </div>

          <div style={{ background: '#fdecea', border: '1px solid #e74c3c', borderRadius: 10, padding: '10px 14px', fontSize: '0.82rem', color: '#c0392b', marginBottom: '1.5rem' }}>
            ⚠️ Le propriétaire confirmera votre réservation après réception du paiement. Vous recevrez un email de confirmation.
          </div>

          <div style={{ background: '#e8f5ee', border: '1px solid #2d9a5a', borderRadius: 10, padding: '10px 14px', fontSize: '0.82rem', color: '#1a6b3c', marginBottom: '1.5rem' }}>
            📧 Un email avec ces instructions a été envoyé à votre adresse.
          </div>

          <button onClick={onClose} style={{ width: '100%', background: '#1a6b3c', color: '#fff', border: 'none', borderRadius: 12, padding: '14px', fontWeight: 700, fontSize: '1rem', cursor: 'pointer', fontFamily: "'DM Sans', sans-serif" }}>
            J'ai compris, je vais payer →
          </button>
        </>)}

      </div>
    </div>
  )
}
