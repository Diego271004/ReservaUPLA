import { TEXTOS } from './messages.js'
import { ROLES } from './navegacion.js'

const { administrador, solicitante, responsable } = ROLES

/**
 * Única tabla de las pantallas protegidas: dirección, título, roles que pueden entrar y, si no está en el menú,
 * desde qué pantallas se llega ("contextual"). App.jsx arma el router con ella, rutas.test.jsx la compara con el
 * menú y tools/usabilidad/mapa-del-sitio.mjs la convierte en el mapa del sitio.
 */
export const RUTAS = Object.freeze([
  { ruta: '/dashboard', titulo: TEXTOS.tituloDashboard, roles: [administrador] },
  { ruta: '/ambientes', titulo: TEXTOS.tituloAmbientes, roles: [administrador] },
  { ruta: '/ambientes/nuevo', titulo: TEXTOS.tituloRegistrarAmbiente, roles: [administrador] },
  { ruta: '/usuarios', titulo: TEXTOS.tituloUsuarios, roles: [administrador] },
  { ruta: '/usuarios/nuevo', titulo: TEXTOS.tituloRegistrarUsuario, roles: [administrador] },
  {
    ruta: '/reservas/nueva',
    titulo: TEXTOS.tituloNuevaReserva,
    roles: [administrador, solicitante],
  },
  { ruta: '/reservas', titulo: TEXTOS.tituloReservas, roles: [administrador, solicitante] },
  {
    ruta: '/reservas/:id',
    titulo: TEXTOS.tituloDetalleReserva,
    roles: [administrador, solicitante, responsable],
    contextual: true,
    desde: ['/reservas', '/dashboard', '/reservas/nueva', '/mi-ambiente'],
  },
  { ruta: '/mi-ambiente', titulo: TEXTOS.tituloMiAmbiente, roles: [responsable] },
])
