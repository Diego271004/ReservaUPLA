import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { act, render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { AvisosProvider, useAvisos } from '../../context/AvisosContext.jsx'
import { DURACION_AVISO_MS } from './Aviso.jsx'

function Disparador({ mensaje = 'Reserva aprobada.', tipo }) {
  const { avisar } = useAvisos()
  return <button onClick={() => avisar(mensaje, tipo)}>Avisar</button>
}
const montar = (props) =>
  render(
    <AvisosProvider>
      <Disparador {...props} />
    </AvisosProvider>,
  )
const avanzar = (ms) => act(() => vi.advanceTimersByTime(ms))
const nuevoUsuario = () => userEvent.setup({ advanceTimers: vi.advanceTimersByTime })

beforeEach(() => vi.useFakeTimers({ shouldAdvanceTime: true }))
afterEach(() => vi.useRealTimers())

describe('Avisos (toasts): éxito de una acción sin bloquear', () => {
  it('muestra el mensaje con icono y texto, en una región role="status"', async () => {
    const usuario = nuevoUsuario()
    montar()
    await usuario.click(screen.getByRole('button', { name: 'Avisar' }))
    const aviso = screen.getByRole('status')
    expect(aviso).toHaveTextContent('Reserva aprobada.')
    expect(aviso.querySelector('svg[aria-hidden="true"]')).not.toBeNull()
  })

  it('se cierra a mano con «Cerrar aviso»', async () => {
    const usuario = nuevoUsuario()
    montar()
    await usuario.click(screen.getByRole('button', { name: 'Avisar' }))
    await usuario.click(screen.getByRole('button', { name: 'Cerrar aviso' }))
    expect(screen.queryByRole('status')).toBeNull()
  })

  it('se cierra solo a los 6 segundos', async () => {
    const usuario = nuevoUsuario()
    montar()
    expect(DURACION_AVISO_MS).toBe(6000)
    await usuario.click(screen.getByRole('button', { name: 'Avisar' }))
    avanzar(5900)
    expect(screen.getByRole('status')).toBeInTheDocument()
    avanzar(200)
    expect(screen.queryByRole('status')).toBeNull()
  })

  it('el cierre automático se pausa mientras el puntero está encima y sigue al salir', async () => {
    const usuario = nuevoUsuario()
    montar()
    await usuario.click(screen.getByRole('button', { name: 'Avisar' }))
    avanzar(4000)
    await usuario.hover(screen.getByRole('status'))
    avanzar(20000)
    expect(screen.getByRole('status')).toBeInTheDocument()
    await usuario.unhover(screen.getByRole('status'))
    avanzar(1900)
    expect(screen.getByRole('status')).toBeInTheDocument()
    avanzar(300)
    expect(screen.queryByRole('status')).toBeNull()
  })

  it('el cierre automático se pausa mientras el foco está dentro', async () => {
    const usuario = nuevoUsuario()
    montar()
    await usuario.click(screen.getByRole('button', { name: 'Avisar' }))
    await usuario.tab() // el foco entra al botón «Cerrar aviso»
    expect(screen.getByRole('button', { name: 'Cerrar aviso' })).toHaveFocus()
    avanzar(30000)
    expect(screen.getByRole('status')).toBeInTheDocument()
    await usuario.tab() // sale del aviso
    avanzar(6100)
    expect(screen.queryByRole('status')).toBeNull()
  })

  it('apila varios avisos y cada uno se cierra por su cuenta', async () => {
    const usuario = nuevoUsuario()
    montar()
    await usuario.click(screen.getByRole('button', { name: 'Avisar' }))
    avanzar(3000)
    await usuario.click(screen.getByRole('button', { name: 'Avisar' }))
    expect(screen.getAllByRole('status')).toHaveLength(2)
    avanzar(3100)
    expect(screen.getAllByRole('status')).toHaveLength(1)
  })

  it('sin proveedor, avisar no hace nada y no falla', async () => {
    function Suelto() {
      const { avisar } = useAvisos()
      return <button onClick={() => avisar('x')}>Suelto</button>
    }
    const usuario = nuevoUsuario()
    render(<Suelto />)
    await usuario.click(screen.getByRole('button', { name: 'Suelto' }))
    expect(screen.queryByRole('status')).toBeNull()
  })
})
