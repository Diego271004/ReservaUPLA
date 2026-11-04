import { screen } from '@testing-library/react'
import { describe, expect, it } from 'vitest'
import { TEXTOS } from '../constants/messages.js'
import { renderEnRuta } from '../test/utils.jsx'
import { NoEncontradaPage, SinPermisoPage } from './ErrorRutaPage.jsx'

describe.each([
  ['Sin permiso', SinPermisoPage, TEXTOS.sinPermisoTitulo],
  ['Página no encontrada', NoEncontradaPage, TEXTOS.paginaNoEncontrada],
])('%s', (_nombre, Pagina, titulo) => {
  it('muestra el título y un enlace de regreso con el estilo de enlace del sistema (no el del navegador)', () => {
    renderEnRuta(<Pagina />, { ruta: '/x' })
    expect(screen.getByRole('heading', { name: titulo })).toBeInTheDocument()
    const enlace = screen.getByRole('link', { name: TEXTOS.volverAlInicio })
    expect(enlace).toHaveAttribute('href', '/')
    expect(enlace.className).toMatch(/volver/) // clase del módulo CSS (el nombre lleva un sufijo)
  })
})
