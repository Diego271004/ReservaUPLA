import { useState } from 'react'
import { NavLink, Outlet } from 'react-router-dom'
import { OPCIONES_MENU } from '../../constants/navegacion'
import { MENSAJES } from '../../constants/messages'
import estilos from './Layout.module.css'

// Único Layout con menú lateral (hallazgo G1): ancho, relleno e ítem activo se definen solo aquí.
export default function Layout() {
  const [menuAbierto, setMenuAbierto] = useState(false)

  return (
    <div className={estilos.contenedor}>
      <aside className={estilos.menu}>
        <div className={estilos.cabecera}>
          <span className={estilos.nombre}>{MENSAJES.nombreSistema}</span>
          <button
            type="button"
            className={estilos.botonMenu}
            aria-expanded={menuAbierto}
            aria-controls="menu-principal"
            onClick={() => setMenuAbierto((abierto) => !abierto)}
          >
            Menú
          </button>
        </div>
        <nav
          id="menu-principal"
          aria-label="Principal"
          className={`${estilos.navegacion} ${menuAbierto ? estilos.abierto : ''}`}
        >
          {OPCIONES_MENU.map((opcion) => (
            <NavLink
              key={opcion.ruta}
              to={opcion.ruta}
              end
              className={({ isActive }) => `${estilos.opcion} ${isActive ? estilos.activa : ''}`}
              onClick={() => setMenuAbierto(false)}
            >
              {opcion.texto}
            </NavLink>
          ))}
        </nav>
      </aside>
      <main className={estilos.contenido}>
        <Outlet />
      </main>
    </div>
  )
}
