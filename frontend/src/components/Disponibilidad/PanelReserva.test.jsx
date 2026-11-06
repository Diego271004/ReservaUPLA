import { describe, expect, it, vi } from 'vitest'
import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { MemoryRouter } from 'react-router-dom'
import PanelReserva from './PanelReserva.jsx'

describe('PanelReserva (panel accesible de detalle de disponibilidad)', () => {
  it('para el Solicitante: muestra horario y estado pero oculta nombre y motivo ajenos', () => {
    const reservaAjena = {
      id: 10,
      horaInicio: '10:00',
      horaFin: '12:00',
      estado: 'Aprobada',
      solicitanteNombre: 'Carlos Prado',
      motivo: 'Examen de suficiencia',
      propia: false,
    }

    render(
      <MemoryRouter>
        <PanelReserva
          reserva={reservaAjena}
          ambiente={{ nombre: 'Auditorio Principal' }}
          rol="Solicitante"
          onCerrar={vi.fn()}
        />
      </MemoryRouter>,
    )

    expect(screen.getByRole('dialog')).toBeInTheDocument()
    expect(screen.getByText('Auditorio Principal')).toBeInTheDocument()
    expect(screen.getByText('10:00 – 12:00')).toBeInTheDocument()
    expect(screen.getByText('Aprobada')).toBeInTheDocument()

    // Privacidad: no muestra Carlos Prado ni Examen de suficiencia
    expect(screen.queryByText('Carlos Prado')).not.toBeInTheDocument()
    expect(screen.queryByText('Examen de suficiencia')).not.toBeInTheDocument()
    expect(screen.getByText('Horario reservado por otro usuario.')).toBeInTheDocument()
  })

  it('para el Administrador: muestra solicitante, motivo y botón Ver detalle', () => {
    const reserva = {
      id: 10,
      horaInicio: '14:00',
      horaFin: '16:00',
      estado: 'Pendiente',
      solicitanteNombre: 'Beatriz Silva',
      motivo: 'Capacitación docente',
    }

    render(
      <MemoryRouter>
        <PanelReserva
          reserva={reserva}
          ambiente={{ nombre: 'Laboratorio de Cómputo 2' }}
          rol="Administrador"
          onCerrar={vi.fn()}
        />
      </MemoryRouter>,
    )

    expect(screen.getByText('Beatriz Silva')).toBeInTheDocument()
    expect(screen.getByText('Capacitación docente')).toBeInTheDocument()
    expect(screen.getByRole('button', { name: 'Ver detalle' })).toBeInTheDocument()
  })

  it('permite cerrar el panel con el botón Volver o tecla Escape', async () => {
    const alCerrar = vi.fn()
    const reserva = {
      id: 1,
      horaInicio: '08:00',
      horaFin: '10:00',
      estado: 'Aprobada',
    }

    render(
      <MemoryRouter>
        <PanelReserva
          reserva={reserva}
          ambiente={{ nombre: 'Sala A' }}
          rol="Solicitante"
          onCerrar={alCerrar}
        />
      </MemoryRouter>,
    )

    await userEvent.click(screen.getByRole('button', { name: 'Volver' }))
    expect(alCerrar).toHaveBeenCalledTimes(1)

    await userEvent.keyboard('{Escape}')
    expect(alCerrar).toHaveBeenCalledTimes(2)
  })
})
