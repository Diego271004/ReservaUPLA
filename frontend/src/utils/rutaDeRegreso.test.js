import { describe, expect, it } from 'vitest'
import { rutaDeRegreso, textoDeRegreso } from './rutaDeRegreso.js'

describe('rutaDeRegreso: a dónde regresa el detalle de una reserva y qué sección del menú marca', () => {
  it.each([
    ['Administrador', undefined, '/reservas'],
    ['Administrador', '/dashboard', '/dashboard'],
    ['Administrador', '/reservas?estado=Pendiente&pagina=2', '/reservas?estado=Pendiente&pagina=2'],
    ['Solicitante', undefined, '/reservas'],
    ['Solicitante', '/reservas?pagina=3', '/reservas?pagina=3'],
    ['Responsable', undefined, '/mi-ambiente'],
    ['Responsable', '/mi-ambiente?ambienteId=3&pagina=2', '/mi-ambiente?ambienteId=3&pagina=2'],
  ])('%s con origen %s regresa a %s', (rol, origen, esperado) => {
    expect(rutaDeRegreso(rol, origen)).toBe(esperado)
  })

  it('un origen que no está en el menú del rol se ignora y se usa el de siempre', () => {
    expect(rutaDeRegreso('Solicitante', '/dashboard')).toBe('/reservas')
    expect(rutaDeRegreso('Responsable', '/reservas')).toBe('/mi-ambiente')
    expect(rutaDeRegreso('Administrador', '/usuarios')).toBe('/reservas')
  })

  it('el enlace se llama como la pantalla a la que lleva', () => {
    expect(textoDeRegreso('/reservas')).toBe('Volver a Reservas')
    expect(textoDeRegreso('/reservas?estado=Pendiente&pagina=2')).toBe('Volver a Reservas')
    expect(textoDeRegreso('/dashboard')).toBe('Volver al Dashboard')
    expect(textoDeRegreso('/mi-ambiente?ambienteId=3')).toBe('Volver a Mi ambiente')
  })
})
