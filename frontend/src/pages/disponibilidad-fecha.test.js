import { describe, expect, it } from 'vitest'
import { formatearFechaDisponibilidad, horaLima } from './DisponibilidadPage.jsx'

describe('Fecha de Disponibilidad', () => {
  it('usa minúsculas y sin capitalizar palabras ni comas innecesarias', () => {
    const ahora = new Date('2026-11-05T15:11:00-05:00')
    expect(formatearFechaDisponibilidad('2026-11-05')).toBe('jueves, 5 de noviembre de 2026')
    expect(horaLima(ahora)).toBe('15:11')
  })
})
