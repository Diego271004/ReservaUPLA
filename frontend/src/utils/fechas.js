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

/** Convierte HH:mm a minutos, o null si no es una hora válida. */
export function minutosDeHora(texto) {
  const coincidencia = FORMATO_HORA.exec(texto ?? '')
  if (!coincidencia) return null
  const horas = Number(coincidencia[1])
  const minutos = Number(coincidencia[2])
  return horas > 23 || minutos > 59 ? null : horas * 60 + minutos
}

/** Convierte dd/mm/aaaa en { dia, mes, anio } si es una fecha real del calendario; si no, null. */
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

/** dd/mm/aaaa → aaaa-mm-dd, o null si la fecha no es válida. */
export function fechaAIso(texto) {
  const fecha = parsearFecha(texto)
  if (!fecha) return null
  return `${fecha.anio}-${dosDigitos(fecha.mes)}-${dosDigitos(fecha.dia)}`
}

/** aaaa-mm-dd → dd/mm/aaaa. */
export function isoAFecha(iso) {
  const [anio, mes, dia] = String(iso ?? '').split('-')
  return anio && mes && dia ? `${dia}/${mes}/${anio}` : ''
}

/** La fecha de hoy (hora local) como dd/mm/aaaa. */
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

/** Mientras se escribe: deja solo dígitos (máximo 8) y agrega las barras: 05112026 → 05/11/2026. */
export function aplicarMascaraFecha(entrada) {
  const digitos = String(entrada ?? '')
    .replace(/\D/g, '')
    .slice(0, 8)
  if (digitos.length <= 2) return digitos
  if (digitos.length <= 4) return `${digitos.slice(0, 2)}/${digitos.slice(2)}`
  return `${digitos.slice(0, 2)}/${digitos.slice(2, 4)}/${digitos.slice(4)}`
}
