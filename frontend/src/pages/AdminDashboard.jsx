import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import api from '../services/api'

const fmt     = (n) => new Intl.NumberFormat('fr-FR').format(n || 0) + ' FCFA'
const fmtDate = (d) => d ? new Date(d).toLocaleDateString('fr-FR') : '—'

export default function FinanceDashboard() {
  const { user }  = useAuth()
  const navigate  = useNavigate()
  if (typeof document !== 'undefined' && !document.getElementById('finance-responsive')) {
    const s = document.createElement('style')
    s.id = 'finance-responsive'
    s.textContent = `
      @media (max-width: 768px) {
        .finance-stats { grid-template-columns: 1fr 1fr !important; }
        .tx-row { flex-direction: column !important; }
        .tx-amounts { text-align: left !important; min-width: unset !important; }
      }
      @media (max-width: 480px) {
        .finance-stats { grid-template-columns: 1fr 1fr !important; }
      }
    `
    document.head.appendChild(s)
  }
  const isAdmin   = user?.role === 'admin'
  const isOwner   = user?.role === 'owner'

  const [stats,   setStats]   = useState(null)
  const [txs,     setTxs]     = useState([])
  const [wallet,  setWallet]  = useState(null)
  const [loading, setLoading] = useState(true)
  const [error,   setError]   = useState('')
  const [filter,  setFilter]  = useState('all')
  const [msg,     setMsg]     = useState('')
  const [paying,  setPaying]  = useState(null)
  const [payRef,  setPayRef]  = useState('')

  useEffect(() => {
    // Attendre que user soit chargé
    if (user === undefined) return
    if (user === null) { navigate('/login'); return }
    if (!isAdmin && !isOwner) { navigate('/'); return }
    loadData()
  }, [user])

  const loadData = async () => {
    setLoading(true)
    setError('')
    try {
      if (isAdmin) {
        const [sR, tR] = await Promise.all([
          api.get('/finance/admin/stats'),
          api.get('/finance/admin/transactions'),
        ])
        setStats(sR.data)
        setTxs(tR.data)
      } else {
        const wR = await api.get('/finance/owner/wallet')
        setWallet(wR.data)
        setTxs(wR.data.transactions || [])
      }
    } catch (err) {
      console.error('Finance error:', err.response?.status, err.response?.data)
      setError(`Erreur ${err.response?.status || ''}: ${err.response?.data?.message || err.message}`)
    } finally {
      setLoading(false)
    }
  }

  const showMsg = (text) => { setMsg(text); setTimeout(() => setMsg(''), 3000) }

  const markPaid = async (id) => {
    try {
      await api.put(`/finance/admin/transactions/${id}/pay`, { reference: payRef || 'MANUAL' })
      setTxs(t => t.map(x => x._id === id ? { ...x, ownerPaid: true, ownerPaidAt: new Date(), ownerPaymentRef: payRef || 'MANUAL' } : x))
      showMsg('✅ Paiement marqué comme effectué')
      setPaying(null); setPayRef('')
    } catch (err) {
      showMsg('❌ Erreur : ' + err.message)
    }
  }

  const filteredTxs = txs.filter(t =>
    filter === 'paid' ? t.ownerPaid : filter === 'pending' ? !t.ownerPaid : true
  )

  const card = { background: '#fff', borderRadius: 16, border: '1px solid #d5e8da', padding: '1.5rem' }

  return (
    <div style={{ fontFamily: "'DM Sans', sans-serif", background: '#f7faf8', minHeight: '100vh', paddingTop: 68 }}>

      {msg && <div style={{ position: 'fixed', top: 80, right: 24, background: '#0d1f13', color: '#fff', padding: '12px 20px', borderRadius: 12, zIndex: 9999, fontWeight: 600, fontSize: '0.9rem', boxShadow: '0 8px 30px rgba(0,0,0,0.3)' }}>{msg}</div>}

      {/* Header */}
      <div style={{ background: '#0d1f13', padding: '2rem 5%', borderBottom: '1px solid rgba(212,160,23,0.15)' }}>
        <div style={{ maxWidth: 1200, margin: '0 auto' }}>
          <div style={{ color: '#d4a017', fontSize: '0.75rem', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.1em', marginBottom: 6 }}>
            {isAdmin ? '💰 Finance & Commissions' : '👛 Mon portefeuille'}
          </div>
          <h1 style={{ fontFamily: "'Playfair Display', serif", fontSize: '2rem', fontWeight: 900, color: '#fff', margin: 0 }}>
            {isAdmin ? 'Dashboard Financier' : 'Mes revenus'}
          </h1>
          {isOwner && <p style={{ color: 'rgba(255,255,255,0.5)', margin: '6px 0 0', fontSize: '0.85rem' }}>Commission AutoBénin : <strong style={{ color: '#d4a017' }}>15%</strong> prélevée sur chaque location</p>}
        </div>
      </div>

      <div style={{ maxWidth: 1200, margin: '0 auto', padding: '2rem 5%' }}>

        {/* Erreur */}
        {error && (
          <div style={{ background: '#fdecea', border: '1px solid #e74c3c', borderRadius: 12, padding: '1rem 1.5rem', color: '#c0392b', marginBottom: '1.5rem' }}>
            ❌ {error}
            <button onClick={loadData} style={{ marginLeft: 12, background: 'none', border: '1px solid #c0392b', borderRadius: 6, padding: '4px 10px', cursor: 'pointer', color: '#c0392b', fontSize: '0.82rem' }}>Réessayer</button>
          </div>
        )}

        {loading ? (
          <div style={{ textAlign: 'center', padding: '4rem', color: '#5a7a62' }}>
            <div style={{ fontSize: '2rem', marginBottom: 12 }}>⏳</div>
            <p>Chargement des données financières...</p>
          </div>
        ) : (<>

          {/* ── STATS ADMIN ── */}
          {isAdmin && stats && (
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(190px, 1fr))', gap: '1.2rem', marginBottom: '2rem' }}>
              {[
                ['💳', 'Volume total',          fmt(stats.totalRevenue),      '#1a6b3c', 'Toutes les locations'],
                ['🏦', 'Commissions (15%)',     fmt(stats.totalCommission),   '#d4a017', 'Revenus AutoBénin'],
                ['✅', 'Reversé aux proprios',  fmt(stats.totalOwnerPaid),    '#1a6b3c', 'Déjà payé'],
                ['⏳', 'À reverser',            fmt(stats.totalOwnerPending), '#c0392b', 'En attente'],
                ['📋', 'Transactions',          stats.transactionCount,       '#1a6b3c', 'Au total'],
              ].map(([icon, label, val, color, sub]) => (
                <div key={label} style={{ ...card, textAlign: 'center' }}>
                  <div style={{ fontSize: '1.8rem', marginBottom: 8 }}>{icon}</div>
                  <div style={{ fontFamily: "'Playfair Display', serif", fontSize: '1.4rem', fontWeight: 900, color }}>{val}</div>
                  <div style={{ fontSize: '0.82rem', fontWeight: 700, color: '#0d1f13', marginTop: 4 }}>{label}</div>
                  <div style={{ fontSize: '0.72rem', color: '#5a7a62' }}>{sub}</div>
                </div>
              ))}
            </div>
          )}

          {/* ── STATS PROPRIÉTAIRE ── */}
          {isOwner && wallet && (
            <>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(190px, 1fr))', gap: '1.2rem', marginBottom: '1.5rem' }}>
                {[
                  ['💰', 'Revenus totaux',   fmt(wallet.totalEarned),    '#1a6b3c', 'Après commission'],
                  ['✅', 'Déjà reçu',        fmt(wallet.totalPaid),      '#1a6b3c', 'Virements effectués'],
                  ['⏳', 'En attente',        fmt(wallet.totalPending),   '#d4a017', 'À recevoir'],
                  ['🏦', 'Commission payée', fmt(wallet.totalCommission),'#5a7a62', '15% AutoBénin'],
                ].map(([icon, label, val, color, sub]) => (
                  <div key={label} style={{ ...card, textAlign: 'center' }}>
                    <div style={{ fontSize: '1.8rem', marginBottom: 8 }}>{icon}</div>
                    <div style={{ fontFamily: "'Playfair Display', serif", fontSize: '1.4rem', fontWeight: 900, color }}>{val}</div>
                    <div style={{ fontSize: '0.82rem', fontWeight: 700, color: '#0d1f13', marginTop: 4 }}>{label}</div>
                    <div style={{ fontSize: '0.72rem', color: '#5a7a62' }}>{sub}</div>
                  </div>
                ))}
              </div>
              <div style={{ background: '#fef9e7', border: '1px solid #d4a017', borderRadius: 14, padding: '1.2rem 1.5rem', marginBottom: '1.5rem' }}>
                <div style={{ fontWeight: 700, fontSize: '0.9rem', color: '#b8860b', marginBottom: 6 }}>📊 Comment fonctionne la commission ?</div>
                <div style={{ fontSize: '0.85rem', color: '#8a6a00', lineHeight: 1.7 }}>
                  AutoBénin prélève <strong>15%</strong> du montant de chaque location. Le reste (<strong>85%</strong>) vous est reversé via Mobile Money après la fin de la location.<br/>
                  <strong>Exemple :</strong> Location à 30 000 FCFA → Commission : 4 500 FCFA → Vous recevez : <strong>25 500 FCFA</strong>
                </div>
              </div>
            </>
          )}

          {/* ── FILTRES + LISTE ── */}
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.2rem', flexWrap: 'wrap', gap: 12 }}>
            <h3 style={{ fontFamily: "'Playfair Display', serif", fontSize: '1.2rem', fontWeight: 700, margin: 0 }}>
              {isAdmin ? 'Toutes les transactions' : 'Historique'}
              <span style={{ fontFamily: "'DM Sans', sans-serif", fontSize: '0.85rem', fontWeight: 400, color: '#5a7a62', marginLeft: 8 }}>({filteredTxs.length})</span>
            </h3>
            <div style={{ display: 'flex', gap: 8 }}>
              {[['all','Toutes'],['pending','En attente'],['paid','Payées']].map(([v,l]) => (
                <button key={v} onClick={() => setFilter(v)} style={{ padding: '7px 16px', borderRadius: 50, border: '1.5px solid', borderColor: filter===v?'#1a6b3c':'#d5e8da', background: filter===v?'#1a6b3c':'#fff', color: filter===v?'#fff':'#5a7a62', fontWeight: 600, fontSize: '0.82rem', cursor: 'pointer' }}>{l}</button>
              ))}
            </div>
          </div>

          <div style={{ ...card, padding: 0, overflow: 'hidden' }}>
            {filteredTxs.length === 0 ? (
              <div style={{ padding: '3rem', textAlign: 'center', color: '#5a7a62' }}>
                <div style={{ fontSize: '2rem', marginBottom: 12 }}>💳</div>
                <p>Aucune transaction trouvée.</p>
              </div>
            ) : filteredTxs.map((t, i) => (
              <div key={t._id} style={{ padding: '1.2rem 1.5rem', borderBottom: i < filteredTxs.length - 1 ? '1px solid #d5e8da' : 'none' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: 12 }}>
                  <div style={{ flex: 1 }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 6, flexWrap: 'wrap' }}>
                      <span style={{ fontWeight: 700, fontSize: '0.92rem', color: '#0d1f13' }}>
                        {isAdmin ? `${t.renter?.name||'—'} → ${t.owner?.name||'—'}` : `Location · ${t.renter?.name||'—'}`}
                      </span>
                      <span style={{ fontSize: '0.7rem', fontWeight: 700, padding: '2px 9px', borderRadius: 50, background: t.ownerPaid?'#e8f5ee':'#fef9e7', color: t.ownerPaid?'#1a6b3c':'#b8860b', border: `1px solid ${t.ownerPaid?'#2d9a5a':'#d4a017'}` }}>
                        {t.ownerPaid ? '✅ Payé' : '⏳ En attente'}
                      </span>
                    </div>
                    <div style={{ fontSize: '0.8rem', color: '#5a7a62', marginBottom: 4 }}>
                      📅 {fmtDate(t.booking?.startDate)} → {fmtDate(t.booking?.endDate)}
                      {isAdmin && <> · 📱 {(t.paymentMethod||'').replace('_',' ').toUpperCase()} · 👤 {t.owner?.phone||'—'}</>}
                    </div>
                    {t.ownerPaid && t.ownerPaidAt && <div style={{ fontSize: '0.75rem', color: '#1a6b3c' }}>Versé le {fmtDate(t.ownerPaidAt)}{t.ownerPaymentRef ? ` · Réf: ${t.ownerPaymentRef}` : ''}</div>}
                  </div>
                  <div style={{ textAlign: 'right', minWidth: 200 }}>
                    <div style={{ display: 'grid', gridTemplateColumns: '1fr auto', gap: '2px 16px', marginBottom: 8, alignItems: 'center' }}>
                      <span style={{ fontSize: '0.72rem', color: '#5a7a62', textAlign: 'right' }}>Location</span>
                      <span style={{ fontWeight: 700, fontSize: '0.88rem', color: '#0d1f13' }}>{fmt(t.rentalAmount)}</span>
                      <span style={{ fontSize: '0.72rem', color: '#d4a017', textAlign: 'right' }}>Commission 15%</span>
                      <span style={{ fontWeight: 700, fontSize: '0.88rem', color: '#d4a017' }}>-{fmt(t.commissionAmount)}</span>
                      <span style={{ fontSize: '0.72rem', color: '#1a6b3c', textAlign: 'right', borderTop: '1px solid #d5e8da', paddingTop: 4 }}>{isAdmin?'À reverser':'Vos gains'}</span>
                      <span style={{ fontFamily: "'Playfair Display', serif", fontWeight: 900, fontSize: '1rem', color: '#1a6b3c', borderTop: '1px solid #d5e8da', paddingTop: 4 }}>{fmt(t.ownerAmount)}</span>
                    </div>
                    {isAdmin && !t.ownerPaid && (
                      paying === t._id ? (
                        <div style={{ display: 'flex', gap: 6, flexDirection: 'column', alignItems: 'flex-end' }}>
                          <input value={payRef} onChange={e => setPayRef(e.target.value)} placeholder="Réf. virement" style={{ padding: '6px 10px', border: '1.5px solid #d5e8da', borderRadius: 8, fontSize: '0.8rem', outline: 'none', width: 180, fontFamily: "'DM Sans', sans-serif" }} />
                          <div style={{ display: 'flex', gap: 6 }}>
                            <button onClick={() => setPaying(null)} style={{ padding: '6px 12px', background: '#f7faf8', border: '1.5px solid #d5e8da', borderRadius: 8, fontWeight: 600, fontSize: '0.8rem', cursor: 'pointer', color: '#5a7a62' }}>Annuler</button>
                            <button onClick={() => markPaid(t._id)} style={{ padding: '6px 14px', background: '#1a6b3c', color: '#fff', border: 'none', borderRadius: 8, fontWeight: 700, fontSize: '0.8rem', cursor: 'pointer' }}>✅ Confirmer</button>
                          </div>
                        </div>
                      ) : (
                        <button onClick={() => { setPaying(t._id); setPayRef('') }} style={{ padding: '7px 14px', background: '#1a6b3c', color: '#fff', border: 'none', borderRadius: 8, fontWeight: 700, fontSize: '0.82rem', cursor: 'pointer', marginTop: 4 }}>
                          💸 Marquer payé
                        </button>
                      )
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </>)}
      </div>
    </div>
  )
}
