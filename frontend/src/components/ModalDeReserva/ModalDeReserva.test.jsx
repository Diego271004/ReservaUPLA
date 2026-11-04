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
