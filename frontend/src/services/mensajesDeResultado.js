import { MENSAJES } from '../constants/messages.js'
import { RESULTADO } from './llamarApi.js'

const SIN_MENSAJE = new Set([
  RESULTADO.exito,
  RESULTADO.cancelado,
  RESULTADO.noAutorizado,
  RESULTADO.datosInvalidos,
])

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

export function alertaDeResultado(resultado, { mensajeExito, noEncontrado } = {}) {
  if (resultado.tipo === RESULTADO.exito) {
    return mensajeExito ? { tipo: 'exito', mensaje: mensajeExito } : null
  }
  const mensaje = mensajeDeError(resultado, { noEncontrado })
  return mensaje ? { tipo: 'error', mensaje } : null
}
