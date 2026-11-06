import { useState } from 'react'
import { describe, expect, it, vi } from 'vitest'
import { render, screen, within } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import ModalDeReserva from './ModalDeReserva.jsx'

const reserva = {
  ambienteNombre: 'Auditorio Principal',
  solicitanteNombre: 'Ana Torres',
  fecha: '2026-11-05',
  horaInicio: '10:00',
  horaFin: '12:00',
}

describe('ModalDeReserva', () => {
  it('sin acción está cerrado', () => {
    render(
      <ModalDeReserva accion={null} reserva={null} alConfirmar={() => {}} alVolver={() => {}} />,
    )
    expect(screen.queryByRole('dialog')).not.toBeInTheDocument()
  })

  it('foco atrapado: Tab cicla dentro del modal', async () => {
    render(
      <div>
        <button type="button">Afuera</button>
        <ModalDeReserva
          accion="aprobar"
          reserva={reserva}
          alConfirmar={() => {}}
          alVolver={() => {}}
        />
      </div>,
    )
    const volver = screen.getByRole('button', { name: 'Volver' })
    const confirmar = screen.getByRole('button', { name: 'Sí, aprobar' })

    expect(volver).toHaveFocus()
    await userEvent.tab()
    expect(confirmar).toHaveFocus()
    await userEvent.tab()
    expect(volver).toHaveFocus()
    await userEvent.tab({ shift: true })
    expect(confirmar).toHaveFocus()
  })

  it('tecla Esc cierra el modal y regresa el foco al elemento que abrió', async () => {
    const alVolver = vi.fn()
    function Contenedor() {
      const [abierto, setAbierto] = useState(false)
      return (
        <div>
          <button type="button" onClick={() => setAbierto(true)}>
            Abrir modal
          </button>
          {abierto && (
            <ModalDeReserva
              accion="rechazar"
              reserva={reserva}
              alConfirmar={() => {}}
              alVolver={() => {
                alVolver()
                setAbierto(false)
              }}
            />
          )}
        </div>
      )
    }
    render(<Contenedor />)
    const botonAbrir = screen.getByRole('button', { name: 'Abrir modal' })
    await userEvent.click(botonAbrir)
    expect(screen.getByRole('dialog')).toBeInTheDocument()
    await userEvent.keyboard('{Escape}')
    expect(alVolver).toHaveBeenCalledTimes(1)
    expect(screen.queryByRole('dialog')).not.toBeInTheDocument()
    expect(botonAbrir).toHaveFocus()
  })

  it('el botón principal lleva el verbo exacto según la acción', () => {
    const { rerender } = render(
      <ModalDeReserva
        accion="aprobar"
        reserva={reserva}
        alConfirmar={() => {}}
        alVolver={() => {}}
      />,
    )
    expect(screen.getByRole('button', { name: 'Sí, aprobar' })).toBeInTheDocument()
    expect(screen.getByRole('button', { name: 'Volver' })).toBeInTheDocument()

    rerender(
      <ModalDeReserva
        accion="rechazar"
        reserva={reserva}
        alConfirmar={() => {}}
        alVolver={() => {}}
      />,
    )
    expect(screen.getByRole('button', { name: 'Sí, rechazar' })).toBeInTheDocument()

    rerender(
      <ModalDeReserva
        accion="cancelar"
        reserva={reserva}
        alConfirmar={() => {}}
        alVolver={() => {}}
      />,
    )
    expect(screen.getByRole('button', { name: 'Sí, cancelar reserva' })).toBeInTheDocument()
  })

  it.each([
    ['aprobar', '¿Aprobar esta reserva?', 'Sí, aprobar', false],
    ['rechazar', '¿Rechazar esta reserva?', 'Sí, rechazar', true],
    ['cancelar', '¿Cancelar esta reserva?', 'Sí, cancelar reserva', true],
  ])(
    '%s: título, resumen, botón y advertencia de irreversible (%s)',
    async (accion, titulo, confirmar, irreversible) => {
      const alConfirmar = vi.fn()
      render(
        <ModalDeReserva
          accion={accion}
          reserva={reserva}
          alConfirmar={alConfirmar}
          alVolver={() => {}}
        />,
      )
      const dialogo = screen.getByRole('dialog', { name: titulo })
      expect(within(dialogo).getByText('Horario: 05/11/2026, 10:00 – 12:00')).toBeInTheDocument()
      expect(Boolean(within(dialogo).queryByText('Esta acción no se puede deshacer.'))).toBe(
        irreversible,
      )
      await userEvent.click(within(dialogo).getByRole('button', { name: confirmar }))
      expect(alConfirmar).toHaveBeenCalledTimes(1)
    },
  )
})
