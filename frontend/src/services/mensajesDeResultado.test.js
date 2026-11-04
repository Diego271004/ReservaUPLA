import { describe, expect, it } from 'vitest'
import { MENSAJES, TEXTOS } from '../constants/messages.js'
import { RESULTADO } from './llamarApi.js'
import { alertaDeResultado, mensajeDeError } from './mensajesDeResultado.js'

describe('mensajeDeError: un solo lugar donde cada resultado de la API se vuelve un mensaje', () => {
  it.each([
    [{ tipo: RESULTADO.sinPermiso }, MENSAJES.sinPermiso],
    [{ tipo: RESULTADO.demasiadosIntentos }, MENSAJES.demasiadosIntentos],
    [{ tipo: RESULTADO.errorServidor }, MENSAJES.errorServidor],
    [{ tipo: RESULTADO.errorConexion }, MENSAJES.errorConexion],
    [{ tipo: RESULTADO.conflicto, mensaje: 'Regla de negocio' }, 'Regla de negocio'],
    [{ tipo: RESULTADO.noEncontrado }, MENSAJES.errorServidor],
    [{ tipo: 'tipo-desconocido' }, MENSAJES.errorConexion],
  ])('%j → mensaje', (resultado, esperado) => {
    expect(mensajeDeError(resultado)).toBe(esperado)
  })

  it.each([
    [{ tipo: RESULTADO.exito, data: {} }],
    [{ tipo: RESULTADO.cancelado }],
    [{ tipo: RESULTADO.noAutorizado }],
    [{ tipo: RESULTADO.datosInvalidos, errores: { correo: 'x' } }],
  ])(
    '%j no genera mensaje general (éxito, cancelado, sesión vencida y errores por campo)',
    (resultado) => {
      expect(mensajeDeError(resultado)).toBeNull()
    },
  )

  it('un 404 puede llevar su propio texto según la pantalla', () => {
    expect(
      mensajeDeError(
        { tipo: RESULTADO.noEncontrado },
        { noEncontrado: TEXTOS.reservaNoEncontrada },
      ),
    ).toBe(TEXTOS.reservaNoEncontrada)
  })
})

describe('alertaDeResultado', () => {
  it('éxito con mensaje → alerta de éxito', () => {
    expect(alertaDeResultado({ tipo: RESULTADO.exito }, { mensajeExito: 'Listo.' })).toEqual({
      tipo: 'exito',
      mensaje: 'Listo.',
    })
  })

  it('éxito sin mensaje → ninguna alerta', () => {
    expect(alertaDeResultado({ tipo: RESULTADO.exito })).toBeNull()
  })

  it('error → alerta de error con su mensaje', () => {
    expect(alertaDeResultado({ tipo: RESULTADO.sinPermiso })).toEqual({
      tipo: 'error',
      mensaje: MENSAJES.sinPermiso,
    })
  })

  it('cancelado y sesión vencida → ninguna alerta', () => {
    expect(alertaDeResultado({ tipo: RESULTADO.cancelado })).toBeNull()
    expect(alertaDeResultado({ tipo: RESULTADO.noAutorizado })).toBeNull()
  })
})
