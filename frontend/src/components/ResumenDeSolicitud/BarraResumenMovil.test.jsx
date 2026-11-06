import { describe, expect, it } from 'vitest'
import { render, screen } from '@testing-library/react'
import BarraResumenMovil from './BarraResumenMovil.jsx'

describe('BarraResumenMovil', () => {
  it('muestra datos completos en vivo de ambiente, fecha y horario', () => {
    render(
      <BarraResumenMovil
        ambiente={{ nombre: 'Laboratorio de Cómputo 2' }}
        fecha="20/11/2026"
        horaInicio="10:00"
        horaFin="12:00"
      />,
    )

    const region = screen.getByRole('region', { name: 'Resumen rápido de la solicitud' })
    expect(region).toBeInTheDocument()
    expect(screen.getByText('Laboratorio de Cómputo 2')).toBeInTheDocument()
    expect(screen.getByText('20/11/2026')).toBeInTheDocument()
    expect(screen.getByText('10:00 – 12:00')).toBeInTheDocument()
  })

  it('muestra valores por defecto si no se ha seleccionado nada', () => {
    render(<BarraResumenMovil ambiente={null} fecha="" horaInicio="" horaFin="" />)

    expect(screen.getByText('Sin ambiente')).toBeInTheDocument()
    expect(screen.getByText('Sin fecha')).toBeInTheDocument()
    expect(screen.getByText('Sin horario')).toBeInTheDocument()
  })
})
