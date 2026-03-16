const PDFDocument = require('pdfkit')

const fmt     = (n) => new Intl.NumberFormat('fr-FR').format(n || 0) + ' FCFA'
const fmtDate = (d) => d ? new Date(d).toLocaleDateString('fr-FR', { day: '2-digit', month: 'long', year: 'numeric' }) : '—'
const days    = (s, e) => Math.ceil((new Date(e) - new Date(s)) / (1000*60*60*24))

const generateContract = (booking, res) => {
  const doc = new PDFDocument({ margin: 50, size: 'A4' })

  // Stream directement vers la réponse HTTP
  res.setHeader('Content-Type', 'application/pdf')
  res.setHeader('Content-Disposition', `attachment; filename="contrat-autobenin-${booking._id?.toString().slice(-6).toUpperCase()}.pdf"`)
  doc.pipe(res)

  const W = 595 - 100 // largeur utile
  const GREEN  = '#1a6b3c'
  const GOLD   = '#d4a017'
  const DARK   = '#0d1f13'
  const GRAY   = '#5a7a62'
  const LGRAY  = '#f7faf8'
  const RED    = '#c0392b'

  // ═══════════════════════════════
  // HEADER
  // ═══════════════════════════════
  doc.rect(0, 0, 595, 110).fill(DARK)

  doc.fontSize(28).font('Helvetica-Bold').fillColor('#ffffff')
     .text('Auto', 50, 35, { continued: true })
  doc.fillColor(GOLD).text('Bénin')

  doc.fontSize(10).font('Helvetica').fillColor('rgba(255,255,255,0.6)')
     .text('Location de voitures entre particuliers', 50, 68)
  doc.fillColor('rgba(255,255,255,0.4)')
     .text('www.autobenin.bj  ·  contact@autobenin.bj', 50, 82)

  // Numéro de contrat (coin droit)
  const contractNum = `AB-${booking._id?.toString().slice(-6).toUpperCase() || 'XXXXXX'}`
  doc.fontSize(11).font('Helvetica-Bold').fillColor(GOLD)
     .text(contractNum, 50, 40, { align: 'right', width: W })
  doc.fontSize(9).font('Helvetica').fillColor('rgba(255,255,255,0.5)')
     .text('N° de contrat', 50, 55, { align: 'right', width: W })
  doc.fillColor('rgba(255,255,255,0.5)')
     .text(`Émis le ${fmtDate(new Date())}`, 50, 68, { align: 'right', width: W })

  // ═══════════════════════════════
  // TITRE
  // ═══════════════════════════════
  doc.moveDown(0.5)
  doc.y = 125

  doc.fontSize(18).font('Helvetica-Bold').fillColor(DARK)
     .text('CONTRAT DE LOCATION DE VÉHICULE', 50, 125, { align: 'center', width: W })

  doc.moveTo(50, 150).lineTo(545, 150).strokeColor(GOLD).lineWidth(2).stroke()
  doc.moveTo(50, 153).lineTo(545, 153).strokeColor(GOLD).lineWidth(0.5).opacity(0.4).stroke()

  // ═══════════════════════════════
  // SECTION : VÉHICULE
  // ═══════════════════════════════
  doc.opacity(1)
  let y = 165

  const drawSection = (title, startY) => {
    doc.rect(50, startY, W, 22).fill(GREEN)
    doc.fontSize(11).font('Helvetica-Bold').fillColor('#ffffff')
       .text(title, 58, startY + 5)
    return startY + 30
  }

  const drawRow = (label, value, y, shade = false) => {
    if (shade) doc.rect(50, y - 3, W, 18).fill(LGRAY).strokeColor('#d5e8da').lineWidth(0.5).stroke()
    doc.fontSize(10).font('Helvetica').fillColor(GRAY).text(label, 58, y)
    doc.fontSize(10).font('Helvetica-Bold').fillColor(DARK).text(value || '—', 250, y)
    return y + 18
  }

  y = drawSection('🚗  INFORMATIONS SUR LE VÉHICULE', y)
  y = drawRow('Marque / Modèle',  `${booking.car?.brand || '—'} ${booking.car?.model || ''}`, y, false)
  y = drawRow('Année',             String(booking.car?.year || '—'), y, true)
  y = drawRow('Type',              booking.car?.type || '—', y, false)
  y = drawRow('Boîte de vitesse',  booking.car?.transmission || '—', y, true)
  y = drawRow('Carburant',         booking.car?.fuel || '—', y, false)
  y = drawRow('Immatriculation',   booking.car?.plateNumber || 'À vérifier', y, true)
  y = drawRow('Ville de départ',   booking.car?.city || '—', y, false)
  y += 10

  // ═══════════════════════════════
  // SECTION : PARTIES
  // ═══════════════════════════════
  y = drawSection('👤  PARTIES DU CONTRAT', y)

  // Locataire
  doc.fontSize(10).font('Helvetica-Bold').fillColor(GREEN).text('LOCATAIRE', 58, y)
  y += 14
  y = drawRow('Nom complet',    booking.renter?.name  || '—', y, true)
  y = drawRow('Email',          booking.renter?.email || '—', y, false)
  y = drawRow('Téléphone',      booking.renter?.phone || '—', y, true)
  y += 6

  // Propriétaire
  doc.fontSize(10).font('Helvetica-Bold').fillColor(GOLD).text('PROPRIÉTAIRE', 58, y)
  y += 14
  y = drawRow('Nom complet',    booking.owner?.name  || '—', y, true)
  y = drawRow('Email',          booking.owner?.email || '—', y, false)
  y = drawRow('Téléphone',      booking.owner?.phone || '—', y, true)
  y += 10

  // ═══════════════════════════════
  // SECTION : LOCATION
  // ═══════════════════════════════
  y = drawSection('📅  CONDITIONS DE LOCATION', y)
  const nbDays = days(booking.startDate, booking.endDate)
  y = drawRow('Date de début',    fmtDate(booking.startDate), y, false)
  y = drawRow('Date de fin',      fmtDate(booking.endDate),   y, true)
  y = drawRow('Durée',            `${nbDays} jour(s)`,        y, false)
  y = drawRow('Prix par jour',    fmt(booking.totalPrice / nbDays || 0), y, true)
  y += 10

  // ═══════════════════════════════
  // SECTION : FINANCES (encadrée)
  // ═══════════════════════════════
  y = drawSection('💰  MONTANTS', y)

  // Box montant total
  doc.rect(58, y, (W/2) - 16, 52).fill('#e8f5ee').stroke()
  doc.fontSize(10).font('Helvetica').fillColor(GRAY).text('MONTANT TOTAL', 66, y + 8)
  doc.fontSize(20).font('Helvetica-Bold').fillColor(GREEN)
     .text(fmt(booking.totalPrice), 66, y + 22)

  // Box caution
  doc.rect(58 + W/2, y, (W/2) - 8, 52).fill('#fef9e7').stroke()
  doc.fontSize(10).font('Helvetica').fillColor(GRAY).text('CAUTION (remboursable)', 66 + W/2, y + 8)
  doc.fontSize(20).font('Helvetica-Bold').fillColor(GOLD)
     .text(fmt(booking.depositAmount), 66 + W/2, y + 22)

  y += 62
  y = drawRow('Mode de paiement', 'MTN Mobile Money / Moov Money', y, false)
  y = drawRow('Commission AutoBénin', '15% du montant total', y, true)
  y += 10

  // ═══════════════════════════════
  // CONDITIONS GÉNÉRALES
  // ═══════════════════════════════

  // Nouvelle page si nécessaire
  if (y > 620) { doc.addPage(); y = 50 }

  y = drawSection('📋  CONDITIONS GÉNÉRALES', y)

  const conditions = [
    '1. Le locataire s\'engage à utiliser le véhicule conformément au code de la route en vigueur au Bénin.',
    '2. Le véhicule doit être rendu dans le même état qu\'à la prise en charge. Tout dommage constaté sera imputé sur la caution.',
    '3. La caution sera restituée dans les 48h suivant la fin de la location, après inspection du véhicule.',
    '4. Le carburant est à la charge du locataire. Le véhicule doit être rendu avec le même niveau de carburant.',
    '5. En cas de panne ou d\'accident, le locataire doit immédiatement prévenir le propriétaire et AutoBénin.',
    '6. La location ne peut être sous-louée à un tiers sans accord écrit du propriétaire.',
    '7. AutoBénin agit en qualité d\'intermédiaire et n\'est pas responsable des dommages entre les parties.',
    '8. Tout litige sera soumis à la juridiction compétente de Cotonou, Bénin.',
  ]

  doc.fontSize(9).font('Helvetica').fillColor(DARK)
  conditions.forEach(cond => {
    if (y > 730) { doc.addPage(); y = 50 }
    doc.text(cond, 58, y, { width: W - 16, lineGap: 2 })
    y += 22
  })

  y += 10

  // ═══════════════════════════════
  // SIGNATURES
  // ═══════════════════════════════
  if (y > 650) { doc.addPage(); y = 50 }

  y = drawSection('✍️  SIGNATURES', y)

  // Box signature locataire
  doc.rect(50, y, W/2 - 10, 80).strokeColor('#d5e8da').lineWidth(1).stroke()
  doc.fontSize(9).font('Helvetica-Bold').fillColor(GREEN)
     .text('LOCATAIRE', 58, y + 8)
  doc.fontSize(9).font('Helvetica').fillColor(GRAY)
     .text(booking.renter?.name || '—', 58, y + 22)
  doc.text('Date : _______________', 58, y + 36)
  doc.text('Signature :', 58, y + 52)
  doc.moveTo(115, y + 68).lineTo(W/2 + 30, y + 68).strokeColor('#aaa').lineWidth(0.5).stroke()

  // Box signature propriétaire
  doc.rect(50 + W/2 + 10, y, W/2 - 10, 80).strokeColor('#d5e8da').lineWidth(1).stroke()
  doc.fontSize(9).font('Helvetica-Bold').fillColor(GOLD)
     .text('PROPRIÉTAIRE', 58 + W/2 + 10, y + 8)
  doc.fontSize(9).font('Helvetica').fillColor(GRAY)
     .text(booking.owner?.name || '—', 58 + W/2 + 10, y + 22)
  doc.text('Date : _______________', 58 + W/2 + 10, y + 36)
  doc.text('Signature :', 58 + W/2 + 10, y + 52)
  doc.moveTo(115 + W/2 + 10, y + 68).lineTo(545, y + 68).strokeColor('#aaa').lineWidth(0.5).stroke()

  y += 95

  // ═══════════════════════════════
  // FOOTER
  // ═══════════════════════════════
  doc.rect(0, 780, 595, 60).fill(DARK)
  doc.fontSize(8).font('Helvetica').fillColor('rgba(255,255,255,0.4)')
     .text(`AutoBénin · Cotonou, Bénin · contact@autobenin.bj · Contrat N° ${contractNum}`, 50, 792, { align: 'center', width: W })
  doc.fillColor('rgba(255,255,255,0.25)')
     .text('Ce document constitue un contrat légalement contraignant entre les parties signataires.', 50, 806, { align: 'center', width: W })

  doc.end()
}

module.exports = { generateContract }