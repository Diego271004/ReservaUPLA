import { describe, expect, it } from 'vitest'
import { hoyEnLima, horaEnLima } from './fechas.js'
import { iniciales } from './personas.js'
import { saludoContextual } from './saludo.js'

describe('fecha y hora de Lima (UTC-5, sin horario de verano)', () => {
  it('hoyEnLima usa la fecha de Lima aunque en UTC ya sea el día siguiente', () => {
    expect(hoyEnLima(new Date('2026-11-05T03:00:00Z'))).toBe('04/11/2026')
    expect(hoyEnLima(new Date('2026-11-05T05:00:00Z'))).toBe('05/11/2026')
  })

  it('horaEnLima devuelve la hora de 0 a 23', () => {
    expect(horaEnLima(new Date('2026-11-04T13:00:00Z'))).toBe(8)
    expect(horaEnLima(new Date('2026-11-05T05:30:00Z'))).toBe(0)
  })
})

describe('saludoContextual: «Buenos días, Carla»', () => {
  const nombre = 'Carla Rojas'
  it.each([
    ['2026-11-04T10:00:00Z', 'Buenos días, Carla'], // 05:00
    ['2026-11-04T16:59:00Z', 'Buenos días, Carla'], // 11:59
    ['2026-11-04T17:00:00Z', 'Buenas tardes, Carla'], // 12:00
    ['2026-11-04T23:59:00Z', 'Buenas tardes, Carla'], // 18:59
    ['2026-11-05T00:00:00Z', 'Buenas noches, Carla'], // 19:00
    ['2026-11-05T06:00:00Z', 'Buenos días, Carla'], // 01:00 → de madrugada también «días»
  ])('%s → %s', (instante, esperado) => {
    expect(saludoContextual(nombre, new Date(instante))).toBe(esperado)
  })

  it('sin nombre, solo el saludo', () => {
    expect(saludoContextual('', new Date('2026-11-04T13:00:00Z'))).toBe('Buenos días')
  })
})

describe('iniciales del avatar', () => {
  it.each([
    ['Carla Rojas', 'CR'],
    ['Mario Huamán Quispe', 'MH'],
    ['  ana  ', 'A'],
    ['', ''],
    [undefined, ''],
  ])('%s → %s', (nombre, esperado) => expect(iniciales(nombre)).toBe(esperado))
})
