import { useState } from 'react'
import { NavLink, Outlet, useNavigate } from 'react-router-dom'
import { NOMBRE_DE_ROL, MENU_POR_ROL } from '../../constants/navegacion.js'
import { TEXTOS } from '../../constants/messages.js'
import { useAuth } from '../../context/AuthContext.jsx'
import estilos from './Layout.module.css'

/**
 * Único Layout con menú lateral (hallazgo G1): ancho, relleno e ítem activo se definen solo aquí.
 * El menú depende del rol: cada persona ve solo lo que puede usar.
 */
export default function Layout() {
  const { sesion, cerrarSesion } = useAuth()
  const navigate = useNavigate()
  const [menuAbierto, setMenuAbierto] = useState(false)

  // Al cerrar la sesión (o si vence) el layout se vuelve a pintar un instante sin sesión antes de que el router redirija.
  if (!sesion) return null
  const opciones = MENU_POR_ROL[sesion.rol] ?? []

  const alCerrarSesion = () => {
    cerrarSesion()
    navigate('/login', { replace: true })
  }

  return (
    <div className={estilos.contenedor}>
      <aside className={estilos.menu}>
        <div className={estilos.cabecera}>
          <span className={estilos.marca}>{TEXTOS.nombreProducto}</span>
          <button
            type="button"
            className={estilos.botonMenu}
            aria-expanded={menuAbierto}
            aria-controls="menu-principal"
            onClick={() => setMenuAbierto((abierto) => !abierto)}
          >
            {TEXTOS.menuAbrir}
          </button>
        </div>
        <div className={`${estilos.panel} ${menuAbierto ? estilos.abierto : ''}`}>
          <div className={estilos.persona}>
            <p className={estilos.nombre}>{sesion.nombreCompleto}</p>
            <p className={estilos.rol}>{NOMBRE_DE_ROL[sesion.rol] ?? sesion.rol}</p>
          </div>
          <nav id="menu-principal" aria-label="Principal" className={estilos.navegacion}>
            {opciones.map((opcion) => (
              <NavLink
                key={opcion.ruta}
                to={opcion.ruta}
                end={opcion.exacta}
                className={({ isActive }) => `${estilos.opcion} ${isActive ? estilos.activa : ''}`}
                onClick={() => setMenuAbierto(false)}
              >
                {opcion.texto}
              </NavLink>
            ))}
          </nav>
          <button type="button" className={estilos.cerrarSesion} onClick={alCerrarSesion}>
            {TEXTOS.cerrarSesion}
          </button>
        </div>
      </aside>
      <main className={estilos.contenido}>
        <Outlet />
      </main>
    </div>
  )
}
