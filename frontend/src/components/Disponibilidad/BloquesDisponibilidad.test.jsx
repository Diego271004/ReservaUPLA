import { render, screen } from '@testing-library/react'
import { MemoryRouter } from 'react-router-dom'
import { describe, expect, it } from 'vitest'
import { AgendaMovil, BloquesEscritorio } from './BloquesDisponibilidad.jsx'

const AMBIENTES_PRUEBA = [
  {
    id: 1,
    nombre: 'Laboratorio de Cómputo 2',
    estado: 'Disponible',
    bloques: [
      {
        id: 101,
        horaInicio: '10:00',
        horaFin: '12:00',
        estado: 'Pendiente',
        solicitanteNombre: 'Ana Torres',
        motivo: 'Taller de bases de datos',
      },
      {
        id: 102,
        horaInicio: '11:00',
        horaFin: '13:00',
        estado: 'Aprobada',
        solicitanteNombre: 'Carlos Vera',
        motivo: 'Práctica de redes',
      },
    ],
  },
  {
    id: 2,
    nombre: 'Sala de Reuniones A',
    estado: 'En mantenimiento',
    bloques: [],
  },
]

describe('BloquesDisponibilidad: formato sin recorte en bloques cortos', () => {
  it('en escritorio los bloques cortos de hasta 2 h usan formato abreviado sin elipsis', () => {
    render(
      <MemoryRouter>
        <BloquesEscritorio
          ambientes={AMBIENTES_PRUEBA}
          datos={{ fecha: '2026-11-20', soloLectura: false }}
          hoySeleccionado={false}
          ahora={new Date('2026-11-20T10:00:00')}
          rol="Administrador"
          past={false}
          responsable={false}
        />
      </MemoryRouter>,
    )

    // Reserva de 2 h (10:00 a 12:00): texto visible conciso "10–12 h", sin elipsis
    const bloque10 = screen.getByRole('button', {
      name: /Laboratorio de Cómputo 2: 10:00–12:00, Pendiente/i,
    })
    expect(bloque10.textContent).toContain('10–12 h')
    expect(bloque10.textContent).not.toContain('…')
    expect(bloque10.textContent).not.toContain('10:00–12:00 · Pendiente')
    expect(bloque10).toHaveAttribute('title', expect.stringContaining('Taller de bases de datos'))

    // Reserva de 2 h solapada (11:00 a 13:00): carril 1, "11–13 h"
    const bloque11 = screen.getByRole('button', {
      name: /Laboratorio de Cómputo 2: 11:00–13:00, Aprobada/i,
    })
    expect(bloque11.textContent).toContain('11–13 h')
    expect(bloque11.textContent).not.toContain('…')
    expect(bloque11).toHaveAttribute('title', expect.stringContaining('Práctica de redes'))

    // Tramo libre de 3 h (07:00 a 10:00): texto visible "Libre 7–10 h"
    const libreManana = screen.getByRole('button', {
      name: /Laboratorio de Cómputo 2: Libre, 07:00 a 10:00/i,
    })
    expect(libreManana.textContent).toContain('Libre 7–10 h')
    expect(libreManana.textContent).not.toContain('…')

    // Mantenimiento de todo el día
    const mant = screen.getByRole('button', {
      name: /Sala de Reuniones A: mantenimiento, todo el día/i,
    })
    expect(mant.textContent).toContain('Mantenimiento')
  })

  it('en vista móvil y ultra-estrecha (375 px y 188 px) los elementos de agenda no se truncan con elipsis', () => {
    const { container } = render(
      <MemoryRouter>
        <AgendaMovil
          ambientes={AMBIENTES_PRUEBA}
          datos={{ fecha: '2026-11-20', soloLectura: false }}
          past={false}
          responsable={false}
        />
      </MemoryRouter>,
    )

    // Todos los botones de la agenda móvil tienen texto legible
    const botonesMoviles = container.querySelectorAll('button')
    expect(botonesMoviles.length).toBeGreaterThan(0)
    for (const boton of botonesMoviles) {
      expect(boton.textContent).not.toContain('…')
      expect(boton.textContent).not.toContain('undefined')
      expect(boton).toHaveAttribute('aria-label')
    }
  })
})
