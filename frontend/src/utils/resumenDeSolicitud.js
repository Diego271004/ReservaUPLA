import { fechaAIso, minutosDeHora } from './fechas.js'

/** «jueves, 5 de noviembre de 2026» para una fecha dd/mm/aaaa válida; null si está vacía o mal escrita. */
export function fechaLarga(texto) {
  const iso = fechaAIso(texto)
  if (!iso) return null
  const [anio, mes, dia] = iso.split('-').map(Number)
  return new Intl.DateTimeFormat('es-PE', {
    weekday: 'long',
    day: 'numeric',
    month: 'long',
    year: 'numeric',
    timeZone: 'UTC',
  }).format(new Date(Date.UTC(anio, mes - 1, dia)))
}

/** «2 h», «1 h 30 min», «45 min»; null si falta una hora o el fin no es posterior al inicio. */
export function textoDeDuracion(horaInicio, horaFin) {
  const inicio = minutosDeHora(horaInicio)
  const fin = minutosDeHora(horaFin)
  if (inicio === null || fin === null || fin <= inicio) return null
  const total = fin - inicio
  const horas = Math.floor(total / 60)
  const minutos = total % 60
  if (horas === 0) return `${minutos} min`
  return minutos === 0 ? `${horas} h` : `${horas} h ${minutos} min`
}

/** La hora de fin de una reserva de `horas` horas que empieza a `horaInicio`, o null si pasaría de las 22:00 o no hay inicio. */
export function horaFinDeDuracion(horaInicio, horas, cierre = '22:00') {
  const inicio = minutosDeHora(horaInicio)
  if (inicio === null) return null
  const fin = inicio + horas * 60
  if (fin > minutosDeHora(cierre)) return null
  return `${String(Math.floor(fin / 60)).padStart(2, '0')}:${String(fin % 60).padStart(2, '0')}`
}
