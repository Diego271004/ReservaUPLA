import { beforeEach, describe, expect, it, vi } from 'vitest'
import { act, renderHook, waitFor } from '@testing-library/react'
import { MemoryRouter } from 'react-router-dom'
import { PendientesProvider } from '../context/PendientesContext.jsx'
import { RESULTADO } from '../services/llamarApi.js'
import { aprobarReserva, obtenerDashboard, obtenerReserva } from '../services/recursosService.js'
import { useDecisionDeReserva } from './useDecisionDeReserva.js'
import { useDetalleReserva } from './useDetalleReserva.js'

vi.mock('../services/recursosService.js', () => ({
  aprobarReserva: vi.fn(),
  cancelarReserva: vi.fn(),
  rechazarReserva: vi.fn(),
  obtenerDashboard: vi.fn(),
  obtenerReserva: vi.fn(),
}))

const exito = (data) => ({ tipo: RESULTADO.exito, data })
const envoltorio = ({ children }) => (
  <MemoryRouter>
    <PendientesProvider activo>{children}</PendientesProvider>
  </MemoryRouter>
)

beforeEach(() => {
  vi.resetAllMocks()
  obtenerDashboard.mockResolvedValue(exito({ indicadores: { pendientes: 2 } }))
})

describe('el contador de pendientes del menú se actualiza tras aprobar o rechazar', () => {
  it('al decidir desde una lista (Dashboard)', async () => {
    aprobarReserva.mockResolvedValue(exito({ reserva: { id: 7, estado: 'Aprobada' } }))
    const { result } = renderHook(() => useDecisionDeReserva(() => {}), { wrapper: envoltorio })
    await waitFor(() => expect(obtenerDashboard).toHaveBeenCalledTimes(1)) // lectura inicial
    act(() => result.current.abrir('aprobar', { id: 7 }))
    await act(async () => result.current.confirmar())
    await waitFor(() => expect(obtenerDashboard).toHaveBeenCalledTimes(2))
  })

  it('al decidir desde el detalle de la reserva', async () => {
    const detalle = { reserva: { id: 7, estado: 'Pendiente' }, historial: [] }
    obtenerReserva.mockResolvedValue(exito(detalle))
    aprobarReserva.mockResolvedValue(exito({ ...detalle, reserva: { id: 7, estado: 'Aprobada' } }))
    const { result } = renderHook(() => useDetalleReserva(7), { wrapper: envoltorio })
    await waitFor(() => expect(result.current.estado).toBe('listo'))
    act(() => result.current.abrirModal('aprobar'))
    await act(async () => result.current.confirmar())
    await waitFor(() => expect(obtenerDashboard).toHaveBeenCalledTimes(2))
  })

  it('si la decisión falla, el contador no se vuelve a pedir', async () => {
    aprobarReserva.mockResolvedValue({ tipo: RESULTADO.errorServidor })
    const { result } = renderHook(() => useDecisionDeReserva(() => {}), { wrapper: envoltorio })
    await waitFor(() => expect(obtenerDashboard).toHaveBeenCalledTimes(1))
    act(() => result.current.abrir('aprobar', { id: 7 }))
    await act(async () => result.current.confirmar())
    expect(obtenerDashboard).toHaveBeenCalledTimes(1)
  })
})
