import { useState, useEffect } from 'react'
import { getCars } from '../services/carService'
import { ALL_CARS } from '../data/cars'

// Hook qui charge les voitures depuis l'API
// Si l'API échoue (backend éteint), utilise les données locales comme fallback
const useCars = (filters = {}) => {
  const [cars,    setCars]    = useState([])
  const [loading, setLoading] = useState(true)
  const [error,   setError]   = useState(null)
  const [source,  setSource]  = useState('api') // 'api' ou 'local'

  useEffect(() => {
    setLoading(true)
    getCars(filters)
      .then(res => {
        // Si l'API renvoie des données → on les utilise
        const data = res.data
        if (data && data.length > 0) {
          setCars(data)
          setSource('api')
        } else {
          // API vide → données locales
          setCars(ALL_CARS)
          setSource('local')
        }
      })
      .catch(() => {
        // API inaccessible → données locales
        setCars(ALL_CARS)
        setSource('local')
        setError(null) // pas d'erreur visible — fallback silencieux
      })
      .finally(() => setLoading(false))
  }, [JSON.stringify(filters)])

  return { cars, loading, error, source }
}

export default useCars