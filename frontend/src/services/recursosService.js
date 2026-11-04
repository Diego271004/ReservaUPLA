import { llamarApi } from './llamarApi.js'

// Usuarios (solo Administrador)
export const listarUsuarios = (rol) =>
  llamarApi(rol ? `/usuarios?rol=${encodeURIComponent(rol)}` : '/usuarios')

export const crearUsuario = (usuario, { signal } = {}) =>
  llamarApi('/usuarios', { method: 'POST', body: usuario, signal })

// Ambientes (cualquier usuario con sesión lista; solo el Administrador crea)
export const listarAmbientes = () => llamarApi('/ambientes')

export const crearAmbiente = (ambiente, { signal } = {}) =>
  llamarApi('/ambientes', { method: 'POST', body: ambiente, signal })

// Reservas
export const crearReserva = (reserva, { signal } = {}) =>
  llamarApi('/reservas', { method: 'POST', body: reserva, signal })
