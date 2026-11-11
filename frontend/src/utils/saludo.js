import { horaEnLima } from './fechas.js'

export function saludoContextual(nombreCompleto, ahora = new Date()) {
  const hora = horaEnLima(ahora)
  const saludo = hora < 12 ? 'Buenos días' : hora < 19 ? 'Buenas tardes' : 'Buenas noches'
  const nombre = String(nombreCompleto ?? '')
    .trim()
    .split(/\s+/)[0]
  return nombre ? `${saludo}, ${nombre}` : saludo
}
