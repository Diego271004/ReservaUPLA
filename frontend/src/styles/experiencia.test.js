import { readFileSync } from 'node:fs'
import { join, resolve } from 'node:path'
import { describe, expect, it } from 'vitest'

// Contrato de estilos del rediseño de experiencia (Vitest corre con css: false, así que se leen los .css).
// El aspecto real lo mide tools/usabilidad/accesibilidad.mjs con ETAPA=experiencia.
const SRC = resolve(__dirname, '..')
const leer = (ruta) => readFileSync(join(SRC, ruta), 'utf8').replace(/\/\*[\s\S]*?\*\//g, '')

describe('el menú de usuario cabe en pantalla a 188 px (zoom 200 % en móvil; defecto hallado al medir)', () => {
  it('en móvil el panel se ancla a los dos lados de la barra superior y no a su botón', () => {
    const css = leer('components/Layout/MenuDeUsuario.module.css')
    const movil = css.match(/@media \(max-width: 767px\)\s*\{([\s\S]*)\}\s*$/)?.[1] ?? ''
    expect(movil).toMatch(/\.contenedor\s*\{[^}]*position:\s*static/)
    const panel = movil.match(/\.panel\s*\{([^}]*)\}/)?.[1] ?? ''
    expect(panel).toMatch(/left:\s*var\(--espacio-1\)/)
    expect(panel).toMatch(/right:\s*var\(--espacio-1\)/)
    expect(panel).toMatch(/min-width:\s*0/)
  })
})

describe('objetivos de 44 px en la barra superior (defecto hallado al medir a 375 px)', () => {
  it('los enlaces de las migas de pan miden al menos 44 px de alto', () => {
    const regla =
      leer('components/Layout/Topbar.module.css').match(/\.migas a\s*\{([^}]*)\}/)?.[1] ?? ''
    expect(regla).toMatch(/min-height:\s*var\(--alto-control\)/)
    expect(regla).toMatch(/display:\s*inline-flex/)
  })
})
