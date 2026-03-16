import api from './api'

// Créer une réservation
export const createBooking = (data) => api.post('/bookings', data)

// Mes réservations (locataire)
export const getMyBookings = () => api.get('/bookings/me')

// Réservations reçues (propriétaire)
export const getOwnerBookings = () => api.get('/bookings/owner')

// Accepter une réservation
export const confirmBooking = (id) => api.put(`/bookings/${id}/confirm`)

// Annuler une réservation
export const cancelBooking = (id) => api.put(`/bookings/${id}/cancel`)