import { Link } from 'react-router-dom'
import EstadoVacio from '../components/ui/EstadoVacio.jsx'
import { MENSAJES, TEXTOS } from '../constants/messages.js'
import { RUTA_INICIAL_POR_ROL } from '../constants/navegacion.js'
import { useAuth } from '../context/AuthContext.jsx'
import estilos from './ErrorRutaPage.module.css'

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

export const SinPermisoPage = () => (
  <PaginaDeError titulo={TEXTOS.sinPermisoTitulo} texto={MENSAJES.sinPermiso} />
)

export const NoEncontradaPage = () => (
  <PaginaDeError titulo={TEXTOS.paginaNoEncontrada} texto={TEXTOS.paginaNoEncontradaDetalle} />
)
