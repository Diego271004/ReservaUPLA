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

/**
 * Las migas de pan de la barra superior: [{ texto, ruta? }]. Una sección del menú es una sola miga; el detalle de una
 * reserva cuelga de su pantalla de origen (con sus filtros) y los formularios de registro, de su listado.
 */
export function migasDe(pathname, rol, volverA) {
  const pantalla = RUTAS.find((r) => matchPath({ path: r.ruta, end: true }, pathname))
  if (!pantalla) return [{ texto: TEXTOS.paginaNoEncontrada }]
  if (!pantalla.roles.includes(rol)) return [{ texto: TEXTOS.sinPermisoTitulo }]
  const padre =
    pantalla.ruta === '/reservas/:id' ? rutaDeRegreso(rol, volverA) : PADRE_DE[pantalla.ruta]
  return padre ? [{ texto: tituloDe(padre), ruta: padre }, { texto: pantalla.titulo }] : []
}

/**
 * Título de la barra superior para rutas raíz de nivel 1.
 * En todas las rutas raíz (/dashboard, /disponibilidad, /reservas, /ambientes, /usuarios, /mi-ambiente),
 * la barra superior se mantiene limpia y despejada a la izquierda para centrar el 100% del foco
 * en el encabezado principal (h1) del contenido. Solo devuelve texto en rutas de error (403, 404).
 */
export function seccionActualDe(pathname, rol) {
  const pantalla = RUTAS.find((r) => matchPath({ path: r.ruta, end: true }, pathname))
  if (!pantalla) return TEXTOS.paginaNoEncontrada
  if (!pantalla.roles.includes(rol)) return TEXTOS.sinPermisoTitulo
  return null
}
