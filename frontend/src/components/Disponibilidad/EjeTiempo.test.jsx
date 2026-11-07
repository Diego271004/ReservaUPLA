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

  it.each([
    { hora: 7, minuto: 0, esperado: 'Ahora 07:00', pct: 0 },
    { hora: 13, minuto: 0, esperado: 'Ahora 13:00', pct: 40 },
    { hora: 21, minuto: 0, esperado: 'Ahora 21:00', pct: 93.333 },
    { hora: 22, minuto: 0, esperado: 'Ahora 22:00', pct: 100 },
  ])('ubica correctamente las horas límite ($esperado)', ({ hora, minuto, esperado, pct }) => {
    const ahora = new Date(2026, 10, 5, hora, minuto)
    render(<EjeTiempo ahora={ahora} hoy />)

    const etiqueta = screen.getByLabelText(esperado)
    expect(etiqueta).toBeInTheDocument()
    expect(etiqueta.textContent).toBe(esperado)
    expect(etiqueta.style.left).toContain('clamp(')

    const matchPct = etiqueta.style.left.match(/(\d+(?:\.\d+)?)%/)
    expect(Number.parseFloat(matchPct[1])).toBeCloseTo(pct, 1)

    // Todas las horas del eje siguen visibles en su fila, sin tapar ninguna
    for (const h of [7, 9, 11, 13, 15, 17, 19, 21]) {
      const textoHora = `${String(h).padStart(2, '0')}:00`
      const nodo = screen.getByText(textoHora)
      expect(nodo).toBeInTheDocument()
      expect(nodo.className).not.toMatch(/oculta/i)
    }
  })
})
