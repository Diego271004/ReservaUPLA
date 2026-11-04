import { describe, expect, it, vi } from 'vitest'
import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import AvisoDeError from './AvisoDeError.jsx'

describe('AvisoDeError', () => {
  it('muestra el mensaje como alerta y «Reintentar» lo vuelve a pedir', async () => {
    const alReintentar = vi.fn()
    render(<AvisoDeError mensaje="No pudimos conectar." alReintentar={alReintentar} />)
    expect(screen.getByRole('alert')).toHaveTextContent('No pudimos conectar.')
    await userEvent.click(screen.getByRole('button', { name: 'Reintentar' }))
    expect(alReintentar).toHaveBeenCalledTimes(1)
  })
})
