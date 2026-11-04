import { TEXTOS } from '../constants/messages.js'
import { MENU_POR_ROL } from '../constants/navegacion.js'
import { RUTAS } from '../constants/rutas.js'

const solaRuta = (direccion) => direccion.split('?')[0]
const enElMenu = (rol, direccion) =>
  MENU_POR_ROL[rol]?.some((opcion) => opcion.ruta === solaRuta(direccion)) ?? false

/**
 * A dónde regresa el detalle de una reserva: la lista o el panel de donde se vino (con sus filtros y su página) si está
 * en el menú de quien mira y es una de las pantallas desde las que se llega al detalle; si no, la primera pantalla de origen de su menú (Reservas, o Mi ambiente para la Responsable).
 * El menú lateral marca esa misma sección (sin migas de pan).
 */
export function rutaDeRegreso(rol, origen) {
  const { desde } = RUTAS.find((r) => r.ruta === '/reservas/:id')
  if (origen && desde.includes(solaRuta(origen)) && enElMenu(rol, origen)) return origen
  return desde.find((ruta) => enElMenu(rol, ruta)) ?? '/'
}

const TEXTO_POR_RUTA = {
  '/dashboard': TEXTOS.volverAlDashboard,
  '/mi-ambiente': TEXTOS.volverAMiAmbiente,
}

/** El texto del enlace de regreso: se llama como la pantalla a la que lleva. */
export const textoDeRegreso = (direccion) =>
  TEXTO_POR_RUTA[solaRuta(direccion)] ?? TEXTOS.volverAReservas
