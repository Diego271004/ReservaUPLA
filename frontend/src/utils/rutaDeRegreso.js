import { TEXTOS } from '../constants/messages.js'
import { MENU_POR_ROL } from '../constants/navegacion.js'
import { RUTAS } from '../constants/rutas.js'

const solaRuta = (direccion) => direccion.split('?')[0]
const enElMenu = (rol, direccion) =>
  MENU_POR_ROL[rol]?.some((opcion) => opcion.ruta === solaRuta(direccion)) ?? false

export function rutaDeRegreso(rol, origen) {
  const { desde } = RUTAS.find((r) => r.ruta === '/reservas/:id')
  if (origen && desde.includes(solaRuta(origen)) && enElMenu(rol, origen)) return origen
  return '/dashboard'
}

const TEXTO_POR_RUTA = {
  '/dashboard': TEXTOS.volverAlDashboard,
  '/mi-ambiente': TEXTOS.volverAMiAmbiente,
}

export const textoDeRegreso = (direccion) =>
  TEXTO_POR_RUTA[solaRuta(direccion)] ?? TEXTOS.volverAReservas
