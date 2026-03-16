import api from './api'
export const initPayment         = (data) => api.post('/payments/init', data)
export const checkPaymentStatus  = (id)   => api.get(`/payments/${id}/status`)