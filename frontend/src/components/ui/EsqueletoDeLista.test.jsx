import { describe, expect, it } from 'vitest'
import { render, screen } from '@testing-library/react'
import EsqueletoDeLista from './EsqueletoDeLista.jsx'

describe('EsqueletoDeLista', () => {
  it('el lector oye el mensaje de estado y el esqueleto es solo decorativo', () => {
    render(<EsqueletoDeLista texto="Cargando reservas…" />)
    expect(screen.getByRole('status')).toHaveTextContent('Cargando reservas…')
    expect(screen.getByTestId('esqueleto-de-lista')).toHaveAttribute('aria-hidden', 'true')
  })

  it('dibuja una cabecera y las filas pedidas (cinco por omisión)', () => {
    const { rerender } = render(<EsqueletoDeLista texto="Cargando…" />)
    expect(screen.getByTestId('esqueleto-de-lista').children).toHaveLength(1 + 5)
    rerender(<EsqueletoDeLista texto="Cargando…" filas={3} />)
    expect(screen.getByTestId('esqueleto-de-lista').children).toHaveLength(1 + 3)
  })
})
