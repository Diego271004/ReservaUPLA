import { matchPath } from 'react-router-dom'
import { TEXTOS } from '../constants/messages.js'
import { RUTAS } from '../constants/rutas.js'

const conProducto = (titulo) => `${titulo} · ${TEXTOS.nombreProducto}`

/**
 * El título de la pestaña del navegador: el mismo de la pantalla (así la persona distingue pestañas e historial y
 * un lector de pantalla anuncia dónde está). Sin sesión o en la raíz, que redirige, queda solo el nombre del producto.
 */
export function tituloDelDocumento(direccion, rol) {
  if (direccion === '/login') return conProducto(TEXTOS.tituloLogin)
  if (direccion === '/' || !rol) return TEXTOS.nombreProducto
  const pantalla = RUTAS.find((r) => matchPath({ path: r.ruta, end: true }, direccion))
  if (!pantalla) return conProducto(TEXTOS.paginaNoEncontrada)
  return conProducto(pantalla.roles.includes(rol) ? pantalla.titulo : TEXTOS.sinPermisoTitulo)
}
