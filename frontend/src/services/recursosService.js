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
export const obtenerReserva = (id) => llamarApi(`/reservas/${id}`)

/** Aviso inmediato de disponibilidad. { ambienteId, fecha (aaaa-mm-dd), horaInicio, horaFin } */
export const consultarDisponibilidad = (consulta) => {
  const parametros = new URLSearchParams({
    ambienteId: String(consulta.ambienteId),
    fecha: consulta.fecha,
    horaInicio: consulta.horaInicio,
    horaFin: consulta.horaFin,
  })
  return llamarApi(`/reservas/disponibilidad?${parametros}`)
}

export const aprobarReserva = (id) => llamarApi(`/reservas/${id}/aprobar`, { method: 'POST' })
export const rechazarReserva = (id) => llamarApi(`/reservas/${id}/rechazar`, { method: 'POST' })
export const cancelarReserva = (id) => llamarApi(`/reservas/${id}/cancelar`, { method: 'POST' })

export const crearReserva = (reserva, { signal } = {}) =>
  llamarApi('/reservas', { method: 'POST', body: reserva, signal })
