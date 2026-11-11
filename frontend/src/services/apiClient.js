/**
 * Cliente HTTP mínimo sobre fetch.
 * - Ruta base relativa (/api): el proxy de Vite la redirige al backend, sin puertos en el código.
 * - Timeout con AbortController (15 s) y cancelación desde afuera (signal).
 * - Nunca lanza por errores HTTP: devuelve { ok, status, data }. Los fallos de transporte lanzan
 *   ApiError ('timeout' | 'red' | 'cancelado') para que la capa de servicio decida.
 * - Si una petición con token recibe 401, avisa a la sesión (registrarSesionExpirada).
 */

export const API_BASE_URL = import.meta.env?.VITE_API_URL ?? '/api'
export const TIMEOUT_MS = 15_000

export class ApiError extends Error {
  constructor(tipo, causa) {
    super(tipo === 'timeout' ? 'La petición superó el tiempo de espera.' : 'Fallo de red.')
    this.name = 'ApiError'
    this.tipo = tipo
    this.cause = causa
  }
}

let alExpirarSesion = null

export function registrarSesionExpirada(manejador) {
  alExpirarSesion = manejador
}

async function leerCuerpo(respuesta) {
  const texto = await respuesta.text()
  if (texto === '') return null
  try {
    return JSON.parse(texto)
  } catch {
    return null
  }
}

export async function request(
  ruta,
  { method = 'GET', body, token, signal, timeoutMs = TIMEOUT_MS } = {},
) {
  const controller = new AbortController()
  let motivo = 'timeout'
  const temporizador = setTimeout(() => controller.abort(), timeoutMs)
  const alCancelarDesdeAfuera = () => {
    motivo = 'cancelado'
    controller.abort()
  }
  if (signal?.aborted) alCancelarDesdeAfuera()
  signal?.addEventListener('abort', alCancelarDesdeAfuera)

  const headers = { Accept: 'application/json' }
  if (body !== undefined) headers['Content-Type'] = 'application/json'
  if (token) headers.Authorization = `Bearer ${token}`

  try {
    const respuesta = await fetch(`${API_BASE_URL}${ruta}`, {
      method,
      headers,
      body: body === undefined ? undefined : JSON.stringify(body),
      signal: controller.signal,
    })
    const data = await leerCuerpo(respuesta)
    if (respuesta.status === 401 && token) alExpirarSesion?.()
    return { ok: respuesta.ok, status: respuesta.status, data }
  } catch (error) {
    if (error?.name === 'AbortError') throw new ApiError(motivo, error)
    throw new ApiError('red', error)
  } finally {
    clearTimeout(temporizador)
    signal?.removeEventListener('abort', alCancelarDesdeAfuera)
  }
}
