import { matchPath } from 'react-router-dom'
import { TEXTOS } from '../constants/messages.js'
import { RUTAS } from '../constants/rutas.js'
import { rutaDeRegreso } from './rutaDeRegreso.js'

const PADRE_DE = {
  '/reservas/nueva': '/reservas',
  '/ambientes/nuevo': '/ambientes',
  '/usuarios/nuevo': '/usuarios',
}
const tituloDe = (ruta) => RUTAS.find((r) => r.ruta === ruta.split('?')[0])?.titulo ?? ''

export function migasDe(pathname, rol, volverA) {
  const pantalla = RUTAS.find((r) => matchPath({ path: r.ruta, end: true }, pathname))
  if (!pantalla) return [{ texto: TEXTOS.paginaNoEncontrada }]
  if (!pantalla.roles.includes(rol)) return [{ texto: TEXTOS.sinPermisoTitulo }]
  const padre =
    pantalla.ruta === '/reservas/:id' ? rutaDeRegreso(rol, volverA) : PADRE_DE[pantalla.ruta]
  return padre ? [{ texto: tituloDe(padre), ruta: padre }, { texto: pantalla.titulo }] : []
}

export function seccionActualDe(pathname, rol) {
  const pantalla = RUTAS.find((r) => matchPath({ path: r.ruta, end: true }, pathname))
  if (!pantalla) return TEXTOS.paginaNoEncontrada
  if (!pantalla.roles.includes(rol)) return TEXTOS.sinPermisoTitulo
  return null
}
