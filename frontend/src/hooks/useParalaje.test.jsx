import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { fireEvent, render, screen } from '@testing-library/react'
import { useParalaje } from './useParalaje.js'

function Panel() {
  const ref = useParalaje()
  return <div ref={ref} data-testid="panel" />
}

const medidas = { left: 0, top: 0, width: 200, height: 100 }

beforeEach(() => {
  vi.stubGlobal('requestAnimationFrame', (cuadro) => {
    cuadro()
    return 1
  })
  vi.stubGlobal('cancelAnimationFrame', () => {})
  vi.spyOn(HTMLElement.prototype, 'getBoundingClientRect').mockReturnValue(medidas)
})

afterEach(() => {
  vi.unstubAllGlobals()
  vi.restoreAllMocks()
})

const coincide = (consulta, valor) =>
  vi.stubGlobal('matchMedia', (texto) => ({ matches: texto === consulta ? valor : false }))

describe('useParalaje: capas decorativas que siguen al puntero', () => {
  it('publica la posición del puntero como --mx y --my, de -1 a 1', () => {
    render(<Panel />)
    const panel = screen.getByTestId('panel')
    fireEvent.pointerMove(panel, { clientX: 200, clientY: 0 })
    expect(panel.style.getPropertyValue('--mx')).toBe('1.000')
    expect(panel.style.getPropertyValue('--my')).toBe('-1.000')
    fireEvent.pointerMove(panel, { clientX: 100, clientY: 50 })
    expect(panel.style.getPropertyValue('--mx')).toBe('0.000')
  })

  it('al salir el puntero vuelve al centro', () => {
    render(<Panel />)
    const panel = screen.getByTestId('panel')
    fireEvent.pointerMove(panel, { clientX: 200, clientY: 100 })
    fireEvent.pointerLeave(panel)
    expect(panel.style.getPropertyValue('--mx')).toBe('0')
    expect(panel.style.getPropertyValue('--my')).toBe('0')
  })

  it('con prefers-reduced-motion no se mueve nada', () => {
    coincide('(prefers-reduced-motion: reduce)', true)
    render(<Panel />)
    const panel = screen.getByTestId('panel')
    fireEvent.pointerMove(panel, { clientX: 200, clientY: 0 })
    expect(panel.style.getPropertyValue('--mx')).toBe('')
  })

  it('en pantallas táctiles tampoco', () => {
    coincide('(pointer: coarse)', true)
    render(<Panel />)
    const panel = screen.getByTestId('panel')
    fireEvent.pointerMove(panel, { clientX: 200, clientY: 0 })
    expect(panel.style.getPropertyValue('--mx')).toBe('')
  })
})
