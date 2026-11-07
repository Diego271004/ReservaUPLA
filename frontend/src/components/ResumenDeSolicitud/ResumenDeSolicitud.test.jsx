import { describe, expect, it } from 'vitest'
import { render, screen } from '@testing-library/react'
import ResumenDeSolicitud from './ResumenDeSolicitud.jsx'

describe('ResumenDeSolicitud (resumen vivo de la solicitud)', () => {
  it('muestra «Sin elegir» con estilo apagado (clase .pendiente) cuando ningún campo está seleccionado', () => {
    const { container } = render(
      <ResumenDeSolicitud ambiente={null} fecha="" horaInicio="" horaFin="" motivo="" />,
    )

    const elementosPendientes = container.querySelectorAll('dd')
    expect(elementosPendientes.length).toBe(4)
    for (const dd of elementosPendientes) {
      expect(dd.textContent).toBe('Sin elegir')
      expect(dd.className).toMatch(/pendiente/)
    }
  })

  it('al elegir datos los valores se muestran con clase de elegido y detalle correspondiente', () => {
    const ambiente = { id: 1, nombre: 'Laboratorio de Cómputo 2', detalle: 'Pabellón A, piso 2' }
    const { container } = render(
      <ResumenDeSolicitud
        ambiente={ambiente}
        fecha="20/11/2026"
        horaInicio="08:00"
        horaFin="10:00"
        motivo="Clase de Programación"
      />,
    )

    const elementosDd = container.querySelectorAll('dd')
    for (const dd of elementosDd) {
      expect(dd.className).toMatch(/elegido/)
      expect(dd.className).not.toMatch(/pendiente/)
    }

    expect(screen.getByText('Laboratorio de Cómputo 2')).toBeInTheDocument()
    expect(screen.getByText('08:00 – 10:00')).toBeInTheDocument()
    expect(screen.getByText('2 h')).toBeInTheDocument()
    expect(screen.getByText('Clase de Programación')).toBeInTheDocument()
  })

  it('el lector de pantalla dispone de región aside con aria-label y lista con aria-live polite', () => {
    render(<ResumenDeSolicitud ambiente={null} fecha="" horaInicio="" horaFin="" motivo="" />)

    const aside = screen.getByRole('complementary', { name: 'Resumen de tu solicitud' })
    expect(aside).toBeInTheDocument()
    const dl = aside.querySelector('dl')
    expect(dl).toHaveAttribute('aria-live', 'polite')
  })
})
