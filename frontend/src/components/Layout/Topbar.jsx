import { Link } from 'react-router-dom'
import { TEXTOS } from '../../constants/messages.js'
import { fechaAIso, hoyEnLima } from '../../utils/fechas.js'
import Button from '../ui/Button.jsx'
import { Icono } from '../ui/Icono.jsx'
import MenuDeUsuario from './MenuDeUsuario.jsx'
import estilos from './Topbar.module.css'

function Migas({ migas }) {
  return (
    <nav aria-label={TEXTOS.migasDePan} className={estilos.migas}>
      <ol>
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

/** Barra superior: hamburguesa (móvil), migas de pan, fecha de hoy en Lima y menú de usuario. */
export default function Topbar({ sesion, migas, panelAbierto, alAbrirPanel, alCerrarSesion }) {
  const hoy = hoyEnLima()
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
      <Migas migas={migas} />
      <p className={estilos.fecha}>
        <Icono nombre="calendario" tamano={18} />
        <span className="solo-lector">{TEXTOS.hoyEs}: </span>
        <time dateTime={fechaAIso(hoy)}>{hoy}</time>
      </p>
      <MenuDeUsuario sesion={sesion} alCerrarSesion={alCerrarSesion} />
    </header>
  )
}
