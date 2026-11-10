import { Link } from 'react-router-dom'
import { TEXTOS } from '../../constants/messages.js'
import { fechaAIso, hoyEnLima } from '../../utils/fechas.js'
import { seccionActualDe } from '../../utils/migas.js'
import Button from '../ui/Button.jsx'
import InterruptorDeTema from '../ui/InterruptorDeTema.jsx'
import { Icono } from '../ui/Icono.jsx'
import MenuDeUsuario from './MenuDeUsuario.jsx'
import estilos from './Topbar.module.css'

function Migas({ migas }) {
  const padre = migas.find((m) => m.ruta)
  return (
    <nav aria-label={TEXTOS.migasDePan} className={estilos.migas}>
      {padre && (
        <Link
          to={padre.ruta}
          className={estilos.enlaceRegresoMovil}
          aria-label={`‹ ${padre.texto}`}
        >
          ‹ {padre.texto}
        </Link>
      )}
      <ol className={estilos.listaEscritorio}>
        {migas.map((miga, indice) => (
          <li key={miga.texto}>
            {miga.ruta ? (
              <Link to={miga.ruta}>{miga.texto}</Link>
            ) : (
              <span aria-current={indice === migas.length - 1 ? 'page' : undefined}>
                {miga.texto}
              </span>
            )}
          </li>
        ))}
      </ol>
    </nav>
  )
}

/** Barra superior: hamburguesa (móvil), migas o título de sección, fecha de hoy en Lima y menú de usuario. */
export default function Topbar({
  sesion,
  migas = [],
  pathname = '',
  panelAbierto,
  alAbrirPanel,
  alCerrarSesion,
}) {
  const hoy = hoyEnLima()
  const tituloSeccion = seccionActualDe(pathname, sesion?.rol)

  return (
    <header className={estilos.barra}>
      <div className={estilos.hamburguesa}>
        <Button
          variante="icono"
          aria-label={TEXTOS.menuAbrir}
          aria-expanded={panelAbierto}
          aria-controls="panel-menu"
          onClick={alAbrirPanel}
        >
          <Icono nombre="menu" tamano={22} />
        </Button>
      </div>
      <div className={estilos.areaNavegacion}>
        {migas.length > 0 ? (
          <Migas migas={migas} />
        ) : tituloSeccion ? (
          <span className={estilos.tituloSeccion} aria-hidden="true">
            {tituloSeccion}
          </span>
        ) : null}
      </div>
      <p className={estilos.fecha}>
        <Icono nombre="calendario" tamano={18} />
        <span className="solo-lector">{TEXTOS.hoyEs}: </span>
        <time dateTime={fechaAIso(hoy)}>{hoy}</time>
      </p>
      <InterruptorDeTema />
      <MenuDeUsuario sesion={sesion} alCerrarSesion={alCerrarSesion} />
    </header>
  )
}
