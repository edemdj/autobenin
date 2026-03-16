import api from './api'

// Inscription
export const register = (data) => api.post('/auth/register', data)

// Connexion
export const login = (data) => api.post('/auth/login', data)

// Profil de l'utilisateur connecté
export const getMe = () => api.get('/auth/me')