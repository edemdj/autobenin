const axios = require('axios')
const { v4: uuidv4 } = require('uuid')

// ── Configuration MTN MoMo Collections API ──
const MOMO_BASE_URL  = process.env.MTN_MOMO_BASE_URL  || 'https://sandbox.momodeveloper.mtn.com'
const MOMO_API_KEY   = process.env.MTN_MOMO_API_KEY
const MOMO_USER_ID   = process.env.MTN_MOMO_USER_ID
const MOMO_CURRENCY  = process.env.MTN_MOMO_CURRENCY  || 'EUR' // XOF en production Bénin
const MOMO_ENV       = process.env.MTN_MOMO_ENV       || 'sandbox'

// 1. Obtenir un token d'accès MTN MoMo
const getAccessToken = async () => {
  const credentials = Buffer.from(`${MOMO_USER_ID}:${MOMO_API_KEY}`).toString('base64')
  const res = await axios.post(
    `${MOMO_BASE_URL}/collection/token/`,
    {},
    {
      headers: {
        'Authorization': `Basic ${credentials}`,
        'Ocp-Apim-Subscription-Key': process.env.MTN_MOMO_SUBSCRIPTION_KEY,
      }
    }
  )
  return res.data.access_token
}

// 2. Initier un paiement (Request To Pay)
const requestToPay = async ({ amount, phone, bookingId, description }) => {
  const referenceId = uuidv4() // ID unique de transaction
  const token = await getAccessToken()

  await axios.post(
    `${MOMO_BASE_URL}/collection/v1_0/requesttopay`,
    {
      amount:       String(amount),
      currency:     MOMO_CURRENCY,
      externalId:   bookingId,
      payer: {
        partyIdType: 'MSISDN',
        partyId:     phone.replace(/\D/g, ''), // garder uniquement les chiffres
      },
      payerMessage: description || 'Paiement AutoBénin',
      payeeNote:    `Réservation ${bookingId}`,
    },
    {
      headers: {
        'Authorization':             `Bearer ${token}`,
        'X-Reference-Id':            referenceId,
        'X-Target-Environment':      MOMO_ENV,
        'Ocp-Apim-Subscription-Key': process.env.MTN_MOMO_SUBSCRIPTION_KEY,
        'Content-Type':              'application/json',
      }
    }
  )

  return referenceId // on le sauvegarde pour vérifier le statut
}

// 3. Vérifier le statut d'un paiement
const getPaymentStatus = async (referenceId) => {
  const token = await getAccessToken()
  const res = await axios.get(
    `${MOMO_BASE_URL}/collection/v1_0/requesttopay/${referenceId}`,
    {
      headers: {
        'Authorization':             `Bearer ${token}`,
        'X-Target-Environment':      MOMO_ENV,
        'Ocp-Apim-Subscription-Key': process.env.MTN_MOMO_SUBSCRIPTION_KEY,
      }
    }
  )
  // status: PENDING | SUCCESSFUL | FAILED
  return res.data.status
}

module.exports = { requestToPay, getPaymentStatus }