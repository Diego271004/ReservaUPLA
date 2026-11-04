import { Link } from 'react-router-dom'
import { MENSAJES, TEXTOS } from '../constants/messages.js'

/** Estructura común de las páginas de error de ruta: título, texto opcional y el enlace de regreso. */
function PaginaDeError({ titulo, texto }) {
  return (
    <>
      <h1>{titulo}</h1>
      {texto && <p>{texto}</p>}
      <Link to="/">{TEXTOS.volverAlInicio}</Link>
    </>
  )
}

/** Una ruta a la que el rol no tiene acceso (el menú ya no la ofrece). */
export const SinPermisoPage = () => (
  <PaginaDeError titulo={TEXTOS.sinPermisoTitulo} texto={MENSAJES.sinPermiso} />
)

/** Una ruta que no existe. */
export const NoEncontradaPage = () => <PaginaDeError titulo={TEXTOS.paginaNoEncontrada} />
