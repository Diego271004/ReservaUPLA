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
const INICIO = { ruta: '/dashboard', texto: 'Inicio', icono: 'dashboard', exacta: true }
const RESERVAS = { ruta: '/reservas', texto: 'Reservas', icono: 'reservas', exacta: true }
const NUEVA_RESERVA = {
  ruta: '/reservas/nueva',
  texto: 'Nueva reserva',
  icono: 'nuevaReserva',
  exacta: true,
}
const AMBIENTES = { ruta: '/ambientes', texto: 'Ambientes', icono: 'ambientes', exacta: false }
const USUARIOS = { ruta: '/usuarios', texto: 'Usuarios', icono: 'usuarios', exacta: false }
const MI_AMBIENTE = {
  ruta: '/mi-ambiente',
  texto: 'Mi ambiente',
  icono: 'miAmbiente',
  exacta: true,
}
const DISPONIBILIDAD = {
  ruta: '/disponibilidad',
  texto: 'Disponibilidad',
  icono: 'calendario',
  exacta: true,
}

export const MENU_POR_ROL = Object.freeze({
  [ROLES.administrador]: [INICIO, DISPONIBILIDAD, RESERVAS, NUEVA_RESERVA, AMBIENTES, USUARIOS],
  [ROLES.solicitante]: [INICIO, DISPONIBILIDAD, RESERVAS, NUEVA_RESERVA],
  [ROLES.responsable]: [INICIO, DISPONIBILIDAD, MI_AMBIENTE],
})

// Primera pantalla de cada rol.
export const RUTA_INICIAL_POR_ROL = Object.freeze({
  [ROLES.administrador]: '/dashboard',
  [ROLES.solicitante]: '/dashboard',
  [ROLES.responsable]: '/dashboard',
})
