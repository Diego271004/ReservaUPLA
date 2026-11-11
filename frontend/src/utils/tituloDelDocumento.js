import { matchPath } from 'react-router-dom'
import { TEXTOS } from '../constants/messages.js'
import { RUTAS } from '../constants/rutas.js'

const conProducto = (titulo) => `${titulo} · ${TEXTOS.nombreProducto}`

export function tituloDelDocumento(direccion, rol) {
  if (direccion === '/login') return conProducto(TEXTOS.tituloLogin)
  if (direccion === '/' || !rol) return TEXTOS.nombreProducto
  const pantalla = RUTAS.find((r) => matchPath({ path: r.ruta, end: true }, direccion))
  if (!pantalla) return conProducto(TEXTOS.paginaNoEncontrada)
  return conProducto(pantalla.roles.includes(rol) ? pantalla.titulo : TEXTOS.sinPermisoTitulo)
}
