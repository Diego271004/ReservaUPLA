import { consultaDeFiltros } from '../utils/filtrosDeReservas.js'
import { llamarApi, RESULTADO } from './llamarApi.js'

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
/**
 * La lista de Reservas de quien consulta (cada rol ve lo suyo), con filtros y página.
 * `filtros`: { estado, ambienteId, desde, hasta (dd/mm/aaaa), pagina }. Devuelve { elementos, total, pagina, tamano }.
 */
export const listarReservas = (filtros = {}) => {
  const consulta = consultaDeFiltros(filtros).toString()
  return llamarApi(consulta ? `/reservas?${consulta}` : '/reservas')
}

const ESTADOS_DE_RESERVA = ['Pendiente', 'Aprobada', 'Rechazada', 'Cancelada']

/**
 * Cuántas reservas hay en cada estado con los demás filtros aplicados (para el número de cada pestaña). Una consulta por estado;
 * si alguna falla se devuelve ese fallo, igual que cualquier otra llamada.
 */
export const contarReservasPorEstado = async (filtros = {}) => {
  const resultados = await Promise.all(
    ESTADOS_DE_RESERVA.map((estado) => listarReservas({ ...filtros, estado, pagina: 1 })),
  )
  const fallido = resultados.find((resultado) => !resultado || resultado.tipo !== RESULTADO.exito)
  if (fallido !== undefined) return fallido
  return {
    tipo: RESULTADO.exito,
    data: Object.fromEntries(
      ESTADOS_DE_RESERVA.map((estado, i) => [estado, resultados[i].data.total]),
    ),
  }
}

export const obtenerDisponibilidadDia = (fecha) =>
  llamarApi(`/reservas/disponibilidad-dia?${new URLSearchParams({ fecha }).toString()}`)

// Dashboard (solo Administrador) y Mi ambiente (solo Responsable)
export const obtenerDashboard = () => llamarApi('/dashboard')

export const obtenerMiAmbiente = ({ ambienteId, pagina } = {}) => {
  const consulta = new URLSearchParams()
  if (ambienteId) consulta.set('ambienteId', String(ambienteId))
  if (pagina > 1) consulta.set('pagina', String(pagina))
  return llamarApi(consulta.size > 0 ? `/mi-ambiente?${consulta}` : '/mi-ambiente')
}

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
