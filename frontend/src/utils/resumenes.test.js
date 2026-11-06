import { describe, expect, it } from 'vitest'
import { porcentajeDeOcupacion } from './disponibilidad.js'
import { resumenDeReservas } from './reservas.js'
import { resumenDeAmbientes, resumenDeUsuarios } from './resumenes.js'

describe('resumenDeAmbientes', () => {
  it('cuenta los ambientes y los que están en mantenimiento', () => {
    const ambientes = [
      { estado: 'Disponible' },
      { estado: 'Disponible' },
      { estado: 'En mantenimiento' },
    ]
    expect(resumenDeAmbientes(ambientes)).toBe('3 ambientes · 1 en mantenimiento')
  })

  it('con uno solo va en singular y sin mantenimiento dice 0', () => {
    expect(resumenDeAmbientes([{ estado: 'Disponible' }])).toBe('1 ambiente · 0 en mantenimiento')
  })

  it('sin ambientes dice 0', () => {
    expect(resumenDeAmbientes([])).toBe('0 ambientes · 0 en mantenimiento')
  })
})

describe('resumenDeUsuarios', () => {
  it('cuenta los usuarios y los activos', () => {
    expect(resumenDeUsuarios([{ activo: true }, { activo: false }, { activo: true }])).toBe(
      '3 usuarios · 2 activos',
    )
  })

  it('con uno solo va en singular', () => {
    expect(resumenDeUsuarios([{ activo: true }])).toBe('1 usuario · 1 activo')
  })

  it('sin usuarios activos dice 0 activos', () => {
    expect(resumenDeUsuarios([{ activo: false }])).toBe('1 usuario · 0 activos')
  })
})

describe('resumenDeReservas', () => {
  it('suma los cuatro estados y destaca las pendientes', () => {
    expect(resumenDeReservas({ Pendiente: 6, Aprobada: 3, Rechazada: 2, Cancelada: 2 })).toBe(
      '13 reservas · 6 pendientes',
    )
  })

  it('con una reserva pendiente va en singular', () => {
    expect(resumenDeReservas({ Pendiente: 1, Aprobada: 0, Rechazada: 0, Cancelada: 0 })).toBe(
      '1 reserva · 1 pendiente',
    )
  })

  it('sin pendientes dice 0 pendientes', () => {
    expect(resumenDeReservas({ Aprobada: 2 })).toBe('2 reservas · 0 pendientes')
  })

  it.each([null, undefined])('con %s (aún no se cuenta) no dice nada', (valor) => {
    expect(resumenDeReservas(valor)).toBeNull()
  })
})

describe('porcentajeDeOcupacion', () => {
  const dia = (bloques, estado = 'Disponible') => ({ estado, bloques })

  it('suma solo las reservas aprobadas sobre las 15 h del día', () => {
    expect(
      porcentajeDeOcupacion(
        dia([
          { horaInicio: '10:00', horaFin: '13:00', estado: 'Aprobada' },
          { horaInicio: '14:00', horaFin: '16:00', estado: 'Pendiente' },
        ]),
      ),
    ).toBe(20)
  })

  it('sin reservas es 0 %', () => {
    expect(porcentajeDeOcupacion(dia([]))).toBe(0)
    expect(porcentajeDeOcupacion({ estado: 'Disponible' })).toBe(0)
  })

  it('el día completo aprobado es 100 %', () => {
    expect(
      porcentajeDeOcupacion(dia([{ horaInicio: '07:00', horaFin: '22:00', estado: 'Aprobada' }])),
    ).toBe(100)
  })

  it('redondea al entero más cercano', () => {
    expect(
      porcentajeDeOcupacion(dia([{ horaInicio: '07:00', horaFin: '08:00', estado: 'Aprobada' }])),
    ).toBe(7)
  })

  it('un ambiente en mantenimiento no tiene porcentaje', () => {
    expect(porcentajeDeOcupacion(dia([], 'En mantenimiento'))).toBeNull()
  })
})
