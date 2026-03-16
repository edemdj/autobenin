import api from './api'

// Liste des voitures avec filtres optionnels
// params: { city, type, transmission, fuel, minPrice, maxPrice }
export const getCars = (params = {}) => api.get('/cars', { params })

// Détail d'une voiture
export const getCarById = (id) => api.get(`/cars/${id}`)

// Créer une voiture (propriétaire) — avec photos (FormData)
export const createCar = (formData) => api.post('/cars', formData, {
  headers: { 'Content-Type': 'multipart/form-data' }
})

// Modifier une voiture
export const updateCar = (id, data) => api.put(`/cars/${id}`, data)

// Supprimer une voiture
export const deleteCar = (id) => api.delete(`/cars/${id}`)

// Voitures du propriétaire connecté
export const getMyCars = () => api.get('/cars/owner/me')