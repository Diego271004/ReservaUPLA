import { TEXTOS } from '../constants/messages.js'
import { INICIO_DIA, FIN_DIA } from './disponibilidad.js'
import { minutosDeHora } from './fechas.js'

/** «3 h» o «2,5 h»: las horas con una coma decimal solo si hace falta. */
const textoDeHoras = (minutos) => {
  const horas = minutos / 60
  return `${Number.isInteger(horas) ? horas : horas.toFixed(1).replace('.', ',')} h`
}

/**
 * La tasa de aprobación: de las solicitudes que ya se decidieron (aprobadas más rechazadas), cuántas se aprobaron. Las pendientes
 * y las canceladas no cuentan: todavía no se decidieron o las anuló quien las pidió.
 */
export function tasaDeAprobacion({ aprobadas = 0, rechazadas = 0 } = {}) {
  const decididas = aprobadas + rechazadas
  if (decididas === 0) return { valor: '—', detalle: TEXTOS.tasaSinDecididas }
  return {
    valor: `${Math.round((aprobadas / decididas) * 100)} %`,
    detalle: `${aprobadas} de ${decididas} solicitudes decididas`,
  }
}

/**
 * La ocupación de hoy: las horas con reserva aprobada sobre las horas disponibles (de 07:00 a 22:00) de los ambientes que hoy no
 * están en mantenimiento. `hoyEnLosAmbientes` es la agenda de hoy del dashboard: [{ estado, reservas: [{ horaInicio, horaFin }] }].
 */
export function ocupacionDeHoy(hoyEnLosAmbientes = []) {
  const disponibles = hoyEnLosAmbientes.filter((ambiente) => ambiente.estado === 'Disponible')
  if (disponibles.length === 0) return { valor: '—', detalle: TEXTOS.ocupacionSinAmbientes }
  const total = disponibles.length * (FIN_DIA - INICIO_DIA)
  const ocupados = disponibles.reduce(
    (suma, ambiente) =>
      suma +
      (ambiente.reservas ?? []).reduce((minutos, reserva) => {
        const inicio = Math.max(minutosDeHora(reserva.horaInicio), INICIO_DIA)
        const fin = Math.min(minutosDeHora(reserva.horaFin), FIN_DIA)
        return minutos + Math.max(0, fin - inicio)
      }, 0),
    0,
  )
  return {
    valor: `${Math.min(100, Math.round((ocupados / total) * 100))} %`,
    detalle: `${textoDeHoras(ocupados)} reservadas de ${textoDeHoras(total)} disponibles`,
  }
}

/** La frase de un cambio de estado: «Carla Rojas aprobó la reserva de Ana Torres», «Ana Torres registró una solicitud». */
export function fraseDeActividad({ usuarioNombre, solicitanteNombre, estadoNuevo }) {
  const propia = usuarioNombre === solicitanteNombre
  switch (estadoNuevo) {
    case 'Pendiente':
      return `${usuarioNombre} registró una solicitud`
    case 'Aprobada':
      return `${usuarioNombre} aprobó la reserva de ${solicitanteNombre}`
    case 'Rechazada':
      return `${usuarioNombre} rechazó la solicitud de ${solicitanteNombre}`
    case 'Cancelada':
      return propia
        ? `${usuarioNombre} canceló su reserva`
        : `${usuarioNombre} canceló la reserva de ${solicitanteNombre}`
    default:
      return `${usuarioNombre} cambió una reserva de ${solicitanteNombre}`
  }
}
