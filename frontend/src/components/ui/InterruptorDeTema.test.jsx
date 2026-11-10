import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { CLAVE_TEMA } from '../../hooks/useTema.js'
import InterruptorDeTema from './InterruptorDeTema.jsx'

beforeEach(() => {
  delete document.documentElement.dataset.tema
  localStorage.clear()
})

afterEach(() => {
  delete document.documentElement.dataset.tema
  localStorage.clear()
  vi.restoreAllMocks()
})

describe('InterruptorDeTema: modo claro y oscuro', () => {
  it('empieza en claro: ofrece cambiar a modo oscuro y muestra la luna', () => {
    const { container } = render(<InterruptorDeTema />)
    expect(screen.getByRole('button', { name: 'Cambiar a modo oscuro' })).toBeInTheDocument()
    expect(container.querySelector('svg path')?.getAttribute('d')).toMatch(/^M21 12\.8/)
  })

  it('al pulsarlo pone data-tema="oscuro" en <html>, lo guarda y el nombre pasa a «Cambiar a modo claro» (sin aria-pressed)', async () => {
    render(<InterruptorDeTema />)
    await userEvent.click(screen.getByRole('button', { name: 'Cambiar a modo oscuro' }))
    expect(document.documentElement.dataset.tema).toBe('oscuro')
    expect(localStorage.getItem(CLAVE_TEMA)).toBe('oscuro')
    const boton = screen.getByRole('button', { name: 'Cambiar a modo claro' })
    expect(boton).not.toHaveAttribute('aria-pressed')
  })

  it('volver a pulsarlo regresa al claro y lo recuerda', async () => {
    render(<InterruptorDeTema />)
    await userEvent.click(screen.getByRole('button', { name: 'Cambiar a modo oscuro' }))
    await userEvent.click(screen.getByRole('button', { name: 'Cambiar a modo claro' }))
    expect(document.documentElement.dataset.tema).toBe('claro')
    expect(localStorage.getItem(CLAVE_TEMA)).toBe('claro')
  })

  it('si ya estaba en oscuro (lo puso index.html antes de pintar) arranca ofreciendo el modo claro', () => {
    document.documentElement.dataset.tema = 'oscuro'
    render(<InterruptorDeTema />)
    expect(screen.getByRole('button', { name: 'Cambiar a modo claro' })).toBeInTheDocument()
  })

  it('funciona con el teclado (Enter) y sin almacenamiento no se rompe', async () => {
    vi.spyOn(Storage.prototype, 'setItem').mockImplementation(() => {
      throw new Error('bloqueado')
    })
    render(<InterruptorDeTema />)
    screen.getByRole('button', { name: 'Cambiar a modo oscuro' }).focus()
    await userEvent.keyboard('{Enter}')
    expect(document.documentElement.dataset.tema).toBe('oscuro')
  })
})
