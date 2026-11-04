import { Link } from 'react-router-dom'
import { MENSAJES, TEXTOS } from '../constants/messages.js'

/** Página para una ruta que no existe o a la que el rol no tiene acceso (el menú ya no la ofrece). */
export function SinPermisoPage() {
  return (
    <>
      <h1>{TEXTOS.sinPermisoTitulo}</h1>
      <p>{MENSAJES.sinPermiso}</p>
      <Link to="/">{TEXTOS.volverAlInicio}</Link>
    </>
  )
}

export function NoEncontradaPage() {
  return (
    <>
      <h1>{TEXTOS.paginaNoEncontrada}</h1>
      <Link to="/">{TEXTOS.volverAlInicio}</Link>
    </>
  )
}
