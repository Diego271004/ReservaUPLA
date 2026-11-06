import { beforeEach, describe, expect, it, vi } from 'vitest'
import { act, render, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { RESULTADO } from '../services/llamarApi.js'
import { obtenerDashboard } from '../services/recursosService.js'
import { PendientesProvider, usePendientes } from './PendientesContext.jsx'

vi.mock('../services/recursosService.js', () => ({ obtenerDashboard: vi.fn() }))

const panel = (pendientes) => ({ tipo: RESULTADO.exito, data: { indicadores: { pendientes } } })

function Lector() {
  const { pendientes, refrescar } = usePendientes()
  return (
    <>
      <p data-testid="n">{String(pendientes)}</p>
      <button onClick={refrescar}>refrescar</button>
    </>
  )
}
const montar = (activo = true) =>
  render(
    <PendientesProvider activo={activo}>
      <Lector />
    </PendientesProvider>,
  )

beforeEach(() => vi.resetAllMocks())

describe('PendientesContext: cuántas solicitudes esperan decisión (Administrador)', () => {
  it('lee el total de pendientes al montar', async () => {
    obtenerDashboard.mockResolvedValue(panel(6))
    montar()
    await waitFor(() => expect(screen.getByTestId('n')).toHaveTextContent('6'))
  })

  it('se actualiza al pedir refrescar (tras aprobar o rechazar)', async () => {
    obtenerDashboard.mockResolvedValueOnce(panel(6)).mockResolvedValueOnce(panel(5))
    montar()
    await waitFor(() => expect(screen.getByTestId('n')).toHaveTextContent('6'))
    await userEvent.click(screen.getByRole('button', { name: 'refrescar' }))
    await waitFor(() => expect(screen.getByTestId('n')).toHaveTextContent('5'))
  })

  it('si no está activo (otros roles) no consulta nada', async () => {
    montar(false)
    await act(async () => {})
    expect(obtenerDashboard).not.toHaveBeenCalled()
    expect(screen.getByTestId('n')).toHaveTextContent('0')
  })

  it('si la consulta falla, conserva el último valor y no rompe la pantalla', async () => {
    obtenerDashboard
      .mockResolvedValueOnce(panel(3))
      .mockResolvedValueOnce({ tipo: RESULTADO.errorServidor })
    montar()
    await waitFor(() => expect(screen.getByTestId('n')).toHaveTextContent('3'))
    await userEvent.click(screen.getByRole('button', { name: 'refrescar' }))
    await act(async () => {})
    expect(screen.getByTestId('n')).toHaveTextContent('3')
  })

  it('sin proveedor, usePendientes devuelve cero y refrescar no hace nada', async () => {
    render(<Lector />)
    expect(screen.getByTestId('n')).toHaveTextContent('0')
    await userEvent.click(screen.getByRole('button', { name: 'refrescar' }))
  })
})
