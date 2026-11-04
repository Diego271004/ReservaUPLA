import { TEXTOS } from '../constants/messages.js'
import { isoAFecha } from './fechas.js'

/** Qué pide cada modal de confirmación de una reserva (el Detalle y el Dashboard usan los mismos). */
export const MODALES = Object.freeze({
  aprobar: {
    titulo: TEXTOS.tituloModalAprobar,
    confirmar: TEXTOS.confirmarAprobar,
    variante: 'primario',
  },
  rechazar: {
    titulo: TEXTOS.tituloModalRechazar,
    confirmar: TEXTOS.confirmarRechazar,
    variante: 'rechazo',
    irreversible: true, // Rechazada es un estado final (RN-06)
  },
  cancelar: {
    titulo: TEXTOS.tituloModalCancelar,
    confirmar: TEXTOS.confirmarCancelar,
    variante: 'primario',
    irreversible: true, // Cancelada es un estado final (RN-06)
  },
})

/** El resumen que se muestra dentro del modal: de qué reserva se trata. */
export function resumenDe(reserva) {
  return [
    `Ambiente: ${reserva.ambienteNombre}`,
    `Solicitante: ${reserva.solicitanteNombre}`,
    `Horario: ${isoAFecha(reserva.fecha)}, ${reserva.horaInicio} – ${reserva.horaFin}`,
  ]
}
