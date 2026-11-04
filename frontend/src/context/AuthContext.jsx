import { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react'
import { registrarSesionExpirada } from '../services/apiClient.js'
import { borrarSesion, guardarSesion, leerSesion } from '../services/sesionStorage.js'

const AuthContext = createContext(null)

/**
 * Sesión del usuario. El token vive en sessionStorage. Si la API responde 401 a una petición con token
 * (expiró o dejó de ser válido), se cierra la sesión y se recuerda el motivo para mostrarlo en el login.
 */
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
