import { useRef } from 'react'
import { Link, NavLink } from 'react-router-dom'
import { TEXTOS, textoPendientes } from '../../constants/messages.js'
import { useTrampaDeFoco } from '../../hooks/useTrampaDeFoco.js'
import logo from '../../assets/logo-upla-menu.webp'
import Button from '../ui/Button.jsx'
import { Icono } from '../ui/Icono.jsx'
import estilos from './Layout.module.css'

/** Lo que lleva cada opción: icono, texto y, junto a «Reservas», el contador de pendientes del Administrador. */
function Contenido({ opcion, pendientes }) {
  const contador = opcion.ruta === '/reservas' ? pendientes : 0
  return (
    <>
      <Icono nombre={opcion.icono} tamano={20} className={estilos.iconoOpcion} />
      <span className={estilos.textoOpcion}>{opcion.texto}</span>
      {contador > 0 && (
        <span className={estilos.contador}>
          <span aria-hidden="true">{contador}</span>
          <span className="solo-lector">{textoPendientes(contador)}</span>
        </span>
      )}
    </>
  )
}

/**
 * El menú lateral marino. En escritorio puede contraerse a solo iconos; en móvil es un panel que se desliza desde la
 * izquierda con el foco atrapado (Esc o «Cerrar menú» lo cierran y el foco vuelve a la hamburguesa).
 */
export default function MenuLateral({
  opciones,
  origen,
  pendientes,
  colapsado,
  alternarColapso,
  abierto,
  alCerrar,
}) {
  const panelRef = useRef(null)
  const alPulsarTecla = useTrampaDeFoco(abierto, panelRef, { alEscape: alCerrar })

  const esAdminRuta = (ruta) => ruta === '/ambientes' || ruta === '/usuarios'
  const opcionesReservas = opciones.filter((o) => !esAdminRuta(o.ruta))
  const opcionesAdmin = opciones.filter((o) => esAdminRuta(o.ruta))

  const renderOpcion = (opcion) => {
    const contador = opcion.ruta === '/reservas' ? pendientes : 0
    const etiquetaAccesible =
      contador > 0 ? `${opcion.texto}, ${textoPendientes(contador)}` : opcion.texto

    const propsComunes = {
      'aria-label': colapsado ? etiquetaAccesible : undefined,
      title: colapsado ? opcion.texto : undefined,
    }

    return opcion.ruta === origen ? (
      <Link
        key={opcion.ruta}
        to={opcion.ruta}
        aria-current="true"
        {...propsComunes}
        className={`${estilos.opcion} ${estilos.activa}`}
        onClick={alCerrar}
      >
        <Contenido opcion={opcion} pendientes={pendientes} />
      </Link>
    ) : (
      <NavLink
        key={opcion.ruta}
        to={opcion.ruta}
        end={opcion.exacta}
        {...propsComunes}
        className={({ isActive }) => `${estilos.opcion} ${isActive ? estilos.activa : ''}`}
        onClick={alCerrar}
      >
        <Contenido opcion={opcion} pendientes={pendientes} />
      </NavLink>
    )
  }

  return (
    <aside
      id="panel-menu"
      ref={panelRef}
      className={estilos.menu}
      data-colapsado={colapsado}
      data-abierto={abierto}
      onKeyDown={abierto ? alPulsarTecla : undefined}
    >
      <div className={estilos.cabecera}>
        <div className={estilos.identidad}>
          <span className={estilos.logo}>
            <img src={logo} width="69" height="80" alt={TEXTOS.universidad} />
          </span>
          <span className={estilos.marca}>{TEXTOS.nombreProducto}</span>
        </div>
        <div className={estilos.cerrarPanel}>
          <Button variante="sobreOscuroIcono" aria-label={TEXTOS.menuCerrar} onClick={alCerrar}>
            <Icono nombre="equis" tamano={20} />
          </Button>
        </div>
      </div>
      <nav id="menu-principal" aria-label="Principal" className={estilos.navegacion}>
        <div className={estilos.grupoNav} role="group" aria-labelledby="grupo-reservas-titulo">
          <span id="grupo-reservas-titulo" className={estilos.etiquetaGrupo}>
            Reservas
          </span>
          <ul className={estilos.listaOpciones} role="list">
            {opcionesReservas.map((opcion) => (
              <li key={opcion.ruta} role="listitem">
                {renderOpcion(opcion)}
              </li>
            ))}
          </ul>
        </div>

        {opcionesAdmin.length > 0 && (
          <div className={estilos.grupoNav} role="group" aria-labelledby="grupo-admin-titulo">
            <span id="grupo-admin-titulo" className={estilos.etiquetaGrupo}>
              Administración
            </span>
            <ul className={estilos.listaOpciones} role="list">
              {opcionesAdmin.map((opcion) => (
                <li key={opcion.ruta} role="listitem">
                  {renderOpcion(opcion)}
                </li>
              ))}
            </ul>
          </div>
        )}
      </nav>
      <div className={estilos.pieMenu}>
        <Button
          variante="sobreOscuroIcono"
          aria-label={colapsado ? TEXTOS.menuExpandir : TEXTOS.menuContraer}
          title={colapsado ? TEXTOS.menuExpandir : TEXTOS.menuContraer}
          aria-expanded={!colapsado}
          aria-controls="menu-principal"
          onClick={alternarColapso}
        >
          <Icono nombre={colapsado ? 'expandir' : 'contraer'} tamano={20} />
        </Button>
      </div>
    </aside>
  )
}
