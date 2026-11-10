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

  it('formatea texto sin recortar para bloques libres con umbral de 180 min (bordes 30, 180 y 181 min)', () => {
    const libre = (horaInicio, horaFin) =>
      textoVisibleBloque({ tipo: 'libre', horaInicio, horaFin })
    // <= 30 min: vacío (solo icono)
    expect(libre('07:00', '07:30')).toBe('')
    // de 31 a 180 min: solo «Libre» (un tramo de 2 h ocupa unos 100 px de línea de tiempo y «Libre 12–14 h» no cabía)
    expect(libre('07:00', '07:31')).toBe('Libre')
    expect(libre('07:00', '08:00')).toBe('Libre')
    expect(libre('12:00', '14:00')).toBe('Libre')
    expect(libre('07:00', '10:00')).toBe('Libre')
    // > 180 min: «Libre H–H h»
    expect(libre('10:00', '13:01')).toBe('Libre 10–13:01 h')
    expect(libre('13:00', '22:00')).toBe('Libre 13–22 h')
  })

  it('formatea texto sin recortar para reservas: solo el horario, el estado lo dice el icono (bordes 45, 46 y 180 min)', () => {
    const reserva = (horaInicio, horaFin, estado = 'Aprobada') =>
      textoVisibleBloque({ tipo: 'ocupado', horaInicio, horaFin, estado })
    // <= 45 min: vacío (solo icono)
    expect(reserva('10:00', '10:45', 'Pendiente')).toBe('')
    // desde 46 min: «H–H h» sin estado ni «…»; «9–12 h · Aprobada» se cortaba en un tramo de 3 h (unos 143 px)
    expect(reserva('10:00', '10:46')).toBe('10–10:46 h')
    expect(reserva('10:00', '11:30')).toBe('10–11:30 h')
    expect(reserva('10:00', '12:00', 'Pendiente')).toBe('10–12 h')
    expect(reserva('09:00', '12:00')).toBe('9–12 h')
    expect(reserva('08:00', '14:00')).toBe('8–14 h')
    for (const texto of [reserva('09:00', '12:00'), reserva('08:00', '14:00')]) {
      expect(texto).not.toMatch(/…|\.\.\.|Aprobada|Pendiente/)
    }
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
