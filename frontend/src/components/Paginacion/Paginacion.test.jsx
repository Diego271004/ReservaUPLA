import { describe, expect, it, vi } from 'vitest'
import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import Paginacion from './Paginacion.jsx'

const mostrar = (pagina, total = 23, alCambiar = vi.fn()) => {
  render(<Paginacion pagina={pagina} total={total} tamano={10} alCambiar={alCambiar} />)
  return alCambiar
}

describe('Paginacion', () => {
  it('con una sola página no se dibuja', () => {
    mostrar(1, 7)
    expect(screen.queryByRole('navigation')).not.toBeInTheDocument()
  })

  it('en la primera página «Anterior» está deshabilitado y la página 1 es la actual', () => {
    mostrar(1)
    expect(screen.getByRole('button', { name: 'Anterior' })).toBeDisabled()
    expect(screen.getByRole('button', { name: 'Siguiente' })).toBeEnabled()
    expect(screen.getByRole('button', { name: 'Página 1' })).toHaveAttribute('aria-current', 'page')
    expect(screen.getByRole('button', { name: 'Página 2' })).not.toHaveAttribute('aria-current')
  })

  it('en la última página «Siguiente» está deshabilitado', () => {
    mostrar(3)
    expect(screen.getByRole('button', { name: 'Siguiente' })).toBeDisabled()
    expect(screen.getByRole('button', { name: 'Anterior' })).toBeEnabled()
  })

  it('«Siguiente», «Anterior» y un número piden la página correspondiente', async () => {
    const alCambiar = mostrar(2)
    await userEvent.click(screen.getByRole('button', { name: 'Siguiente' }))
    await userEvent.click(screen.getByRole('button', { name: 'Anterior' }))
    await userEvent.click(screen.getByRole('button', { name: 'Página 3' }))
    expect(alCambiar.mock.calls.map(([pagina]) => pagina)).toEqual([3, 1, 3])
  })

  it('un botón deshabilitado no pide nada', async () => {
    const alCambiar = mostrar(1)
    await userEvent.click(screen.getByRole('button', { name: 'Anterior' }))
    expect(alCambiar).not.toHaveBeenCalled()
  })

  it('con muchas páginas marca los huecos con «…» (que los lectores de pantalla no leen)', () => {
    mostrar(6, 120)
    const huecos = screen.getAllByText('…')
    expect(huecos).toHaveLength(2)
    huecos.forEach((hueco) => expect(hueco).toHaveAttribute('aria-hidden', 'true'))
  })

  it('se recorre con teclado: Tab pasa por «Anterior», los números y «Siguiente»', async () => {
    mostrar(2)
    await userEvent.tab()
    expect(screen.getByRole('button', { name: 'Anterior' })).toHaveFocus()
    await userEvent.tab()
    expect(screen.getByRole('button', { name: 'Página 1' })).toHaveFocus()
    await userEvent.tab()
    await userEvent.tab()
    await userEvent.tab()
    expect(screen.getByRole('button', { name: 'Siguiente' })).toHaveFocus()
  })
})
