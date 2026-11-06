import { render, screen } from '@testing-library/react'
import { describe, expect, it } from 'vitest'
import EjeTiempo from './EjeTiempo.jsx'

describe('EjeTiempo', () => {
  it('muestra la hora exacta de Lima y la ubica proporcionalmente sin redondear', () => {
    const ahora = new Date(2026, 10, 5, 15, 11)
    render(<EjeTiempo ahora={ahora} hoy />)

    const etiqueta = screen.getByLabelText('Ahora 15:11')
    expect(etiqueta.textContent).toBe('Ahora 15:11')
    // La posición va dentro de un clamp() que la mantiene dentro del carril: se lee el porcentaje exacto de la hora.
    const izquierda = Number.parseFloat(etiqueta.style.left.match(/(\d+(?:\.\d+)?)%/)[1])
    expect(izquierda).toBeCloseTo(((15 * 60 + 11 - 420) / 900) * 100, 3)
  })
})
