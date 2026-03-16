const nodemailer = require('nodemailer')

// Créer le transporteur Gmail
const getTransporter = () => {
  if (!process.env.GMAIL_USER || process.env.GMAIL_USER === 'ton_email@gmail.com') {
    return null
  }
  return nodemailer.createTransport({
    service: 'gmail',
    auth: {
      user: process.env.GMAIL_USER,
      pass: process.env.GMAIL_APP_PASSWORD, // Mot de passe d'application Gmail
    },
  })
}

const fmt = (n) => new Intl.NumberFormat('fr-FR').format(n) + ' FCFA'
const fmtDate = (d) => new Date(d).toLocaleDateString('fr-FR', { day: 'numeric', month: 'long', year: 'numeric' })

// Template HTML de base
const baseTemplate = (content) => `
<!DOCTYPE html>
<html lang="fr">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>AutoBénin</title>
</head>
<body style="margin:0;padding:0;background:#f7faf8;font-family:'Helvetica Neue',Arial,sans-serif;">
  <div style="max-width:600px;margin:0 auto;padding:20px;">

    <!-- Header -->
    <div style="background:#0d1f13;border-radius:16px 16px 0 0;padding:28px 32px;text-align:center;">
      <h1 style="margin:0;color:#fff;font-size:28px;font-weight:900;letter-spacing:-0.5px;">
        Auto<span style="color:#d4a017;">Bénin</span>
      </h1>
      <p style="margin:6px 0 0;color:rgba(255,255,255,0.5);font-size:13px;">
        Location de voitures entre particuliers
      </p>
    </div>

    <!-- Content -->
    <div style="background:#ffffff;padding:32px;border-left:1px solid #d5e8da;border-right:1px solid #d5e8da;">
      ${content}
    </div>

    <!-- Footer -->
    <div style="background:#f0f4f1;border-radius:0 0 16px 16px;padding:20px 32px;text-align:center;border:1px solid #d5e8da;border-top:none;">
      <p style="margin:0;color:#5a7a62;font-size:12px;">
        © 2025 AutoBénin · Cotonou, Bénin
      </p>
      <p style="margin:6px 0 0;color:#5a7a62;font-size:12px;">
        contact@autobenin.bj
      </p>
    </div>

  </div>
</body>
</html>
`

// Envoyer un email
const sendEmail = async ({ to, subject, html }) => {
  const transporter = getTransporter()

  if (!transporter) {
    console.log(`📧 Email (non envoyé - Gmail non configuré)`)
    console.log(`   → ${to}`)
    console.log(`   Sujet: ${subject}`)
    return { success: false, reason: 'Gmail non configuré' }
  }

  try {
    const info = await transporter.sendMail({
      from:    `"AutoBénin 🚗" <${process.env.GMAIL_USER}>`,
      to,
      subject,
      html,
    })
    console.log(`✅ Email envoyé à ${to} — ID: ${info.messageId}`)
    return { success: true, messageId: info.messageId }
  } catch (err) {
    console.error(`❌ Email échoué pour ${to}:`, err.message)
    return { success: false, error: err.message }
  }
}

// ── 1. Email de bienvenue ──
const sendWelcomeEmail = async (user) => {
  const html = baseTemplate(`
    <h2 style="color:#0d1f13;font-size:22px;margin:0 0 8px;">
      Bienvenue, ${user.name} ! 🎉
    </h2>
    <p style="color:#5a7a62;font-size:15px;line-height:1.6;margin:0 0 24px;">
      Votre compte AutoBénin a été créé avec succès. Vous faites maintenant partie de la première plateforme de location de voitures entre particuliers au Bénin.
    </p>

    <div style="background:#e8f5ee;border-left:4px solid #1a6b3c;border-radius:8px;padding:16px 20px;margin-bottom:24px;">
      <p style="margin:0;color:#1a6b3c;font-weight:700;font-size:14px;">
        ${user.role === 'owner'
          ? '🚗 Vous êtes propriétaire — Ajoutez votre première voiture et commencez à gagner !'
          : '🔑 Vous êtes locataire — Trouvez et réservez votre voiture idéale !'}
      </p>
    </div>

    <div style="text-align:center;margin-bottom:24px;">
      <a href="http://localhost:3000" style="display:inline-block;background:#1a6b3c;color:#fff;padding:14px 32px;border-radius:50px;text-decoration:none;font-weight:700;font-size:15px;">
        Accéder à AutoBénin →
      </a>
    </div>

    <p style="color:#aaa;font-size:13px;margin:0;">
      Votre email : ${user.email}
    </p>
  `)

  return sendEmail({
    to:      user.email,
    subject: '🇧🇯 Bienvenue sur AutoBénin !',
    html,
  })
}

// ── 2. Nouvelle réservation → propriétaire ──
const sendBookingNotifOwner = async (owner, renter, car, booking) => {
  const html = baseTemplate(`
    <h2 style="color:#0d1f13;font-size:22px;margin:0 0 8px;">
      Nouvelle réservation ! 🚗
    </h2>
    <p style="color:#5a7a62;font-size:15px;line-height:1.6;margin:0 0 24px;">
      <strong>${renter.name}</strong> souhaite louer votre <strong>${car.brand} ${car.model}</strong>.
    </p>

    <div style="background:#f7faf8;border:1px solid #d5e8da;border-radius:12px;padding:20px;margin-bottom:24px;">
      <table style="width:100%;border-collapse:collapse;">
        <tr>
          <td style="padding:8px 0;color:#5a7a62;font-size:14px;">🚗 Voiture</td>
          <td style="padding:8px 0;color:#0d1f13;font-weight:700;font-size:14px;text-align:right;">${car.brand} ${car.model}</td>
        </tr>
        <tr style="border-top:1px solid #d5e8da;">
          <td style="padding:8px 0;color:#5a7a62;font-size:14px;">👤 Locataire</td>
          <td style="padding:8px 0;color:#0d1f13;font-weight:700;font-size:14px;text-align:right;">${renter.name}</td>
        </tr>
        <tr style="border-top:1px solid #d5e8da;">
          <td style="padding:8px 0;color:#5a7a62;font-size:14px;">📱 Téléphone</td>
          <td style="padding:8px 0;color:#0d1f13;font-weight:700;font-size:14px;text-align:right;">${renter.phone || 'Non renseigné'}</td>
        </tr>
        <tr style="border-top:1px solid #d5e8da;">
          <td style="padding:8px 0;color:#5a7a62;font-size:14px;">📅 Début</td>
          <td style="padding:8px 0;color:#0d1f13;font-weight:700;font-size:14px;text-align:right;">${fmtDate(booking.startDate)}</td>
        </tr>
        <tr style="border-top:1px solid #d5e8da;">
          <td style="padding:8px 0;color:#5a7a62;font-size:14px;">📅 Fin</td>
          <td style="padding:8px 0;color:#0d1f13;font-weight:700;font-size:14px;text-align:right;">${fmtDate(booking.endDate)}</td>
        </tr>
        <tr style="border-top:1px solid #d5e8da;">
          <td style="padding:8px 0;color:#5a7a62;font-size:14px;">💰 Montant</td>
          <td style="padding:8px 0;color:#1a6b3c;font-weight:700;font-size:16px;text-align:right;">${fmt(booking.totalPrice)}</td>
        </tr>
      </table>
    </div>

    <div style="text-align:center;margin-bottom:16px;">
      <a href="http://localhost:3000/dashboard" style="display:inline-block;background:#1a6b3c;color:#fff;padding:14px 32px;border-radius:50px;text-decoration:none;font-weight:700;font-size:15px;">
        Accepter ou refuser →
      </a>
    </div>
  `)

  return sendEmail({
    to:      owner.email,
    subject: `🚗 Nouvelle réservation — ${car.brand} ${car.model}`,
    html,
  })
}

// ── 3. Réservation confirmée → locataire ──
const sendBookingConfirmedRenter = async (renter, owner, car, booking) => {
  const html = baseTemplate(`
    <h2 style="color:#0d1f13;font-size:22px;margin:0 0 8px;">
      Réservation confirmée ! ✅
    </h2>
    <p style="color:#5a7a62;font-size:15px;line-height:1.6;margin:0 0 24px;">
      Votre réservation pour <strong>${car.brand} ${car.model}</strong> a été confirmée par le propriétaire.
    </p>

    <div style="background:#e8f5ee;border:1px solid #2d9a5a;border-radius:12px;padding:20px;margin-bottom:24px;">
      <table style="width:100%;border-collapse:collapse;">
        <tr>
          <td style="padding:8px 0;color:#1a6b3c;font-size:14px;">🚗 Voiture</td>
          <td style="padding:8px 0;color:#0d1f13;font-weight:700;font-size:14px;text-align:right;">${car.brand} ${car.model}</td>
        </tr>
        <tr style="border-top:1px solid #c8e6c9;">
          <td style="padding:8px 0;color:#1a6b3c;font-size:14px;">📅 Du</td>
          <td style="padding:8px 0;color:#0d1f13;font-weight:700;font-size:14px;text-align:right;">${fmtDate(booking.startDate)}</td>
        </tr>
        <tr style="border-top:1px solid #c8e6c9;">
          <td style="padding:8px 0;color:#1a6b3c;font-size:14px;">📅 Au</td>
          <td style="padding:8px 0;color:#0d1f13;font-weight:700;font-size:14px;text-align:right;">${fmtDate(booking.endDate)}</td>
        </tr>
        <tr style="border-top:1px solid #c8e6c9;">
          <td style="padding:8px 0;color:#1a6b3c;font-size:14px;">👤 Propriétaire</td>
          <td style="padding:8px 0;color:#0d1f13;font-weight:700;font-size:14px;text-align:right;">${owner.name}</td>
        </tr>
        <tr style="border-top:1px solid #c8e6c9;">
          <td style="padding:8px 0;color:#1a6b3c;font-size:14px;">📞 Contact</td>
          <td style="padding:8px 0;color:#0d1f13;font-weight:700;font-size:14px;text-align:right;">${owner.phone || owner.email}</td>
        </tr>
      </table>
    </div>

    <div style="background:#fef9e7;border:1px solid #d4a017;border-radius:8px;padding:14px 16px;margin-bottom:24px;">
      <p style="margin:0;color:#b8860b;font-size:13px;">
        🔒 N'oubliez pas d'effectuer l'inspection photo du véhicule avant le départ.
      </p>
    </div>

    <div style="text-align:center;">
      <a href="http://localhost:3000/profile" style="display:inline-block;background:#1a6b3c;color:#fff;padding:14px 32px;border-radius:50px;text-decoration:none;font-weight:700;font-size:15px;">
        Voir ma réservation →
      </a>
    </div>
  `)

  return sendEmail({
    to:      renter.email,
    subject: `✅ Réservation confirmée — ${car.brand} ${car.model}`,
    html,
  })
}

// ── 4. Paiement confirmé → locataire ──
const sendPaymentConfirmedRenter = async (renter, amount) => {
  const html = baseTemplate(`
    <h2 style="color:#0d1f13;font-size:22px;margin:0 0 8px;">
      Paiement confirmé ! 💳
    </h2>
    <p style="color:#5a7a62;font-size:15px;line-height:1.6;margin:0 0 24px;">
      Votre paiement a été traité avec succès.
    </p>

    <div style="background:#f7faf8;border:1px solid #d5e8da;border-radius:12px;padding:24px;text-align:center;margin-bottom:24px;">
      <p style="margin:0 0 4px;color:#5a7a62;font-size:13px;">Montant débité</p>
      <p style="margin:0;color:#1a6b3c;font-size:32px;font-weight:900;">${fmt(amount)}</p>
    </div>

    <div style="text-align:center;">
      <a href="http://localhost:3000/profile" style="display:inline-block;background:#1a6b3c;color:#fff;padding:14px 32px;border-radius:50px;text-decoration:none;font-weight:700;font-size:15px;">
        Voir mes réservations →
      </a>
    </div>
  `)

  return sendEmail({
    to:      renter.email,
    subject: `💳 Paiement confirmé — ${fmt(amount)}`,
    html,
  })
}

// ── 5. Paiement reçu → propriétaire ──
const sendPaymentNotifOwner = async (owner, renter, car, amount) => {
  const html = baseTemplate(`
    <h2 style="color:#0d1f13;font-size:22px;margin:0 0 8px;">
      Paiement reçu ! 💰
    </h2>
    <p style="color:#5a7a62;font-size:15px;line-height:1.6;margin:0 0 24px;">
      <strong>${renter.name}</strong> a effectué le paiement pour votre <strong>${car.brand} ${car.model}</strong>.
    </p>

    <div style="background:#f7faf8;border:1px solid #d5e8da;border-radius:12px;padding:24px;text-align:center;margin-bottom:24px;">
      <p style="margin:0 0 4px;color:#5a7a62;font-size:13px;">Montant reçu</p>
      <p style="margin:0;color:#d4a017;font-size:32px;font-weight:900;">${fmt(amount)}</p>
      <p style="margin:8px 0 0;color:#5a7a62;font-size:12px;">Le montant sera transféré après la fin de la location.</p>
    </div>

    <div style="text-align:center;">
      <a href="http://localhost:3000/dashboard" style="display:inline-block;background:#1a6b3c;color:#fff;padding:14px 32px;border-radius:50px;text-decoration:none;font-weight:700;font-size:15px;">
        Voir mon dashboard →
      </a>
    </div>
  `)

  return sendEmail({
    to:      owner.email,
    subject: `💰 Paiement reçu — ${car.brand} ${car.model}`,
    html,
  })
}

// ── 6. Réservation annulée ──
const sendCancellationEmail = async (user, car) => {
  const html = baseTemplate(`
    <h2 style="color:#0d1f13;font-size:22px;margin:0 0 8px;">
      Réservation annulée ❌
    </h2>
    <p style="color:#5a7a62;font-size:15px;line-height:1.6;margin:0 0 24px;">
      Votre réservation pour <strong>${car.brand} ${car.model}</strong> a été annulée.
    </p>

    <div style="background:#fdecea;border:1px solid #e74c3c;border-radius:8px;padding:14px 16px;margin-bottom:24px;">
      <p style="margin:0;color:#c0392b;font-size:13px;">
        Si vous avez payé une caution, elle vous sera remboursée sous 24-48h.
      </p>
    </div>

    <div style="text-align:center;">
      <a href="http://localhost:3000/cars" style="display:inline-block;background:#1a6b3c;color:#fff;padding:14px 32px;border-radius:50px;text-decoration:none;font-weight:700;font-size:15px;">
        Trouver une autre voiture →
      </a>
    </div>
  `)

  return sendEmail({
    to:      user.email,
    subject: `❌ Réservation annulée — ${car.brand} ${car.model}`,
    html,
  })
}


// ── 7. Instructions de paiement → locataire ──
const sendPaymentInstructions = async (renter, car, booking, method = 'mtn') => {
  const ops = {
    mtn:  { name: 'MTN MoMo',   number: '+229 01 XX XX XX', color: '#f5a623', bg: '#fff8ed' },
    moov: { name: 'Moov Money', number: '+229 02 XX XX XX', color: '#0066cc', bg: '#eef4ff' },
  }
  const op    = ops[method] || ops.mtn
  const total = (booking.totalPrice || 0) + (booking.depositAmount || 0)

  const html = baseTemplate(`
    <h2 style="color:#0d1f13;font-size:22px;margin:0 0 8px;">Instructions de paiement 📱</h2>
    <p style="color:#5a7a62;font-size:15px;margin:0 0 20px;">
      Votre réservation pour <strong>${car.brand} ${car.model}</strong> est créée.
      Effectuez votre paiement pour la confirmer.
    </p>
    <div style="background:${op.bg};border:2px solid ${op.color};border-radius:16px;padding:20px;margin-bottom:20px;">
      <div style="font-weight:700;font-size:14px;color:${op.color};margin-bottom:12px;">📱 Paiement via ${op.name}</div>
      <p style="margin:6px 0;font-size:14px;color:#5a7a62;">Numéro AutoBénin : <strong style="font-size:18px;color:${op.color};">${op.number}</strong></p>
      <p style="margin:6px 0;font-size:14px;color:#5a7a62;">Montant exact : <strong style="font-size:20px;color:#1a6b3c;">${fmt(total)}</strong></p>
      <p style="margin:6px 0;font-size:14px;color:#5a7a62;">Référence : <strong>AutoBénin - ${car.brand} ${car.model}</strong></p>
    </div>
    <div style="background:#fdecea;border:1px solid #e74c3c;border-radius:8px;padding:12px;color:#c0392b;font-size:13px;margin-bottom:16px;">
      ⚠️ Le propriétaire confirmera votre réservation après réception du paiement.
    </div>
    <div style="text-align:center;">
      <a href="http://localhost:3000/profile" style="display:inline-block;background:#1a6b3c;color:#fff;padding:14px 32px;border-radius:50px;text-decoration:none;font-weight:700;font-size:15px;">Voir ma réservation →</a>
    </div>
  `)

  return sendEmail({
    to:      renter.email,
    subject: `📱 Instructions de paiement — ${car.brand} ${car.model}`,
    html,
  })
}

module.exports = {
  sendWelcomeEmail,
  sendBookingNotifOwner,
  sendBookingConfirmedRenter,
  sendPaymentConfirmedRenter,
  sendPaymentNotifOwner,
  sendCancellationEmail,
  sendPaymentInstructions,
}