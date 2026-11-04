import { afterEach, describe, expect, it, vi } from 'vitest'
import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { MemoryRouter } from 'react-router-dom'
import App from './App'
import { MENSAJES } from './constants/messages'
import { OPCIONES_MENU } from './constants/navegacion'

function mostrarApp(ruta = '/') {
  return render(
    <MemoryRouter initialEntries={[ruta]}>
      <App />
    </MemoryRouter>,
  )
}

describe('App con Layout y estado del sistema', () => {
  afterEach(() => {
    vi.unstubAllGlobals()
  })

  it('muestra el menú lateral con las cinco opciones y la activa', () => {
    vi.stubGlobal('fetch', vi.fn().mockResolvedValue({ ok: true }))
    mostrarApp()

    const menu = screen.getByRole('navigation', { name: 'Principal' })
    expect(menu.querySelectorAll('a')).toHaveLength(OPCIONES_MENU.length)
    expect(screen.getByRole('link', { name: 'Dashboard' })).toHaveAttribute('aria-current', 'page')
    expect(screen.getByRole('link', { name: 'Reservas' })).not.toHaveAttribute('aria-current')
  })

  it('muestra el estado de carga y luego "disponible" cuando la API responde', async () => {
    vi.stubGlobal('fetch', vi.fn().mockResolvedValue({ ok: true }))
    mostrarApp()

    expect(screen.getByRole('status')).toHaveTextContent(MENSAJES.salud.cargando)
    expect(await screen.findByText(MENSAJES.salud.disponible)).toBeInTheDocument()
  })

  it('muestra un error con role alert cuando la API no responde', async () => {
    vi.stubGlobal('fetch', vi.fn().mockRejectedValue(new Error('sin red')))
    mostrarApp()

    expect(await screen.findByRole('alert')).toHaveTextContent(MENSAJES.salud.sinConexion)
  })

  it('abre y cierra el menú en móvil con el botón Menú', async () => {
    vi.stubGlobal('fetch', vi.fn().mockResolvedValue({ ok: true }))
    mostrarApp()
    const botonMenu = screen.getByText('Menú', { selector: 'button' })

    expect(botonMenu).toHaveAttribute('aria-expanded', 'false')
    await userEvent.click(botonMenu)
    expect(botonMenu).toHaveAttribute('aria-expanded', 'true')
    await userEvent.click(botonMenu)
    expect(botonMenu).toHaveAttribute('aria-expanded', 'false')
  })

  it('muestra la pantalla en construcción en una ruta aún no construida', () => {
    vi.stubGlobal('fetch', vi.fn().mockResolvedValue({ ok: true }))
    mostrarApp('/reservas')

    expect(screen.getByRole('heading', { name: MENSAJES.pendiente.titulo })).toBeInTheDocument()
    expect(screen.getByRole('link', { name: 'Reservas' })).toHaveAttribute('aria-current', 'page')
  })
})
