import { describe, expect, it } from 'vitest'
import {
  HORAS,
  aplicarMascaraFecha,
  fechaAIso,
  horasPosterioresA,
  hoy,
  isoAFecha,
  minutosDeHora,
  parsearFecha,
  tiempoRelativo,
} from './fechas.js'

describe('HORAS (lista cerrada, RN-04)', () => {
  it('va de 07:00 a 22:00 cada 30 minutos (31 opciones)', () => {
    expect(HORAS[0]).toBe('07:00')
    expect(HORAS[1]).toBe('07:30')
    expect(HORAS.at(-1)).toBe('22:00')
    expect(HORAS).toHaveLength(31)
    expect(HORAS).not.toContain('06:30')
    expect(HORAS).not.toContain('22:30')
  })
})

describe('horasPosterioresA (RN-03)', () => {
  it('solo ofrece horas posteriores a la de inicio', () => {
    const opciones = horasPosterioresA('10:00')
    expect(opciones[0]).toBe('10:30')
    expect(opciones).not.toContain('10:00')
    expect(opciones).not.toContain('09:30')
    expect(opciones.at(-1)).toBe('22:00')
  })

  it('con inicio 22:00 no queda ninguna opción', () => {
    expect(horasPosterioresA('22:00')).toEqual([])
  })

  it('sin hora de inicio válida ofrece toda la lista', () => {
    expect(horasPosterioresA('')).toEqual(HORAS)
  })
})

describe('minutosDeHora', () => {
  it.each([
    ['07:00', 420],
    ['22:00', 1320],
  ])('%s → %i', (texto, minutos) => expect(minutosDeHora(texto)).toBe(minutos))

  it.each(['', '7:00', '25:00', '10:75', 'abc', null])('%s no es una hora', (texto) =>
    expect(minutosDeHora(texto)).toBeNull(),
  )
})

describe('fechas dd/mm/aaaa', () => {
  it('parsea una fecha real', () => {
    expect(parsearFecha('05/11/2026')).toEqual({ dia: 5, mes: 11, anio: 2026 })
  })

  it.each(['31/02/2026', '00/11/2026', '05/13/2026', '5/11/2026', '2026-11-05', '', null])(
    '%s no es una fecha válida',
    (texto) => expect(parsearFecha(texto)).toBeNull(),
  )

  it('acepta el 29 de febrero solo en año bisiesto', () => {
    expect(parsearFecha('29/02/2028')).not.toBeNull()
    expect(parsearFecha('29/02/2027')).toBeNull()
  })

  it('convierte entre dd/mm/aaaa y aaaa-mm-dd', () => {
    expect(fechaAIso('05/11/2026')).toBe('2026-11-05')
    expect(fechaAIso('31/02/2026')).toBeNull()
    expect(isoAFecha('2026-11-05')).toBe('05/11/2026')
    expect(isoAFecha('')).toBe('')
  })

  it('hoy devuelve la fecha local con dos dígitos', () => {
    expect(hoy(new Date(2026, 10, 3))).toBe('03/11/2026')
  })

  it('la máscara deja solo dígitos y pone las barras', () => {
    expect(aplicarMascaraFecha('05112026')).toBe('05/11/2026')
    expect(aplicarMascaraFecha('0511')).toBe('05/11')
    expect(aplicarMascaraFecha('0')).toBe('0')
    expect(aplicarMascaraFecha('05a/11-2026999')).toBe('05/11/2026')
    expect(aplicarMascaraFecha('')).toBe('')
  })
})

describe('tiempoRelativo', () => {
  const base = new Date('2026-11-05T15:00:00Z')

  it('formatea fechas relativas correctamente', () => {
    expect(tiempoRelativo('2026-11-05T14:59:30Z', base)).toBe('hace un momento')
    expect(tiempoRelativo('2026-11-05T14:30:00Z', base)).toBe('hace 30 minutos')
    expect(tiempoRelativo('2026-11-05T13:00:00Z', base)).toBe('hace 2 horas')
    expect(tiempoRelativo('2026-11-02T15:00:00Z', base)).toBe('hace 3 días')
  })
})
