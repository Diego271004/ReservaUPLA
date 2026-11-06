import { horaEnLima } from './fechas.js'

/** «Buenos días, Carla»: el saludo según la hora de Lima y el primer nombre de la persona. */
export function saludoContextual(nombreCompleto, ahora = new Date()) {
  const hora = horaEnLima(ahora)
  const saludo = hora < 12 ? 'Buenos días' : hora < 19 ? 'Buenas tardes' : 'Buenas noches'
  const nombre = String(nombreCompleto ?? '')
    .trim()
    .split(/\s+/)[0]
  return nombre ? `${saludo}, ${nombre}` : saludo
}
