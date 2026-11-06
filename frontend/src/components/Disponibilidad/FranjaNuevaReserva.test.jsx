import { cleanup, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { RESULTADO } from '../../services/llamarApi.js'
import { obtenerDisponibilidadDia } from '../../services/recursosService.js'
import { renderEnRuta, SESIONES } from '../../test/utils.jsx'
import FranjaNuevaReserva from './FranjaNuevaReserva.jsx'

vi.mock('../../services/recursosService.js', () => ({
  obtenerDisponibilidadDia: vi.fn(),
}))

beforeEach(() => vi.resetAllMocks())
afterEach(cleanup)

describe('FranjaNuevaReserva', () => {
  it('actualiza ambiente y fecha y rellena inicio y fin con el tramo libre', async () => {
    obtenerDisponibilidadDia.mockResolvedValue({
      tipo: RESULTADO.exito,
      data: {
        fecha: '2026-11-05',
        soloLectura: false,
        ambientes: [
          {
            id: 1,
            nombre: 'Laboratorio',
            estado: 'Disponible',
            bloques: [],
          },
        ],
      },
    })
    let seleccionado
    renderEnRuta(
      <FranjaNuevaReserva
        ambienteId="1"
        fecha="05/11/2026"
        horaInicio=""
        horaFin=""
        seleccionar={(inicio, fin) => {
          seleccionado = [inicio, fin]
        }}
      />,
      { sesionInicial: SESIONES.solicitante },
    )

    const libre = await screen.findByRole('button', { name: 'Libre 07:00–22:00' })
    await userEvent.click(libre)
    expect(seleccionado).toEqual(['07:00', '08:00'])
  })

  const dia = (bloques) => ({
    tipo: RESULTADO.exito,
    data: {
      fecha: '2026-11-05',
      soloLectura: false,
      ambientes: [{ id: 1, nombre: 'Laboratorio', estado: 'Disponible', bloques }],
    },
  })

  const mostrar = (horaInicio, horaFin) =>
    renderEnRuta(
      <FranjaNuevaReserva
        ambienteId="1"
        fecha="05/11/2026"
        horaInicio={horaInicio}
        horaFin={horaFin}
        seleccionar={() => {}}
      />,
      { sesionInicial: SESIONES.solicitante },
    )

  it('con una reserva APROBADA que se cruza muestra la etiqueta «Choque» en el tramo ocupado (RN-01)', async () => {
    obtenerDisponibilidadDia.mockResolvedValue(
      dia([{ id: 8, horaInicio: '09:00', horaFin: '10:00', estado: 'Aprobada' }]),
    )
    mostrar('09:00', '09:30')
    expect(await screen.findByText('Choque')).toBeInTheDocument()
    // La alerta roja redundante se retiró de la franja: el aviso oficial lo muestra el sistema con las horas
    expect(screen.queryByText(/se cruza con una reserva aprobada/)).not.toBeInTheDocument()
  })

  it('con una solicitud PENDIENTE que se cruza no hay choque: solo se informa y se puede pedir igual', async () => {
    obtenerDisponibilidadDia.mockResolvedValue(
      dia([{ id: 8, horaInicio: '09:00', horaFin: '10:00', estado: 'Pendiente' }]),
    )
    mostrar('09:00', '09:30')
    expect(
      await screen.findByText(/Ya hay una solicitud pendiente en ese horario/),
    ).toBeInTheDocument()
    expect(screen.queryByText(/se cruza con una reserva aprobada/)).not.toBeInTheDocument()
    expect(screen.queryByText('Choque')).not.toBeInTheDocument()
  })

  it('elegir un horario dentro de un tramo libre no es un choque', async () => {
    obtenerDisponibilidadDia.mockResolvedValue(
      dia([{ id: 8, horaInicio: '10:00', horaFin: '12:00', estado: 'Aprobada' }]),
    )
    mostrar('14:00', '16:00')
    await screen.findByRole('button', { name: 'Libre 12:00–22:00' })
    expect(screen.queryByText('Choque')).not.toBeInTheDocument()
    expect(screen.queryByText(/se cruza con una reserva aprobada/)).not.toBeInTheDocument()
    expect(screen.queryByText(/solicitud pendiente/)).not.toBeInTheDocument()
  })
})
