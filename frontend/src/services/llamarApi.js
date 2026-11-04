import { ApiError, request } from './apiClient.js'
import { obtenerToken } from './sesionStorage.js'

/** Tipos de resultado de cualquier llamada a la API. Las pantallas no conocen códigos HTTP. */
export const RESULTADO = Object.freeze({
  exito: 'exito',
  datosInvalidos: 'datosInvalidos', // 400: errores por campo
  noAutorizado: 'noAutorizado', // 401
  sinPermiso: 'sinPermiso', // 403
  noEncontrado: 'noEncontrado', // 404
  conflicto: 'conflicto', // 409: regla de negocio (RN-01, RN-06); trae el mensaje para el usuario
  demasiadosIntentos: 'demasiadosIntentos', // 429
  errorConexion: 'errorConexion', // no hubo respuesta: red caída o timeout
  errorServidor: 'errorServidor', // hubo respuesta, pero 5xx o fuera de contrato
  cancelado: 'cancelado', // el usuario canceló la petición
})

function primerMensaje(lista) {
  return Array.isArray(lista) && typeof lista[0] === 'string' ? lista[0] : null
}

/** { campo: [mensajes] } → { campo: primerMensaje }. */
function erroresPorCampo(errors) {
  const resultado = {}
  for (const [campo, mensajes] of Object.entries(errors ?? {})) {
    const mensaje = primerMensaje(mensajes)
    if (mensaje) resultado[campo] = mensaje
  }
  return resultado
}

function traducir({ ok, status, data }) {
  if (ok) return { tipo: RESULTADO.exito, data }
  if (status === 400) {
    const errores = erroresPorCampo(data?.errors)
    return Object.keys(errores).length > 0
      ? { tipo: RESULTADO.datosInvalidos, errores }
      : { tipo: RESULTADO.errorServidor }
  }
  if (status === 401) return { tipo: RESULTADO.noAutorizado }
  if (status === 403) return { tipo: RESULTADO.sinPermiso }
  if (status === 404) return { tipo: RESULTADO.noEncontrado }
  if (status === 409) {
    return typeof data?.mensaje === 'string'
      ? { tipo: RESULTADO.conflicto, mensaje: data.mensaje }
      : { tipo: RESULTADO.errorServidor }
  }
  if (status === 429) return { tipo: RESULTADO.demasiadosIntentos }
  return { tipo: RESULTADO.errorServidor }
}

/** Hace la petición (con el token de la sesión) y devuelve un resultado discriminado. */
export async function llamarApi(ruta, { conSesion = true, ...opciones } = {}) {
  try {
    const respuesta = await request(ruta, {
      ...opciones,
      token: conSesion ? obtenerToken() : undefined,
    })
    return traducir(respuesta)
  } catch (error) {
    if (error instanceof ApiError && error.tipo === 'cancelado')
      return { tipo: RESULTADO.cancelado }
    return { tipo: RESULTADO.errorConexion }
  }
}
