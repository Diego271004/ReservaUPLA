import { MENSAJES } from '../constants/messages.js'
import { aprobarReserva, cancelarReserva, rechazarReserva } from '../services/recursosService.js'

export const ACCIONES = Object.freeze({
  aprobar: { servicio: aprobarReserva, exito: MENSAJES.reservaAprobada },
  rechazar: { servicio: rechazarReserva, exito: MENSAJES.reservaRechazada },
  cancelar: { servicio: cancelarReserva, exito: MENSAJES.reservaCancelada },
})
