import { useState, useEffect } from 'react'
import { getCarById } from '../services/carService'
import { ALL_CARS } from '../data/cars'

// Charge une voiture par ID depuis l'API, avec fallback local
const useCarDetail = (id) => {
  const [car,     setCar]     = useState(null)
  const [loading, setLoading] = useState(true)
  const [error,   setError]   = useState(null)

  useEffect(() => {
    if (!id) return
    setLoading(true)
    getCarById(id)
      .then(res => {
        setCar(res.data)
      })
      .catch(() => {
        // Fallback sur les données locales
        const local = ALL_CARS.find(c => c.id === id)
        if (local) setCar(local)
        else setError('Voiture introuvable')
      })
      .finally(() => setLoading(false))
  }, [id])

  return { car, loading, error }
}

export default useCarDetail
