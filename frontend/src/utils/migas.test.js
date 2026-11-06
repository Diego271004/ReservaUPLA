import { describe, expect, it } from 'vitest'
import { migasDe } from './migas.js'

describe('migasDe: migas de pan de la barra superior', () => {
  it('una sección raíz no muestra migas redundantes, porque el título ya identifica la página', () => {
    expect(migasDe('/reservas', 'Administrador')).toEqual([])
    expect(migasDe('/reservas/nueva', 'Solicitante')).toEqual([])
  })

  it('el detalle cuelga de la sección de origen (con sus filtros)', () => {
    expect(migasDe('/reservas/7', 'Administrador', '/dashboard')).toEqual([
      { texto: 'Inicio', ruta: '/dashboard' },
      { texto: 'Detalle de la reserva' },
    ])
    expect(migasDe('/reservas/7', 'Solicitante', '/reservas?estado=Pendiente')).toEqual([
      { texto: 'Reservas', ruta: '/reservas?estado=Pendiente' },
      { texto: 'Detalle de la reserva' },
    ])
    expect(migasDe('/reservas/7', 'Responsable')).toEqual([
      { texto: 'Inicio', ruta: '/dashboard' },
      { texto: 'Detalle de la reserva' },
    ])
  })

  it('los formularios de registro cuelgan de su listado', () => {
    expect(migasDe('/ambientes/nuevo', 'Administrador')).toEqual([
      { texto: 'Ambientes', ruta: '/ambientes' },
      { texto: 'Registrar ambiente' },
    ])
    expect(migasDe('/usuarios/nuevo', 'Administrador')).toEqual([
      { texto: 'Usuarios', ruta: '/usuarios' },
      { texto: 'Registrar usuario' },
    ])
  })

  it('una dirección que no existe o sin permiso muestra su propio título', () => {
    expect(migasDe('/nada', 'Administrador')).toEqual([{ texto: 'No encontramos esa página.' }])
    expect(migasDe('/usuarios', 'Solicitante')).toEqual([{ texto: 'Sin permiso' }])
  })
})
