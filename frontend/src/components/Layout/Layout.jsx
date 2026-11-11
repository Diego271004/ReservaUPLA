import { useCallback, useEffect, useState } from 'react'
import { matchPath, Outlet, useLocation, useNavigate } from 'react-router-dom'
import { MENU_POR_ROL, ROLES } from '../../constants/navegacion.js'
import { useAuth } from '../../context/AuthContext.jsx'
import { PendientesProvider, usePendientes } from '../../context/PendientesContext.jsx'
import { useMenuColapsado } from '../../hooks/useMenuColapsado.js'
import { migasDe } from '../../utils/migas.js'
import { rutaDeRegreso } from '../../utils/rutaDeRegreso.js'
import MenuLateral from './MenuLateral.jsx'
import Topbar from './Topbar.jsx'
import estilos from './Layout.module.css'

const ANCHO_MOVIL = '(max-width: 767px)'

/**
 * Único Layout (hallazgo G1): menú lateral + barra superior + contenido. El menú depende del rol y se contrae en
 * escritorio (se recuerda); en móvil es un panel deslizante que abre la hamburguesa de la barra superior.
 */
export default function Layout() {
  const { sesion } = useAuth()
  if (!sesion) return null
  return (
    <PendientesProvider activo={sesion.rol === ROLES.administrador}>
      <Estructura sesion={sesion} />
    </PendientesProvider>
  )
}

function Estructura({ sesion }) {
  const { cerrarSesion } = useAuth()
  const navigate = useNavigate()
  const { pathname, state } = useLocation()
  const { pendientes } = usePendientes()
  const [colapsado, alternarColapso] = useMenuColapsado()
  const [panelAbierto, setPanelAbierto] = useState(false)

  const cerrarPanel = useCallback(() => setPanelAbierto(false), [])

  useEffect(() => {
    const consulta = window.matchMedia?.(ANCHO_MOVIL)
    if (!consulta) return undefined
    const alCambiar = (evento) => evento.matches || setPanelAbierto(false)
    consulta.addEventListener('change', alCambiar)
    return () => consulta.removeEventListener('change', alCambiar)
  }, [])

  const esDetalle = matchPath('/reservas/:id', pathname) && pathname !== '/reservas/nueva'
  const origen = esDetalle ? rutaDeRegreso(sesion.rol, state?.volverA).split('?')[0] : null

  const alCerrarSesion = () => {
    cerrarSesion()
    navigate('/login', { replace: true })
  }

  return (
    <div className={estilos.contenedor}>
      {panelAbierto && (
        <div className={estilos.fondo} data-testid="fondo-del-menu" onClick={cerrarPanel} />
      )}
      <div className={estilos.lateral} data-colapsado={colapsado}>
        <MenuLateral
          opciones={MENU_POR_ROL[sesion.rol] ?? []}
          origen={origen}
          pendientes={pendientes}
          colapsado={colapsado}
          alternarColapso={alternarColapso}
          abierto={panelAbierto}
          alCerrar={cerrarPanel}
        />
      </div>
      <div className={estilos.columna}>
        <Topbar
          sesion={sesion}
          migas={migasDe(pathname, sesion.rol, state?.volverA)}
          pathname={pathname}
          panelAbierto={panelAbierto}
          alAbrirPanel={() => setPanelAbierto(true)}
          alCerrarSesion={alCerrarSesion}
        />
        <main className={estilos.contenido}>
          <Outlet />
        </main>
      </div>
    </div>
  )
}
