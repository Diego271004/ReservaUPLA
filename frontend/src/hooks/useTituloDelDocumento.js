import { useEffect } from 'react'
import { useLocation } from 'react-router-dom'
import { useAuth } from '../context/AuthContext.jsx'
import { tituloDelDocumento } from '../utils/tituloDelDocumento.js'

/** Mantiene el título de la pestaña igual al de la pantalla que se está viendo. */
export function useTituloDelDocumento() {
  const { pathname } = useLocation()
  const { sesion } = useAuth()
  const rol = sesion?.rol
  useEffect(() => {
    document.title = tituloDelDocumento(pathname, rol)
  }, [pathname, rol])
}
