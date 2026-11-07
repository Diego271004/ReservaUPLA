import { describe, expect, it } from 'vitest'
import { migasDe, seccionActualDe } from './migas.js'

describe('migasDe: migas de pan de la barra superior', () => {
  it('una sección raíz de nivel 1 no muestra migas redundantes', () => {
    expect(migasDe('/reservas', 'Administrador')).toEqual([])
  })

  it('los formularios de registro y nueva reserva cuelgan de su listado con miga completa', () => {
    expect(migasDe('/reservas/nueva', 'Solicitante')).toEqual([
      { texto: 'Reservas', ruta: '/reservas' },
      { texto: 'Nueva reserva' },
    ])
    expect(migasDe('/ambientes/nuevo', 'Administrador')).toEqual([
      { texto: 'Ambientes', ruta: '/ambientes' },
      { texto: 'Registrar ambiente' },
    ])
    expect(migasDe('/usuarios/nuevo', 'Administrador')).toEqual([
      { texto: 'Usuarios', ruta: '/usuarios' },
      { texto: 'Registrar usuario' },
    ])
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

  it('una dirección que no existe o sin permiso muestra su propio título', () => {
    expect(migasDe('/nada', 'Administrador')).toEqual([{ texto: 'No encontramos esa página.' }])
    expect(migasDe('/usuarios', 'Solicitante')).toEqual([{ texto: 'Sin permiso' }])
  })

  it('seccionActualDe devuelve null en todas las rutas raíz de nivel 1 para mantener el foco en el h1', () => {
    // En todas las rutas raíz de nivel 1 la barra superior queda limpia a la izquierda
    expect(seccionActualDe('/dashboard', 'Administrador')).toBeNull()
    expect(seccionActualDe('/disponibilidad', 'Responsable')).toBeNull()
    expect(seccionActualDe('/mi-ambiente', 'Responsable')).toBeNull()
    expect(seccionActualDe('/ambientes', 'Administrador')).toBeNull()
    expect(seccionActualDe('/usuarios', 'Administrador')).toBeNull()
    expect(seccionActualDe('/reservas', 'Solicitante')).toBeNull()
    expect(seccionActualDe('/usuarios', 'Solicitante')).toBe('Sin permiso')
    expect(seccionActualDe('/ruta-inexistente', 'Administrador')).toBe('No encontramos esa página.')
  })
})
