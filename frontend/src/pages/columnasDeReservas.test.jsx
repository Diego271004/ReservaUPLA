import { describe, expect, it } from 'vitest'
import { render, screen } from '@testing-library/react'
import { columnasDeReservas } from './columnasDeReservas.jsx'

const reserva = { fecha: '2026-11-05', horaInicio: '10:00', horaFin: '12:00', estado: 'Aprobada' }

describe('columnasDeReservas', () => {
  it('devuelve las columnas pedidas, en ese orden, con sus títulos', () => {
    const columnas = columnasDeReservas(['fecha', 'horario', 'estado'])
    expect(columnas.map((c) => c.titulo)).toEqual(['Fecha', 'Horario', 'Estado'])
  })

  it('formatea la fecha dd/mm/aaaa, el horario y pinta el estado con su insignia', () => {
    const [fecha, horario, estado] = columnasDeReservas(['fecha', 'horario', 'estado'])
    expect(fecha.render(reserva)).toBe('05/11/2026')
    expect(horario.render(reserva)).toBe('10:00 – 12:00')
    render(estado.render(reserva))
    expect(screen.getByText('Aprobada')).toBeInTheDocument()
  })

  it('las columnas de texto leen el campo de la reserva', () => {
    const [ambiente, solicitante] = columnasDeReservas(['ambiente', 'solicitante'])
    expect(ambiente.clave).toBe('ambienteNombre')
    expect(solicitante.clave).toBe('solicitanteNombre')
  })

  it('agrega al final la columna «Acciones» de la pantalla, o ninguna', () => {
    const acciones = () => 'botones'
    const con = columnasDeReservas(['fecha'], acciones)
    expect(con.map((c) => c.titulo)).toEqual(['Fecha', 'Acciones'])
    expect(con.at(-1).render()).toBe('botones')
    expect(columnasDeReservas(['fecha'])).toHaveLength(1)
  })
})
