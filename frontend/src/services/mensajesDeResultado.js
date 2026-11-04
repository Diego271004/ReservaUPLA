import { MENSAJES } from '../constants/messages.js'
import { RESULTADO } from './llamarApi.js'

// Resultados que no producen un mensaje general: el éxito, lo que el usuario canceló, la sesión vencida (el router ya
// lleva al login) y los errores por campo (cada uno se muestra bajo su campo).
const SIN_MENSAJE = new Set([
  RESULTADO.exito,
  RESULTADO.cancelado,
  RESULTADO.noAutorizado,
  RESULTADO.datosInvalidos,
])

/**
 * El único lugar donde un resultado de la API (400, 401, 403, 404, 409, 429, 5xx o sin red) se traduce a un mensaje para
 * el usuario. Formularios, listados y acciones lo usan; ninguna pantalla decide mensajes por su cuenta.
 * `noEncontrado` permite a una pantalla poner su propio texto para el 404 (por defecto, el error general del servidor).
 */
export function mensajeDeError(resultado, { noEncontrado = MENSAJES.errorServidor } = {}) {
  if (SIN_MENSAJE.has(resultado.tipo)) return null
  switch (resultado.tipo) {
    case RESULTADO.sinPermiso:
      return MENSAJES.sinPermiso
    case RESULTADO.conflicto:
      return resultado.mensaje // una regla de negocio (RN-01, RN-06): el servidor dice por qué
    case RESULTADO.demasiadosIntentos:
      return MENSAJES.demasiadosIntentos
    case RESULTADO.errorServidor:
      return MENSAJES.errorServidor
    case RESULTADO.noEncontrado:
      return noEncontrado
    default:
      return MENSAJES.errorConexion // sin respuesta: red caída o tiempo agotado
  }
}

/** La alerta { tipo, mensaje } que corresponde a un resultado, o null si no hay nada que avisar. */
export function alertaDeResultado(resultado, { mensajeExito, noEncontrado } = {}) {
  if (resultado.tipo === RESULTADO.exito) {
    return mensajeExito ? { tipo: 'exito', mensaje: mensajeExito } : null
  }
  const mensaje = mensajeDeError(resultado, { noEncontrado })
  return mensaje ? { tipo: 'error', mensaje } : null
}
