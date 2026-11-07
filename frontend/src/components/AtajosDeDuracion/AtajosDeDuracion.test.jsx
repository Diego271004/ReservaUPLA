import { describe, expect, it, vi } from 'vitest'
import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { TEXTOS } from '../../constants/messages.js'
import AtajosDeDuracion from './AtajosDeDuracion.jsx'

describe('AtajosDeDuracion (atajos rápidos 1 h, 2 h, 3 h)', () => {
  it('muestra 3 botones de duración en un grupo accesible', () => {
    render(<AtajosDeDuracion horaInicio="" horaFin="" alElegir={vi.fn()} />)

    const grupo = screen.getByRole('group', { name: 'Duración de la reserva' })
    expect(grupo).toBeInTheDocument()

    const botones = screen.getAllByRole('button')
    expect(botones).toHaveLength(3)
    expect(botones[0]).toHaveTextContent('1 h')
    expect(botones[1]).toHaveTextContent('2 h')
    expect(botones[2]).toHaveTextContent('3 h')
  })

  it('los botones están deshabilitados con title informativo y texto explicativo cuando no hay hora de inicio', () => {
    render(<AtajosDeDuracion horaInicio="" horaFin="" alElegir={vi.fn()} />)

    const botones = screen.getAllByRole('button')
    for (const b of botones) {
      expect(b).toBeDisabled()
      expect(b).toHaveAttribute('title', TEXTOS.atajosAyudaHoraInicio)
      expect(b).toHaveAttribute('aria-describedby', 'ayuda-atajos-inicio')
      expect(b).toHaveAttribute('aria-pressed', 'false')
    }
    expect(screen.getByText(TEXTOS.atajosAyudaHoraInicio)).toBeInTheDocument()
  })

  it('con hora de inicio disponible los botones están activos, clicables y el texto explicativo desaparece', async () => {
    const alElegir = vi.fn()
    render(<AtajosDeDuracion horaInicio="10:00" horaFin="" alElegir={alElegir} />)

    expect(screen.queryByText(TEXTOS.atajosAyudaHoraInicio)).toBeNull()
    const boton2h = screen.getByRole('button', { name: '2 h' })
    expect(boton2h).not.toBeDisabled()
    expect(boton2h).toHaveAttribute('aria-pressed', 'false')

    await userEvent.click(boton2h)
    expect(alElegir).toHaveBeenCalledWith('10:00', '12:00')
  })

  it('el atajo activo se marca con aria-pressed true y clase elegida', () => {
    render(<AtajosDeDuracion horaInicio="08:00" horaFin="09:00" alElegir={vi.fn()} />)

    const boton1h = screen.getByRole('button', { name: '1 h' })
    const boton2h = screen.getByRole('button', { name: '2 h' })

    expect(boton1h).toHaveAttribute('aria-pressed', 'true')
    expect(boton1h.className).toMatch(/elegida/)
    expect(boton2h).toHaveAttribute('aria-pressed', 'false')
    expect(boton2h.className).not.toMatch(/elegida/)
  })

  it('si un atajo pasa de las 22:00 queda deshabilitado con title explicativo', () => {
    render(<AtajosDeDuracion horaInicio="21:00" horaFin="" alElegir={vi.fn()} />)

    const boton1h = screen.getByRole('button', { name: '1 h' })
    const boton2h = screen.getByRole('button', { name: '2 h' })
    const boton3h = screen.getByRole('button', { name: '3 h' })

    expect(boton1h).not.toBeDisabled()
    expect(boton2h).toBeDisabled()
    expect(boton2h).toHaveAttribute('title', 'Pasaría de las 22:00')
    expect(boton3h).toBeDisabled()
    expect(boton3h).toHaveAttribute('title', 'Pasaría de las 22:00')
  })
})
