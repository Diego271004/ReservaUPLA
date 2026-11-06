import { Link } from 'react-router-dom'
import EstadoVacio from '../components/ui/EstadoVacio.jsx'
import { MENSAJES, TEXTOS } from '../constants/messages.js'
import { RUTA_INICIAL_POR_ROL } from '../constants/navegacion.js'
import { useAuth } from '../context/AuthContext.jsx'
import estilos from './ErrorRutaPage.module.css'

/** Estructura común de las páginas de error de ruta: título, texto opcional y el enlace de regreso. */
function PaginaDeError({ titulo, texto }) {
  const { sesion } = useAuth()
  const inicio = sesion ? (RUTA_INICIAL_POR_ROL[sesion.rol] ?? '/dashboard') : '/login'
  return (
    <div className={estilos.pagina}>
      <h1 className={estilos.titulo}>{titulo}</h1>
      <EstadoVacio mensaje={texto}>
        <Link to={inicio} className={estilos.volver}>
          {TEXTOS.volverAlInicio}
        </Link>
      </EstadoVacio>
    </div>
  )
}

/** Una ruta a la que el rol no tiene acceso (el menú ya no la ofrece). */
export const SinPermisoPage = () => (
  <PaginaDeError titulo={TEXTOS.sinPermisoTitulo} texto={MENSAJES.sinPermiso} />
)

/** Una ruta que no existe. */
export const NoEncontradaPage = () => (
  <PaginaDeError
    titulo={TEXTOS.paginaNoEncontrada}
    texto={TEXTOS.paginaNoEncontradaDetalle}
  />
)
