import { readdirSync, readFileSync, statSync } from 'node:fs'
import { join, relative, resolve } from 'node:path'
import { describe, expect, it } from 'vitest'

// Contrato de la identidad visual (docs/diseno/identidad-visual.md). Vitest corre con `css: false`, así que se leen los .css.
// El aspecto real (foto, fuentes, contraste sobre la foto) lo mide tools/usabilidad/accesibilidad.mjs con ETAPA=identidad.
const SRC = resolve(__dirname, '..')
const sinComentarios = (texto) => texto.replace(/\/\*[\s\S]*?\*\//g, '')
const leer = (ruta) => sinComentarios(readFileSync(join(SRC, ruta), 'utf8'))

function archivos(carpeta, extension) {
  return readdirSync(carpeta).flatMap((nombre) => {
    const ruta = join(carpeta, nombre)
    if (statSync(ruta).isDirectory()) return nombre === 'assets' ? [] : archivos(ruta, extension)
    return ruta.endsWith(extension) ? [relative(SRC, ruta).replaceAll('\\', '/')] : []
  })
}
const MODULOS = archivos(SRC, '.module.css')
const TODOS_LOS_CSS = [...MODULOS, 'styles/global.css']
const token = (nombre) =>
  leer('styles/tokens.css')
    .match(new RegExp(`${nombre}\\s*:\\s*([^;]+);`))?.[1]
    .trim()
const pixeles = (texto) => Number.parseFloat(texto)

describe('formas sobrias: sin degradados ni sombras', () => {
  it.each(TODOS_LOS_CSS)('%s no usa degradados ni box-shadow', (ruta) => {
    expect(leer(ruta)).not.toMatch(/gradient\(/)
    expect(leer(ruta)).not.toMatch(/box-shadow/)
  })

  it('los radios de los tokens van de 4 a 6 px', () => {
    for (const nombre of ['--radio', '--radio-pequeno']) {
      expect(token(nombre), `falta ${nombre}`).toBeDefined()
      expect(pixeles(token(nombre))).toBeGreaterThanOrEqual(4)
      expect(pixeles(token(nombre))).toBeLessThanOrEqual(6)
    }
  })

  it.each(MODULOS)('%s solo usa radios de los tokens (o 0)', (ruta) => {
    const radios = [...leer(ruta).matchAll(/border-radius:\s*([^;]+);/g)].map((m) => m[1].trim())
    for (const radio of radios) expect(radio).toMatch(/^(0|var\(--radio(-pequeno|-completo)?\))$/)
  })

  it('el botón y las insignias usan el radio pequeño (esquinas de 4 px, no cápsulas)', () => {
    expect(leer('components/ui/Button.module.css')).toMatch(
      /\.boton\s*\{[^}]*border-radius:\s*var\(--radio-pequeno\)/,
    )
    expect(leer('components/ui/Insignia.module.css')).toMatch(
      /\.insignia\s*\{[^}]*border-radius:\s*var\(--radio-pequeno\)/,
    )
  })

  it.each([
    'components/FormularioTarjeta/FormularioTarjeta.module.css',
    'components/ui/ModalConfirmacion.module.css',
  ])('%s separa con un borde de 1 px, no con sombra', (ruta) => {
    expect(leer(ruta)).toMatch(/border:\s*1px solid var\(--color-borde\)/)
  })
})

describe('ningún color suelto fuera de tokens.css', () => {
  it.each(TODOS_LOS_CSS)('%s no escribe colores literales', (ruta) => {
    expect(leer(ruta)).not.toMatch(/#[0-9a-fA-F]{3,8}\b|rgba?\(/)
  })
})

describe('tablas: encabezado marino claro y filas con separadores finos', () => {
  it('el encabezado usa el fondo del token y las filas se separan con el borde de 1 px', () => {
    const tabla = leer('components/ui/TableList.module.css')
    expect(token('--fondo-encabezado-tabla'), 'falta el token').toBeDefined()
    expect(tabla).toMatch(/\.tabla th\s*\{[^}]*background:\s*var\(--fondo-encabezado-tabla\)/)
    expect(tabla).toMatch(/\.tabla td\s*\{[^}]*border-bottom:\s*1px solid var\(--color-borde\)/)
  })
})

describe('acento dorado: solo detalle', () => {
  it('el dorado se usa únicamente en bordes (franja del login y línea del menú), nunca como color de texto ni de fondo', () => {
    const usos = TODOS_LOS_CSS.flatMap((ruta) =>
      [...leer(ruta).matchAll(/([\w-]+)\s*:\s*[^;]*var\(--color-dorado\)[^;]*;/g)].map((m) => [
        ruta,
        m[1],
      ]),
    )
    expect(usos.length).toBeGreaterThanOrEqual(2)
    for (const [ruta, propiedad] of usos) expect(propiedad, ruta).toMatch(/^border/)
    expect([...new Set(usos.map(([ruta]) => ruta))].sort()).toEqual([
      'components/Layout/Layout.module.css',
      'pages/LoginPage.module.css',
    ])
  })
})

describe('tipografía: Poppins para títulos y Montserrat para el texto, autoalojadas', () => {
  it('los tokens de fuente y los títulos', () => {
    expect(token('--fuente-base')).toMatch(/^'Montserrat'/)
    expect(token('--fuente-titulo')).toMatch(/^'Poppins'/)
    const global = leer('styles/global.css')
    expect(global).toMatch(/h1,\s*h2,\s*h3\s*\{[^}]*font-family:\s*var\(--fuente-titulo\)/)
    expect(global).toMatch(/h1,\s*h2,\s*h3\s*\{[^}]*font-weight:\s*600/)
  })

  it('las fuentes se cargan desde @fontsource (solo latin y solo los pesos que se usan) y no desde un CDN', () => {
    const principal = readFileSync(join(SRC, 'main.jsx'), 'utf8')
    const importadas = [...principal.matchAll(/import '(@fontsource\/[^']+)'/g)]
      .map((m) => m[1])
      .sort()
    expect(importadas).toEqual([
      '@fontsource/montserrat/latin-400.css',
      '@fontsource/montserrat/latin-500.css',
      '@fontsource/montserrat/latin-600.css',
      '@fontsource/montserrat/latin-700.css',
      '@fontsource/poppins/latin-600.css',
    ])
    const html = readFileSync(join(SRC, '..', 'index.html'), 'utf8')
    expect(html).not.toMatch(/googleapis|gstatic/)
  })

  it('cada peso de Montserrat que escriben los estilos está cargado', () => {
    const usados = new Set(
      TODOS_LOS_CSS.flatMap((r) => [...leer(r).matchAll(/font-weight:\s*(\d+)/g)].map((m) => m[1])),
    )
    for (const peso of usados) expect(['400', '500', '600', '700']).toContain(peso)
  })
})

describe('login: la foto es decorativa y solo se pide en pantallas anchas', () => {
  const login = leer('pages/LoginPage.module.css')
  const antesDelMovil = login.slice(0, login.indexOf('@media (max-width: 767px)'))

  it('la foto del campus se declara dentro de un @media (min-width: 768px), no en las reglas base ni en móvil', () => {
    expect(login).toMatch(/@media \(min-width: 768px\)[\s\S]*campus-upla\.webp/)
    const fuera = login.replace(/@media \(min-width: 768px\)\s*\{[\s\S]*\n\}\n?/, '')
    expect(fuera).not.toMatch(/url\(/)
  })

  it('la foto no se estira más de 1,5 veces (alto máximo de 768 px = 1,5 × 512) y se ancla abajo; la capa es plana', () => {
    expect(pixeles(token('--alto-foto-maximo'))).toBeLessThanOrEqual(768)
    expect(login).toMatch(/height:\s*min\(100%,\s*var\(--alto-foto-maximo\)\)/)
    expect(login).toMatch(/background-size:\s*cover/)
    expect(login).toMatch(/background:\s*var\(--capa-foto\)/)
    expect(antesDelMovil).toMatch(/background:\s*var\(--color-marino\)/)
  })

  it('la capa sobre la foto es del marino con la opacidad del token (al menos 70 %)', () => {
    const capa = token('--capa-foto')
    expect(capa).toMatch(/^rgb\(31 54 92 \/ \d+%\)$/)
    expect(Number.parseInt(capa.match(/(\d+)%/)[1], 10)).toBeGreaterThanOrEqual(70)
  })

  it('la franja dorada va entre el panel y el formulario', () => {
    expect(login).toMatch(
      /\.panel\s*\{[^}]*border-right:\s*var\(--ancho-franja-dorada\) solid var\(--color-dorado\)/,
    )
  })
})

describe('logo: versiones optimizadas, nunca el original de 1724 x 2000', () => {
  it('ningún componente importa el original', () => {
    const fuentes = archivos(SRC, '.jsx').filter((r) => !r.endsWith('.test.jsx'))
    for (const ruta of fuentes)
      expect(readFileSync(join(SRC, ruta), 'utf8'), ruta).not.toMatch(/logo-upla\.webp/)
  })

  it('el menú y el login usan su propia versión y el recuadro blanco tiene esquinas pequeñas', () => {
    expect(readFileSync(join(SRC, 'components/Layout/Layout.jsx'), 'utf8')).toMatch(
      /logo-upla-menu\.webp/,
    )
    expect(readFileSync(join(SRC, 'pages/LoginPage.jsx'), 'utf8')).toMatch(/logo-upla-login\.webp/)
    for (const ruta of ['components/Layout/Layout.module.css', 'pages/LoginPage.module.css']) {
      expect(leer(ruta)).toMatch(
        /\.logo\s*\{[^}]*background:\s*var\(--color-superficie\)[^}]*border-radius:\s*var\(--radio-pequeno\)/,
      )
    }
  })

  it('el alto de uso está en los tokens: 40 a 56 px en el menú y 72 a 96 px en el login', () => {
    expect(pixeles(token('--alto-logo-menu'))).toBeGreaterThanOrEqual(40)
    expect(pixeles(token('--alto-logo-menu'))).toBeLessThanOrEqual(56)
    expect(pixeles(token('--alto-logo-login'))).toBeGreaterThanOrEqual(72)
    expect(pixeles(token('--alto-logo-login'))).toBeLessThanOrEqual(96)
  })
})

describe('reflujo: el logo y el nombre del menú caben a 188 px (zoom 200 % en un teléfono)', () => {
  it('el bloque del logo y el nombre puede partirse en dos líneas y encoger (flex-wrap y min-width: 0)', () => {
    const regla =
      leer('components/Layout/Layout.module.css').match(/\.identidad\s*\{([^}]*)\}/)?.[1] ?? ''
    expect(regla).toMatch(/flex-wrap:\s*wrap/)
    expect(regla).toMatch(/min-width:\s*0/)
  })
})
