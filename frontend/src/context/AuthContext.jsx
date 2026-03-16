import { createContext, useContext, useState, useEffect } from 'react'
import api from '../services/api'

const AuthContext = createContext()

export const AuthProvider = ({ children }) => {
  const [user,    setUser]    = useState(null)
  const [token,   setToken]   = useState(localStorage.getItem('token'))
  const [loading, setLoading] = useState(true) // chargement initial

  // Au démarrage : recharge l'utilisateur si un token existe
  useEffect(() => {
    const savedToken = localStorage.getItem('token')
    if (savedToken) {
      api.get('/auth/me')
        .then(res => setUser(res.data))
        .catch(() => {
          // Token invalide → nettoyage
          localStorage.removeItem('token')
          setToken(null)
        })
        .finally(() => setLoading(false))
    } else {
      setLoading(false)
    }
  }, [])

  const login = (userData, userToken) => {
    setUser(userData)
    setToken(userToken)
    localStorage.setItem('token', userToken)
  }

  const logout = () => {
    setUser(null)
    setToken(null)
    localStorage.removeItem('token')
  }

  return (
    <AuthContext.Provider value={{ user, token, login, logout, loading }}>
      {children}
    </AuthContext.Provider>
  )
}

export const useAuth = () => useContext(AuthContext)
