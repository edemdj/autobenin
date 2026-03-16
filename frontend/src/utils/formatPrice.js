// 25000 → "25 000 FCFA"
export const formatPrice = (amount) =>
  new Intl.NumberFormat('fr-FR').format(amount) + ' FCFA'