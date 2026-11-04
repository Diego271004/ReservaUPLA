import { describe, expect, it } from 'vitest'
import { RUTAS } from '../constants/rutas.js'
import { tituloDelDocumento } from './tituloDelDocumento.js'

describe('tituloDelDocumento (la pestaña se llama como el título de la pantalla)', () => {
  it('cada pantalla de la tabla de rutas usa su propio título más el nombre del producto', () => {
    for (const pantalla of RUTAS) {
      const direccion = pantalla.ruta.replace(':id', '7')
      expect(tituloDelDocumento(direccion, pantalla.roles[0])).toBe(
        `${pantalla.titulo} · ReservaUPLA`,
      )
    }
  })

  it('«Nueva reserva» no se confunde con el detalle de una reserva', () => {
    expect(tituloDelDocumento('/reservas/nueva', 'Solicitante')).toBe('Nueva reserva · ReservaUPLA')
    expect(tituloDelDocumento('/reservas/7', 'Solicitante')).toBe(
      'Detalle de la reserva · ReservaUPLA',
    )
  })

  it('el login, «Sin permiso» y «No encontramos esa página» tienen el suyo', () => {
    expect(tituloDelDocumento('/login', undefined)).toBe('Iniciar sesión · ReservaUPLA')
    expect(tituloDelDocumento('/usuarios', 'Solicitante')).toBe('Sin permiso · ReservaUPLA')
    expect(tituloDelDocumento('/no-existe', 'Administrador')).toBe(
      'No encontramos esa página. · ReservaUPLA',
    )
  })

  it('sin sesión, o en la raíz que redirige, queda solo el nombre del producto', () => {
    expect(tituloDelDocumento('/', undefined)).toBe('ReservaUPLA')
    expect(tituloDelDocumento('/usuarios', undefined)).toBe('ReservaUPLA')
  })
})
