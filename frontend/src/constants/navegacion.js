// Roles tal como los devuelve la API (enumerado RolUsuario del backend).
export const ROLES = Object.freeze({
  administrador: 'Administrador',
  solicitante: 'Solicitante',
  responsable: 'Responsable',
})

// Texto con que se muestra cada rol (el diseño dice "Responsable de ambiente").
export const NOMBRE_DE_ROL = Object.freeze({
  Administrador: 'Administrador',
  Solicitante: 'Solicitante',
  Responsable: 'Responsable de ambiente',
})

// Opciones de las listas cerradas (mismos valores que valida el backend).
export const OPCIONES_ROL = Object.keys(NOMBRE_DE_ROL).map((valor) => ({
  valor,
  etiqueta: NOMBRE_DE_ROL[valor],
}))
export const OPCIONES_TIPO = ['Laboratorio', 'Auditorio', 'Sala'].map((valor) => ({
  valor,
  etiqueta: valor,
}))
export const OPCIONES_ESTADO_AMBIENTE = ['Disponible', 'En mantenimiento'].map((valor) => ({
  valor,
  etiqueta: valor,
}))

// Menú lateral por rol (docs/diseno/DESIGN.md). "exacta" evita que /reservas quede activa en /reservas/nueva.
const DASHBOARD = { ruta: '/dashboard', texto: 'Dashboard', exacta: true }
const RESERVAS = { ruta: '/reservas', texto: 'Reservas', exacta: true }
const NUEVA_RESERVA = { ruta: '/reservas/nueva', texto: 'Nueva reserva', exacta: true }
const AMBIENTES = { ruta: '/ambientes', texto: 'Ambientes', exacta: false }
const USUARIOS = { ruta: '/usuarios', texto: 'Usuarios', exacta: false }
const MI_AMBIENTE = { ruta: '/mi-ambiente', texto: 'Mi ambiente', exacta: true }

export const MENU_POR_ROL = Object.freeze({
  [ROLES.administrador]: [DASHBOARD, RESERVAS, NUEVA_RESERVA, AMBIENTES, USUARIOS],
  [ROLES.solicitante]: [RESERVAS, NUEVA_RESERVA],
  [ROLES.responsable]: [MI_AMBIENTE],
})

// Primera pantalla de cada rol. Dashboard, Reservas y Mi ambiente llegan en fases posteriores:
// hasta entonces cada rol aterriza en una pantalla que ya existe.
export const RUTA_INICIAL_POR_ROL = Object.freeze({
  [ROLES.administrador]: '/ambientes',
  [ROLES.solicitante]: '/reservas/nueva',
  [ROLES.responsable]: '/mi-ambiente',
})
