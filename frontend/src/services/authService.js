import { RESULTADO, llamarApi } from './llamarApi.js'

/** POST /api/auth/login. Un 401 aquí significa credenciales inválidas (no hay sesión que expirar). */
export async function login(correo, contrasena, { signal } = {}) {
  const resultado = await llamarApi('/auth/login', {
    method: 'POST',
    body: { correo, contrasena },
    conSesion: false,
    signal,
  })

  if (resultado.tipo === RESULTADO.noAutorizado) return { tipo: 'credencialesInvalidas' }

  if (resultado.tipo === RESULTADO.exito) {
    const { token, usuarioId, nombreCompleto, rol, expiraEn } = resultado.data ?? {}
    const completa =
      Number.isInteger(usuarioId) &&
      [token, nombreCompleto, rol, expiraEn].every((dato) => typeof dato === 'string')
    return completa
      ? { tipo: RESULTADO.exito, data: { token, usuarioId, nombreCompleto, rol, expiraEn } }
      : { tipo: RESULTADO.errorServidor }
  }

  return resultado
}
