import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { ApiError, registrarSesionExpirada, request } from './apiClient.js'
import { login } from './authService.js'
import { RESULTADO, llamarApi } from './llamarApi.js'
import {
  crearAmbiente,
  crearReserva,
  crearUsuario,
  listarAmbientes,
  listarUsuarios,
} from './recursosService.js'
import { borrarSesion, guardarSesion, leerSesion, obtenerToken } from './sesionStorage.js'

const respuesta = (status, cuerpo) => ({
  ok: status >= 200 && status < 300,
  status,
  text: () => Promise.resolve(cuerpo === undefined ? '' : JSON.stringify(cuerpo)),
})

const sesion = (expiraEn) => ({ token: 't', nombreCompleto: 'Ana', rol: 'Solicitante', expiraEn })

beforeEach(() => sessionStorage.clear())
afterEach(() => {
  vi.unstubAllGlobals()
  vi.useRealTimers()
  registrarSesionExpirada(null)
})

describe('sesionStorage', () => {
  it('guarda y lee la sesión en sessionStorage', () => {
    const futura = new Date(Date.now() + 60_000).toISOString()
    guardarSesion(sesion(futura))
    expect(leerSesion()).toEqual(sesion(futura))
    expect(obtenerToken()).toBe('t')
    expect(sessionStorage.length).toBe(1)
    expect(localStorage.length).toBe(0)
  })

  it('una sesión vencida se descarta', () => {
    guardarSesion(sesion(new Date(Date.now() - 1000).toISOString()))
    expect(leerSesion()).toBeNull()
    expect(obtenerToken()).toBeNull()
  })

  it('un contenido dañado o incompleto se descarta', () => {
    sessionStorage.setItem('reservaupla.sesion', '{no es json')
    expect(leerSesion()).toBeNull()
    sessionStorage.setItem('reservaupla.sesion', JSON.stringify({ token: 1 }))
    expect(leerSesion()).toBeNull()
  })

  it('borrarSesion la elimina', () => {
    guardarSesion(sesion(new Date(Date.now() + 60_000).toISOString()))
    borrarSesion()
    expect(leerSesion()).toBeNull()
  })
})

describe('apiClient.request', () => {
  it('envía el token, el cuerpo JSON y devuelve estado y datos', async () => {
    const fetchSimulado = vi.fn().mockResolvedValue(respuesta(200, { ok: true }))
    vi.stubGlobal('fetch', fetchSimulado)

    const resultado = await request('/ambientes', { method: 'POST', body: { a: 1 }, token: 'abc' })

    expect(resultado).toEqual({ ok: true, status: 200, data: { ok: true } })
    const [url, opciones] = fetchSimulado.mock.calls[0]
    expect(url).toBe('/api/ambientes')
    expect(opciones.headers.Authorization).toBe('Bearer abc')
    expect(opciones.headers['Content-Type']).toBe('application/json')
    expect(opciones.body).toBe('{"a":1}')
  })

  it('un cuerpo que no es JSON se trata como vacío', async () => {
    vi.stubGlobal(
      'fetch',
      vi.fn().mockResolvedValue({ ok: false, status: 502, text: () => Promise.resolve('<html>') }),
    )
    expect((await request('/x')).data).toBeNull()
  })

  it('si la red falla lanza ApiError de tipo red', async () => {
    vi.stubGlobal('fetch', vi.fn().mockRejectedValue(new TypeError('sin red')))
    await expect(request('/x')).rejects.toMatchObject({ name: 'ApiError', tipo: 'red' })
  })

  it('si supera el tiempo lanza ApiError de tipo timeout', async () => {
    vi.stubGlobal(
      'fetch',
      vi.fn(
        (_url, { signal }) =>
          new Promise((_resolver, rechazar) => {
            signal.addEventListener('abort', () =>
              rechazar(Object.assign(new Error('abortado'), { name: 'AbortError' })),
            )
          }),
      ),
    )
    await expect(request('/x', { timeoutMs: 10 })).rejects.toMatchObject({ tipo: 'timeout' })
  })

  it('si el usuario cancela lanza ApiError de tipo cancelado', async () => {
    vi.stubGlobal(
      'fetch',
      vi.fn(
        (_url, { signal }) =>
          new Promise((_resolver, rechazar) => {
            signal.addEventListener('abort', () =>
              rechazar(Object.assign(new Error('abortado'), { name: 'AbortError' })),
            )
          }),
      ),
    )
    const controlador = new AbortController()
    const promesa = request('/x', { signal: controlador.signal })
    controlador.abort()
    await expect(promesa).rejects.toBeInstanceOf(ApiError)
    await expect(promesa).rejects.toMatchObject({ tipo: 'cancelado' })
  })

  it('un 401 en una petición con token avisa a la sesión; sin token no', async () => {
    const alExpirar = vi.fn()
    registrarSesionExpirada(alExpirar)
    vi.stubGlobal('fetch', vi.fn().mockResolvedValue(respuesta(401)))

    await request('/x')
    expect(alExpirar).not.toHaveBeenCalled()
    await request('/x', { token: 'abc' })
    expect(alExpirar).toHaveBeenCalledTimes(1)
  })
})

describe('llamarApi: traducción de respuestas', () => {
  const llamarConEstado = async (status, cuerpo) => {
    vi.stubGlobal('fetch', vi.fn().mockResolvedValue(respuesta(status, cuerpo)))
    return llamarApi('/x')
  }

  it('2xx → éxito con los datos', async () => {
    expect(await llamarConEstado(201, { id: 1 })).toEqual({
      tipo: RESULTADO.exito,
      data: { id: 1 },
    })
  })

  it('400 con errores → datosInvalidos con el primer mensaje de cada campo', async () => {
    const resultado = await llamarConEstado(400, {
      errors: { correo: ['Uno', 'Dos'], rol: ['Tres'] },
    })
    expect(resultado).toEqual({
      tipo: RESULTADO.datosInvalidos,
      errores: { correo: 'Uno', rol: 'Tres' },
    })
  })

  it('400 sin errores por campo (fuera de contrato) → errorServidor', async () => {
    expect(await llamarConEstado(400, {})).toEqual({ tipo: RESULTADO.errorServidor })
  })

  it.each([
    [401, RESULTADO.noAutorizado],
    [403, RESULTADO.sinPermiso],
    [429, RESULTADO.demasiadosIntentos],
    [500, RESULTADO.errorServidor],
    [503, RESULTADO.errorServidor],
    [404, RESULTADO.errorServidor],
  ])('%i → %s', async (status, tipo) => {
    expect((await llamarConEstado(status, {})).tipo).toBe(tipo)
  })

  it('sin respuesta (red caída) → errorConexion', async () => {
    vi.stubGlobal('fetch', vi.fn().mockRejectedValue(new TypeError('sin red')))
    expect(await llamarApi('/x')).toEqual({ tipo: RESULTADO.errorConexion })
  })

  it('cancelada por el usuario → cancelado', async () => {
    vi.stubGlobal(
      'fetch',
      vi.fn().mockRejectedValue(Object.assign(new Error('x'), { name: 'AbortError' })),
    )
    const controlador = new AbortController()
    controlador.abort()
    expect(await llamarApi('/x', { signal: controlador.signal })).toEqual({
      tipo: RESULTADO.cancelado,
    })
  })

  it('envía el token de la sesión guardada', async () => {
    guardarSesion(sesion(new Date(Date.now() + 60_000).toISOString()))
    const fetchSimulado = vi.fn().mockResolvedValue(respuesta(200, []))
    vi.stubGlobal('fetch', fetchSimulado)
    await llamarApi('/ambientes')
    expect(fetchSimulado.mock.calls[0][1].headers.Authorization).toBe('Bearer t')
  })
})

describe('authService.login', () => {
  const completo = {
    token: 'tk',
    nombreCompleto: 'Ana Torres',
    rol: 'Solicitante',
    expiraEn: '2026-11-03T13:00:00Z',
  }

  it('200 → éxito con token, nombre, rol y expiración; no envía token de sesión', async () => {
    guardarSesion(sesion(new Date(Date.now() + 60_000).toISOString()))
    const fetchSimulado = vi.fn().mockResolvedValue(respuesta(200, completo))
    vi.stubGlobal('fetch', fetchSimulado)

    expect(await login('ana@upla.edu.pe', 'x')).toEqual({ tipo: 'exito', data: completo })
    expect(fetchSimulado.mock.calls[0][1].headers.Authorization).toBeUndefined()
    expect(JSON.parse(fetchSimulado.mock.calls[0][1].body)).toEqual({
      correo: 'ana@upla.edu.pe',
      contrasena: 'x',
    })
  })

  it('401 → credencialesInvalidas (no es una sesión vencida)', async () => {
    const alExpirar = vi.fn()
    registrarSesionExpirada(alExpirar)
    vi.stubGlobal('fetch', vi.fn().mockResolvedValue(respuesta(401, { mensaje: 'x' })))
    expect(await login('a@upla.edu.pe', 'x')).toEqual({ tipo: 'credencialesInvalidas' })
    expect(alExpirar).not.toHaveBeenCalled()
  })

  it('200 con un cuerpo incompleto → errorServidor', async () => {
    vi.stubGlobal('fetch', vi.fn().mockResolvedValue(respuesta(200, { token: 'tk' })))
    expect(await login('a@upla.edu.pe', 'x')).toEqual({ tipo: RESULTADO.errorServidor })
  })

  it.each([
    [400, { errors: { correo: ['Ingresa tu correo institucional.'] } }, RESULTADO.datosInvalidos],
    [429, { mensaje: 'x' }, RESULTADO.demasiadosIntentos],
    [500, null, RESULTADO.errorServidor],
  ])('%i → %s', async (status, cuerpo, tipo) => {
    vi.stubGlobal('fetch', vi.fn().mockResolvedValue(respuesta(status, cuerpo)))
    expect((await login('a@upla.edu.pe', 'x')).tipo).toBe(tipo)
  })

  it('sin red → errorConexion', async () => {
    vi.stubGlobal('fetch', vi.fn().mockRejectedValue(new TypeError('sin red')))
    expect((await login('a@upla.edu.pe', 'x')).tipo).toBe(RESULTADO.errorConexion)
  })
})

describe('recursosService: rutas y métodos', () => {
  const usar = () => {
    const fetchSimulado = vi.fn().mockResolvedValue(respuesta(200, []))
    vi.stubGlobal('fetch', fetchSimulado)
    return fetchSimulado
  }

  it.each([
    ['listarUsuarios sin filtro', () => listarUsuarios(), '/api/usuarios', 'GET'],
    [
      'listarUsuarios con rol',
      () => listarUsuarios('Responsable'),
      '/api/usuarios?rol=Responsable',
      'GET',
    ],
    ['listarAmbientes', () => listarAmbientes(), '/api/ambientes', 'GET'],
    ['crearUsuario', () => crearUsuario({}), '/api/usuarios', 'POST'],
    ['crearAmbiente', () => crearAmbiente({}), '/api/ambientes', 'POST'],
    ['crearReserva', () => crearReserva({}), '/api/reservas', 'POST'],
  ])('%s', async (_nombre, llamar, ruta, metodo) => {
    const fetchSimulado = usar()
    await llamar()
    expect(fetchSimulado.mock.calls[0][0]).toBe(ruta)
    expect(fetchSimulado.mock.calls[0][1].method).toBe(metodo)
  })
})
