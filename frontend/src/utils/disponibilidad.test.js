import { describe, expect, it } from 'vitest'
import {
  asignarCarrilesReservas,
  horaAbreviada,
  porcentajeDeOcupacion,
  textoVisibleBloque,
} from './disponibilidad.js'

describe('utilidades de disponibilidad', () => {
  it('abrevia horas en punto sin ceros y conserva minutos si no es en punto', () => {
    expect(horaAbreviada('07:00')).toBe('7')
    expect(horaAbreviada('08:00')).toBe('8')
    expect(horaAbreviada('10:00')).toBe('10')
    expect(horaAbreviada('12:00')).toBe('12')
    expect(horaAbreviada('13:00')).toBe('13')
    expect(horaAbreviada('22:00')).toBe('22')
    expect(horaAbreviada('09:30')).toBe('9:30')
    expect(horaAbreviada('')).toBe('')
  })

  it('formatea texto conciso sin recortar para bloques libres con umbral de 120 min (bordes 90, 120 y 121 min)', () => {
    // <= 30 min: vacío (solo icono)
    expect(textoVisibleBloque({ tipo: 'libre', horaInicio: '07:00', horaFin: '07:30' })).toBe('')

    // <= 120 min (incluye 60, 90 y 120 min): solo "Libre"
    expect(textoVisibleBloque({ tipo: 'libre', horaInicio: '07:00', horaFin: '08:00' })).toBe(
      'Libre',
    )
    expect(textoVisibleBloque({ tipo: 'libre', horaInicio: '10:00', horaFin: '11:30' })).toBe(
      'Libre',
    )
    expect(textoVisibleBloque({ tipo: 'libre', horaInicio: '12:00', horaFin: '14:00' })).toBe(
      'Libre',
    )

    // > 120 min (borde 121 min y largos): "Libre H–H h"
    expect(textoVisibleBloque({ tipo: 'libre', horaInicio: '10:00', horaFin: '12:01' })).toBe(
      'Libre 10–12:01 h',
    )
    expect(textoVisibleBloque({ tipo: 'libre', horaInicio: '07:00', horaFin: '10:00' })).toBe(
      'Libre 7–10 h',
    )
    expect(textoVisibleBloque({ tipo: 'libre', horaInicio: '13:00', horaFin: '22:00' })).toBe(
      'Libre 13–22 h',
    )
  })

  it('formatea texto conciso abreviado para reservas ocupadas con umbrales de borde (90, 120 y 121 min)', () => {
    // <= 45 min: vacío (solo icono)
    expect(
      textoVisibleBloque({
        tipo: 'ocupado',
        horaInicio: '10:00',
        horaFin: '10:45',
        estado: 'Pendiente',
      }),
    ).toBe('')

    // <= 120 min (borde 90 y 120 min): "H–H h" sin sufijo de estado para evitar elipsis
    const res90m = { tipo: 'ocupado', horaInicio: '10:00', horaFin: '11:30', estado: 'Aprobada' }
    expect(textoVisibleBloque(res90m)).toBe('10–11:30 h')

    const res2h = { tipo: 'ocupado', horaInicio: '10:00', horaFin: '12:00', estado: 'Pendiente' }
    expect(textoVisibleBloque(res2h)).toBe('10–12 h')
    expect(textoVisibleBloque(res2h)).not.toContain('…')
    expect(textoVisibleBloque(res2h)).not.toContain('...')

    const res2hAprobada = {
      tipo: 'ocupado',
      horaInicio: '11:00',
      horaFin: '13:00',
      estado: 'Aprobada',
    }
    expect(textoVisibleBloque(res2hAprobada)).toBe('11–13 h')

    // Borde 121 min y hasta 180 min: "H–H h · Estado"
    const res121m = {
      tipo: 'ocupado',
      horaInicio: '10:00',
      horaFin: '12:01',
      estado: 'Aprobada',
    }
    expect(textoVisibleBloque(res121m)).toBe('10–12:01 h · Aprobada')

    // Bloques de 3 horas (180 min): "H–H h · Estado"
    const res3h = { tipo: 'ocupado', horaInicio: '10:00', horaFin: '13:00', estado: 'Aprobada' }
    expect(textoVisibleBloque(res3h)).toBe('10–13 h · Aprobada')

    // Bloques largos (>= 4 horas): "HH:MM–HH:MM · Estado"
    const resLarga = { tipo: 'ocupado', horaInicio: '08:00', horaFin: '14:00', estado: 'Aprobada' }
    expect(textoVisibleBloque(resLarga)).toBe('08:00–14:00 · Aprobada')
  })

  it('calcula porcentaje de ocupación solo con reservas aprobadas', () => {
    const amb = {
      id: 1,
      nombre: 'Lab',
      estado: 'Disponible',
      bloques: [
        { horaInicio: '07:00', horaFin: '10:00', estado: 'Aprobada' }, // 3h = 180 min de 900 min = 20%
        { horaInicio: '10:00', horaFin: '12:00', estado: 'Pendiente' },
      ],
    }
    expect(porcentajeDeOcupacion(amb)).toBe(20)
  })

  it('asigna carriles sin solapamientos', () => {
    const bloques = [
      { id: 1, horaInicio: '10:00', horaFin: '12:00' },
      { id: 2, horaInicio: '11:00', horaFin: '13:00' },
    ]
    const resultado = asignarCarrilesReservas(bloques)
    expect(resultado[0].carril).toBe(0)
    expect(resultado[1].carril).toBe(1)
  })
})
