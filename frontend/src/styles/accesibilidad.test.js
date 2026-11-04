import { readFileSync } from 'node:fs'
import { join, resolve } from 'node:path'
import { describe, expect, it } from 'vitest'

// Contrato de los estilos: Vitest corre con `css: false`, así que estas pruebas leen los archivos .css. Cada una cubre un
// defecto medido en el sistema real (docs/evidencias/fase8-accesibilidad-antes.txt); el navegador real lo comprueba
// tools/usabilidad/accesibilidad.mjs.
const SRC = resolve(__dirname, '..')
const css = (ruta) => readFileSync(join(SRC, ruta), 'utf8').replace(/\/\*[\s\S]*?\*\//g, '')
const escapar = (texto) => texto.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')

/** Declaraciones de la primera regla `selector { … }` (o de la que sigue a `desde`, para reglas dentro de @media). */
function regla(texto, selector, desde = '') {
  const inicio = desde ? texto.indexOf(desde) : 0
  expect(inicio, `no existe ${desde}`).toBeGreaterThanOrEqual(0)
  const resto = texto.slice(inicio)
  const m = resto.match(new RegExp(`(?:^|[}\\s,])${escapar(selector)}\\s*(?:,[^{]*)?\\{([^}]*)\\}`))
  expect(m, `no existe la regla ${selector}`).not.toBeNull()
  return m[1].replace(/\s+/g, ' ').trim()
}

// ---------------------------------------------------------------- Contraste (WCAG 1.4.3 y 1.4.11)
const tokens = Object.fromEntries(
  [...css('styles/tokens.css').matchAll(/(--[\w-]+)\s*:\s*(#[0-9a-fA-F]{6})\s*;/g)].map(
    ([, nombre, hex]) => [nombre, hex],
  ),
)
const luminancia = (hex) => {
  const [r, g, b] = [1, 3, 5].map((i) => {
    const v = parseInt(hex.slice(i, i + 2), 16) / 255
    return v <= 0.03928 ? v / 12.92 : ((v + 0.055) / 1.055) ** 2.4
  })
  return 0.2126 * r + 0.7152 * g + 0.0722 * b
}
const razon = (a, b) => {
  const [claro, oscuro] = [luminancia(a), luminancia(b)].sort((x, y) => y - x)
  return (claro + 0.05) / (oscuro + 0.05)
}

describe('contraste de los tokens', () => {
  it.each(['error', 'exito', 'aviso', 'info'])(
    'el texto de estado %s llega a 4.5:1 sobre su fondo',
    (estado) => {
      expect(
        razon(tokens[`--color-${estado}`], tokens[`--fondo-${estado}`]),
      ).toBeGreaterThanOrEqual(4.5)
    },
  )

  it('el límite de los campos (--color-borde-control) llega a 3:1 sobre la tarjeta blanca y sobre el fondo de la página', () => {
    expect(tokens['--color-borde-control'], 'falta el token --color-borde-control').toBeDefined()
    expect(
      razon(tokens['--color-borde-control'], tokens['--color-superficie']),
    ).toBeGreaterThanOrEqual(3)
    expect(razon(tokens['--color-borde-control'], tokens['--color-fondo'])).toBeGreaterThanOrEqual(
      3,
    )
  })

  it('el anillo de foco llega a 3:1 sobre la tarjeta blanca y sobre el fondo gris de la página', () => {
    expect(razon(tokens['--color-foco'], tokens['--color-superficie'])).toBeGreaterThanOrEqual(3)
    expect(razon(tokens['--color-foco'], tokens['--color-fondo'])).toBeGreaterThanOrEqual(3)
  })

  it('el anillo de foco es #1E73BE (el celeste #3696EA queda solo decorativo, no llega a 3:1 sobre el gris)', () => {
    expect(tokens['--color-foco'].toLowerCase()).toBe('#1e73be')
    expect(razon('#3696ea', tokens['--color-fondo'])).toBeLessThan(3)
  })

  it('sobre el menú marino el foco usa el anillo claro (3:1), porque #1E73BE no basta sobre fondo oscuro', () => {
    expect(
      razon(tokens['--color-foco-sobre-oscuro'], tokens['--color-marino']),
    ).toBeGreaterThanOrEqual(3)
    expect(regla(css('components/Layout/Layout.module.css'), '.menu :focus-visible')).toContain(
      'outline-color: var(--color-foco-sobre-oscuro)',
    )
  })

  it('los campos y el botón secundario dibujan su límite con el token de 3:1', () => {
    expect(regla(css('components/ui/CampoFormulario.module.css'), '.caja')).toContain(
      'border: 1px solid var(--color-borde-control)',
    )
    expect(regla(css('components/ui/Button.module.css'), '.secundario')).toContain(
      'border-color: var(--color-borde-control)',
    )
  })
})

// ---------------------------------------------------------------- Movimiento reducido (WCAG 2.3.3)
describe('prefers-reduced-motion', () => {
  it('apaga las animaciones (también las infinitas, como el spinner) en lugar de acelerarlas', () => {
    const reducido = regla(css('styles/global.css'), '*', '@media (prefers-reduced-motion: reduce)')
    expect(reducido).toContain('animation: none !important')
    expect(reducido).toContain('transition: none !important')
  })
})

// ---------------------------------------------------------------- Reflujo (WCAG 1.4.10): sin scroll horizontal a 320 px
describe('reflujo en pantallas angostas', () => {
  it('la columna del login no crece más que la pantalla', () => {
    expect(
      regla(css('pages/LoginPage.module.css'), '.pagina', '@media (max-width: 767px)'),
    ).toContain('grid-template-columns: minmax(0, 1fr)')
  })

  it('el encabezado del menú se ajusta en lugar de empujar el botón fuera de la pantalla', () => {
    expect(regla(css('components/Layout/Layout.module.css'), '.cabecera')).toContain(
      'flex-wrap: wrap',
    )
  })

  it('los títulos parten palabras largas en lugar de desbordar', () => {
    expect(regla(css('styles/global.css'), 'h1')).toContain('overflow-wrap: anywhere')
  })
})

// ---------------------------------------------------------------- Objetivos táctiles (regla del proyecto: 44 px)
describe('objetivos táctiles de 44 px', () => {
  it('el control interior de un campo llena la caja de 44 px (no deja 1 px muerto en el borde)', () => {
    const control = regla(css('components/ui/CampoFormulario.module.css'), '.control')
    expect(control).toContain('min-height: var(--alto-control)')
    expect(control).toContain('margin: -1px')
  })

  it('"Mostrar / Ocultar contraseña" mide 44 px de alto', () => {
    expect(regla(css('components/ui/PasswordInput.module.css'), '.alternar')).toContain(
      'min-height: var(--alto-control)',
    )
  })

  it('el interruptor Activo tiene un área táctil de 44 px', () => {
    expect(regla(css('components/ui/InterruptorActivo.module.css'), '.interruptor')).toContain(
      'height: var(--alto-control)',
    )
  })

  it('los enlaces de las páginas de error miden 44 px de alto', () => {
    expect(regla(css('pages/ErrorRutaPage.module.css'), '.volver')).toContain(
      'min-height: var(--alto-control)',
    )
  })
})

// ---------------------------------------------------------------- Separación de los botones del cierre de una reserva
describe('cierre de Nueva reserva', () => {
  it('los botones no quedan pegados', () => {
    expect(regla(css('pages/NuevaReservaPage.module.css'), '.acciones')).toContain(
      'gap: var(--espacio-1)',
    )
  })
})

// ---------------------------------------------------------------- Listados en móvil
describe('listados en móvil', () => {
  it('cada registro se separa del siguiente con una banda visible, no con una línea de 1 px', () => {
    expect(css('components/ui/TableList.module.css')).toMatch(
      /\.tabla tr \{[^}]*border-bottom: 8px solid var\(--color-fondo\)/,
    )
  })

  it('el botón del encabezado de un listado puede partir su texto en lugar de salirse de la pantalla', () => {
    expect(css('pages/ListadoPage.module.css')).not.toMatch(/white-space:\s*nowrap/)
  })

  it('el interruptor Activo pasa su texto a otra línea cuando no cabe', () => {
    expect(regla(css('components/ui/InterruptorActivo.module.css'), '.grupo')).toContain(
      'flex-wrap: wrap',
    )
  })
})

// ---------------------------------------------------------------- Pantallas de la Fase 9 (defectos vistos en las capturas reales)
describe('Dashboard, Reservas y Mi ambiente', () => {
  it('un valor de texto de una tarjeta (el nombre de un ambiente) es más chico que un número y parte las palabras largas', () => {
    const regla1 = regla(css('components/ui/CardIndicador.module.css'), '.valorTexto')
    expect(regla1).toContain('font-size: 1.25rem')
    expect(regla1).toContain('overflow-wrap: anywhere')
  })

  it('los tres botones de cada fila del Dashboard no se parten en dos líneas en escritorio', () => {
    expect(regla(css('pages/DashboardPage.module.css'), '.acciones')).toContain('flex-wrap: nowrap')
  })

  it('el pie «Mostrando N de N» tiene margen por todos lados', () => {
    expect(regla(css('components/PieDeLista/PieDeLista.module.css'), '.resumen')).toMatch(
      /padding: var\(--espacio-2\)(;|$)/,
    )
  })

  it('el botón «Filtros» solo se ve en móvil y el panel plegado solo se oculta en móvil (en escritorio los filtros siempre están a la vista)', () => {
    const filtros = css('components/FiltrosDeReservas/FiltrosDeReservas.module.css')
    expect(regla(filtros, '.alternar')).toContain('display: none')
    expect(regla(filtros, '.alternar', '@media (max-width: 767px)')).toContain('display: block')
    expect(regla(filtros, '.cerrado', '@media (max-width: 767px)')).toContain('display: none')
    expect(filtros.slice(0, filtros.indexOf('@media'))).not.toMatch(/\.cerrado/)
  })

  it('«Ver detalle», «Rechazar» y «Aprobar» del Dashboard no parten su texto', () => {
    expect(regla(css('pages/DashboardPage.module.css'), '.acciones > *')).toContain(
      'white-space: nowrap',
    )
  })
})
