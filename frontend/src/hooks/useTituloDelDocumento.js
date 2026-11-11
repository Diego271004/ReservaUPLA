import { useEffect } from 'react'
import { useLocation } from 'react-router-dom'
import { useAuth } from '../context/AuthContext.jsx'
import { tituloDelDocumento } from '../utils/tituloDelDocumento.js'

export function useTituloDelDocumento() {
  const { pathname } = useLocation()
  const { sesion } = useAuth()
  const rol = sesion?.rol
  useEffect(() => {
    document.title = tituloDelDocumento(pathname, rol)
  }, [pathname, rol])
}
