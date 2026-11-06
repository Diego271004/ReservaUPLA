import { describe, expect, it } from 'vitest'
import { fechaLarga, horaFinDeDuracion, textoDeDuracion } from './resumenDeSolicitud.js'

describe('fechaLarga', () => {
  it('escribe la fecha en letras, en minúsculas y sin saltar de día', () => {
    expect(fechaLarga('05/11/2026')).toBe('jueves, 5 de noviembre de 2026')
    expect(fechaLarga('01/01/2027')).toBe('viernes, 1 de enero de 2027')
  })

  it.each(['', '0511', '31/02/2026', null, undefined])('con %j devuelve null', (valor) => {
    expect(fechaLarga(valor)).toBeNull()
  })
})

describe('textoDeDuracion', () => {
  it.each([
    ['10:00', '12:00', '2 h'],
    ['10:00', '10:30', '30 min'],
    ['10:00', '11:30', '1 h 30 min'],
    ['07:00', '22:00', '15 h'],
  ])('%s a %s: %s', (inicio, fin, esperado) => {
    expect(textoDeDuracion(inicio, fin)).toBe(esperado)
  })

  it.each([
    ['', '12:00'],
    ['10:00', ''],
    ['12:00', '10:00'],
    ['10:00', '10:00'],
    ['xx', '10:00'],
  ])('%j a %j no tiene duración', (inicio, fin) => {
    expect(textoDeDuracion(inicio, fin)).toBeNull()
  })
})

describe('horaFinDeDuracion', () => {
  it('suma las horas a la de inicio', () => {
    expect(horaFinDeDuracion('10:00', 2)).toBe('12:00')
    expect(horaFinDeDuracion('10:30', 1)).toBe('11:30')
    expect(horaFinDeDuracion('07:00', 3)).toBe('10:00')
  })

  it('llega hasta las 22:00 y no pasa de ahí (RN-04)', () => {
    expect(horaFinDeDuracion('21:00', 1)).toBe('22:00')
    expect(horaFinDeDuracion('21:00', 2)).toBeNull()
    expect(horaFinDeDuracion('20:30', 2)).toBeNull()
  })

  it('sin hora de inicio válida devuelve null', () => {
    expect(horaFinDeDuracion('', 1)).toBeNull()
    expect(horaFinDeDuracion('xx', 1)).toBeNull()
  })
})
