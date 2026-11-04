import { MENSAJES, TEXTOS } from '../constants/messages.js'
import { ROLES } from '../constants/navegacion.js'

const dosDigitos = (numero) => String(numero).padStart(2, '0')

/** Fecha y hora local de un instante ISO como dd/mm/aaaa HH:mm. */
export function fechaHoraLocal(iso) {
  const fecha = new Date(iso)
  const dia = `${dosDigitos(fecha.getDate())}/${dosDigitos(fecha.getMonth() + 1)}/${fecha.getFullYear()}`
  return `${dia} ${dosDigitos(fecha.getHours())}:${dosDigitos(fecha.getMinutes())}`
}

/** Un evento del historial contado en una frase: quién, qué y cuándo. */
export function textoDeEvento({ estadoAnterior, estadoNuevo, usuarioNombre, fecha }) {
  const cuando = fechaHoraLocal(fecha)
  if (estadoAnterior === null || estadoAnterior === undefined) {
    return `Solicitud registrada por ${usuarioNombre}, ${cuando}`
  }
  return `Reserva ${estadoNuevo.toLowerCase()} por ${usuarioNombre}, ${cuando}`
}

const AVISO_POR_ESTADO_FINAL = {
  Rechazada: MENSAJES.reservaRechazadaNoSeModifica,
  Cancelada: MENSAJES.reservaCanceladaNoSeModifica,
}

/**
 * Qué acciones muestra el detalle de una reserva a quien lo mira. Es una ayuda para el usuario: el backend es quien decide
 * (403 y 409).
 *  - RN-05: solo el Administrador ve Aprobar y Rechazar; la Responsable no ve ninguna acción; la Solicitante solo
 *    cancela su propia solicitud.
 *  - RN-06: una reserva Rechazada o Cancelada muestra las acciones deshabilitadas y un aviso informativo.
 * Devuelve { acciones: [{ id, texto, habilitada }], aviso }. El orden es el visual: la secundaria "cancelar" a la izquierda
 * y el primario "aprobar" al extremo derecho.
 */
export function accionesDeReserva(actor, reserva) {
  const esFinal = reserva.estado in AVISO_POR_ESTADO_FINAL
  const aviso = esFinal ? AVISO_POR_ESTADO_FINAL[reserva.estado] : null

  if (actor.rol === ROLES.administrador) {
    const acciones = [{ id: 'cancelar', texto: TEXTOS.cancelarReserva, habilitada: !esFinal }]
    if (esFinal || reserva.estado === 'Pendiente') {
      acciones.push(
        { id: 'rechazar', texto: TEXTOS.rechazar, habilitada: !esFinal },
        { id: 'aprobar', texto: TEXTOS.aprobar, habilitada: !esFinal },
      )
    }
    return { acciones, aviso }
  }

  if (actor.rol === ROLES.solicitante && reserva.usuarioId === actor.usuarioId) {
    return {
      acciones: [{ id: 'cancelar', texto: TEXTOS.cancelarSolicitud, habilitada: !esFinal }],
      aviso,
    }
  }

  return { acciones: [], aviso: null }
}

/** El tipo de insignia de cada estado de una reserva (Reservas, Mi ambiente y el detalle la comparten). */
export const TIPO_INSIGNIA_DE_ESTADO = Object.freeze({
  Pendiente: 'pendiente',
  Aprobada: 'aprobada',
  Rechazada: 'rechazada',
  Cancelada: 'cancelada',
})
