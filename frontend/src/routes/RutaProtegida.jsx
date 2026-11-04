import { Navigate, Outlet, useLocation } from 'react-router-dom'
import { useAuth } from '../context/AuthContext.jsx'
import { SinPermisoPage } from '../pages/ErrorRutaPage.jsx'

/**
 * Sin sesión lleva al login; con sesión pero con un rol que no corresponde muestra "Sin permiso".
 * Es una ayuda para el usuario: el backend es quien decide (devuelve 403).
 */
export default function RutaProtegida({ roles }) {
  const { sesion } = useAuth()
  const ubicacion = useLocation()

  if (!sesion) return <Navigate to="/login" replace state={{ desde: ubicacion.pathname }} />
  if (roles && !roles.includes(sesion.rol)) return <SinPermisoPage />
  return <Outlet />
}
