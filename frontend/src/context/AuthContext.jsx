import { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react'
import { registrarSesionExpirada } from '../services/apiClient.js'
import { borrarSesion, guardarSesion, leerSesion } from '../services/sesionStorage.js'

const AuthContext = createContext(null)

export function AuthProvider({ children }) {
  const [sesion, setSesion] = useState(() => leerSesion())
  const [sesionTerminada, setSesionTerminada] = useState(false)

  const iniciarSesion = useCallback((nuevaSesion) => {
    guardarSesion(nuevaSesion)
    setSesionTerminada(false)
    setSesion(nuevaSesion)
  }, [])

  const cerrarSesion = useCallback(() => {
    borrarSesion()
    setSesion(null)
  }, [])

  useEffect(() => {
    registrarSesionExpirada(() => {
      borrarSesion()
      setSesionTerminada(true)
      setSesion(null)
    })
    return () => registrarSesionExpirada(null)
  }, [])

  const valor = useMemo(
    () => ({ sesion, sesionTerminada, iniciarSesion, cerrarSesion }),
    [sesion, sesionTerminada, iniciarSesion, cerrarSesion],
  )
  return <AuthContext.Provider value={valor}>{children}</AuthContext.Provider>
}

export function useAuth() {
  const contexto = useContext(AuthContext)
  if (!contexto) throw new Error('useAuth debe usarse dentro de AuthProvider.')
  return contexto
}
