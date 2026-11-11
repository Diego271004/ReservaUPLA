// Fechas dd/mm/aaaa para el usuario y aaaa-mm-dd (ISO) para la API; horas HH:mm.

const FORMATO_FECHA = /^(\d{2})\/(\d{2})\/(\d{4})$/
const FORMATO_HORA = /^(\d{2}):(\d{2})$/

export const HORA_APERTURA = '07:00'
export const HORA_CIERRE = '22:00'
const PASO_MINUTOS = 30

const dosDigitos = (numero) => String(numero).padStart(2, '0')

/** Lista cerrada de horas permitidas (RN-04): de 07:00 a 22:00 cada 30 minutos. */
export const HORAS = (() => {
  const horas = []
  for (let minutos = 7 * 60; minutos <= 22 * 60; minutos += PASO_MINUTOS) {
    horas.push(`${dosDigitos(Math.floor(minutos / 60))}:${dosDigitos(minutos % 60)}`)
  }
  return horas
})()

/** Opciones de hora de fin (RN-03): solo horas posteriores a la de inicio. */
export function horasPosterioresA(horaInicio) {
  if (!HORAS.includes(horaInicio)) return HORAS
  return HORAS.filter((hora) => hora > horaInicio)
}

export function minutosDeHora(texto) {
  const coincidencia = FORMATO_HORA.exec(texto ?? '')
  if (!coincidencia) return null
  const horas = Number(coincidencia[1])
  const minutos = Number(coincidencia[2])
  return horas > 23 || minutos > 59 ? null : horas * 60 + minutos
}

export function parsearFecha(texto) {
  const coincidencia = FORMATO_FECHA.exec(texto ?? '')
  if (!coincidencia) return null
  const dia = Number(coincidencia[1])
  const mes = Number(coincidencia[2])
  const anio = Number(coincidencia[3])
  const fecha = new Date(Date.UTC(anio, mes - 1, dia))
  const esReal =
    fecha.getUTCFullYear() === anio && fecha.getUTCMonth() === mes - 1 && fecha.getUTCDate() === dia
  return esReal ? { dia, mes, anio } : null
}

export function fechaAIso(texto) {
  const fecha = parsearFecha(texto)
  if (!fecha) return null
  return `${fecha.anio}-${dosDigitos(fecha.mes)}-${dosDigitos(fecha.dia)}`
}

export function isoAFecha(iso) {
  const [anio, mes, dia] = String(iso ?? '').split('-')
  return anio && mes && dia ? `${dia}/${mes}/${anio}` : ''
}

export function hoy(ahora = new Date()) {
  return `${dosDigitos(ahora.getDate())}/${dosDigitos(ahora.getMonth() + 1)}/${ahora.getFullYear()}`
}

/** RN-07: true si la fecha dd/mm/aaaa es anterior a hoy (hora local). La fecha mínima de una reserva es hoy. */
export function esAnteriorAHoy(texto, ahora = new Date()) {
  const fecha = parsearFecha(texto)
  if (!fecha) return false
  const comparable = ({ anio, mes, dia }) => anio * 10000 + mes * 100 + dia
  return comparable(fecha) < comparable(parsearFecha(hoy(ahora)))
}

export function aplicarMascaraFecha(entrada) {
  const digitos = String(entrada ?? '')
    .replace(/\D/g, '')
    .slice(0, 8)
  if (digitos.length <= 2) return digitos
  if (digitos.length <= 4) return `${digitos.slice(0, 2)}/${digitos.slice(2)}`
  return `${digitos.slice(0, 2)}/${digitos.slice(2, 4)}/${digitos.slice(4)}`
}

const partesEnLima = (ahora) =>
  Object.fromEntries(
    new Intl.DateTimeFormat('en-GB', {
      timeZone: 'America/Lima',
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
      hour: '2-digit',
      hourCycle: 'h23',
    })
      .formatToParts(ahora)
      .map(({ type, value }) => [type, value]),
  )

export function hoyEnLima(ahora = new Date()) {
  const { day, month, year } = partesEnLima(ahora)
  return `${day}/${month}/${year}`
}

export const horaEnLima = (ahora = new Date()) => Number(partesEnLima(ahora).hour)

export function tiempoRelativo(iso, ahora = new Date()) {
  if (!iso) return ''
  const fecha = new Date(iso)
  const diffSegundos = Math.floor((ahora.getTime() - fecha.getTime()) / 1000)
  if (isNaN(diffSegundos) || diffSegundos < 0) return 'hace un momento'
  if (diffSegundos < 60) return 'hace un momento'
  const diffMinutos = Math.floor(diffSegundos / 60)
  if (diffMinutos < 60) return `hace ${diffMinutos} ${diffMinutos === 1 ? 'minuto' : 'minutos'}`
  const diffHoras = Math.floor(diffMinutos / 60)
  if (diffHoras < 24) return `hace ${diffHoras} ${diffHoras === 1 ? 'hora' : 'horas'}`
  const diffDias = Math.floor(diffHoras / 24)
  if (diffDias < 30) return `hace ${diffDias} ${diffDias === 1 ? 'día' : 'días'}`
  const diffMeses = Math.floor(diffDias / 30)
  return `hace ${diffMeses} ${diffMeses === 1 ? 'mes' : 'meses'}`
}
