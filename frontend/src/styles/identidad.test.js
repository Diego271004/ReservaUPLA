import { readdirSync, readFileSync } from 'node:fs'
import { join, relative, resolve } from 'node:path'
import { describe, expect, it } from 'vitest'

// Contrato de la identidad visual (docs/diseno/identidad-visual.md). Vitest corre con `css: false`, así que se leen los .css.
// El aspecto real (foto, fuentes, contraste sobre la foto) lo mide tools/usabilidad/accesibilidad.mjs con ETAPA=identidad.
const SRC = resolve(__dirname, '..')
const sinComentarios = (texto) => texto.replace(/\/\*[\s\S]*?\*\//g, '')
const leer = (ruta) => sinComentarios(readFileSync(join(SRC, ruta), 'utf8'))

function archivos(carpeta, extension) {
  return readdirSync(carpeta, { withFileTypes: true }).flatMap((entrada) => {
    const ruta = join(carpeta, entrada.name)
    if (entrada.isDirectory()) return entrada.name === 'assets' ? [] : archivos(ruta, extension)
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

describe('formas: tarjetas con radio de 12 px y elevación suave; degradados solo en tokens', () => {
  it.each(TODOS_LOS_CSS)('%s no usa degradados', (ruta) => {
    expect(leer(ruta)).not.toMatch(/gradient\(/)
  })

  // Dos niveles de elevación, siempre a través de su token (ninguna hoja escribe su propia sombra): `flotante` para avisos y menús
  // desplegables (1 a 2 px) y `tarjeta` para las superficies (dos capas muy suaves).
  it.each(TODOS_LOS_CSS)('%s solo usa box-shadow con los tokens de elevación', (ruta) => {
    const sombras = [...leer(ruta).matchAll(/box-shadow:\s*([^;]+);/g)].map((m) => m[1].trim())
    for (const sombra of sombras)
      expect(['var(--elevacion-flotante)', 'var(--elevacion-tarjeta)']).toContain(sombra)
  })

  it('la elevación de tarjeta son dos capas suaves: de 12 px de desenfoque como máximo y opacidad de 10 % o menos', () => {
    const capas = token('--elevacion-tarjeta').split(/,\s*(?=\d)/)
    expect(capas).toHaveLength(2)
    for (const capa of capas) {
      const medidas = [...capa.matchAll(/(\d+)px/g)].map((m) => Number(m[1]))
      for (const medida of medidas) expect(medida).toBeLessThanOrEqual(12)
      expect(Number(capa.match(/\/ (\d+)%/)[1])).toBeLessThanOrEqual(10)
    }
  })

  it('la elevación sutil no pasa de 2 px de desplazamiento ni de desenfoque', () => {
    const medidas = [...token('--elevacion-flotante').matchAll(/(\d+)px/g)].map((m) => Number(m[1]))
    expect(medidas.length).toBeGreaterThan(0)
    for (const medida of medidas) expect(medida).toBeLessThanOrEqual(2)
  })

  it('el radio de tarjeta va de 10 a 14 px', () => {
    expect(pixeles(token('--radio-tarjeta'))).toBeGreaterThanOrEqual(10)
    expect(pixeles(token('--radio-tarjeta'))).toBeLessThanOrEqual(14)
  })

  it('los radios de control (botones, campos, insignias) van de 4 a 6 px', () => {
    for (const nombre of ['--radio', '--radio-pequeno']) {
      expect(token(nombre), `falta ${nombre}`).toBeDefined()
      expect(pixeles(token(nombre))).toBeGreaterThanOrEqual(4)
      expect(pixeles(token(nombre))).toBeLessThanOrEqual(6)
    }
  })

  it.each(MODULOS)('%s solo usa radios de los tokens (o 0)', (ruta) => {
    const radios = [...leer(ruta).matchAll(/border-radius:\s*([^;]+);/g)].map((m) => m[1].trim())
    for (const radio of radios)
      expect(radio).toMatch(/^(0|var\(--radio(-pequeno|-completo|-tarjeta)?\))$/)
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
  it('el dorado se usa únicamente en bordes (franja del login, línea bajo el nombre en el menú de usuario, filete del resumen y marca del ítem activo del menú), nunca como color de texto ni de fondo', () => {
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
      'components/Layout/MenuDeUsuario.module.css',
      'components/ResumenDeSolicitud/ResumenDeSolicitud.module.css',
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

  it('la foto no se estira más de 1,5 veces (alto máximo de 768 px = 1,5 × 512) y se ancla abajo; sus capas vienen de los tokens', () => {
    expect(pixeles(token('--alto-foto-maximo'))).toBeLessThanOrEqual(768)
    expect(login).toMatch(/height:\s*min\(100%,\s*var\(--alto-foto-maximo\)\)/)
    expect(login).toMatch(/background-size:\s*cover/)
    expect(login).toMatch(
      /background:\s*var\(--degradado-superior-foto\),\s*var\(--degradado-lateral-foto\)/,
    )
    expect(antesDelMovil).toMatch(/background:\s*var\(--color-marino\)/)
  })

  // El degradado lateral es del marino #1F365C y oscurece la zona del texto (primer 42 % del panel) con 72 % o más. Se comprueba el
  // peor caso: la foto blanca pura bajo esa capa; el texto blanco debe seguir a 4,5:1 o más (WCAG 1.4.3).
  const luminancia = (canales) => {
    const [r, g, b] = canales.map((c) => {
      const x = c / 255
      return x <= 0.03928 ? x / 12.92 : ((x + 0.055) / 1.055) ** 2.4
    })
    return 0.2126 * r + 0.7152 * g + 0.0722 * b
  }

  it('el degradado lateral deja el texto blanco a 4,5:1 o más sobre la foto más clara posible en la zona del texto', () => {
    const lateral = token('--degradado-lateral-foto').replace(/\s+/g, ' ')
    const paradas = [...lateral.matchAll(/rgb\(31 54 92 \/ (\d+)%\) (\d+)%/g)].map((m) => ({
      opacidad: Number(m[1]) / 100,
      posicion: Number(m[2]),
    }))
    expect(paradas.length).toBeGreaterThanOrEqual(3)
    const zonaDelTexto = paradas.filter((parada) => parada.posicion <= 42)
    expect(zonaDelTexto.length).toBeGreaterThanOrEqual(2)
    for (const { opacidad } of zonaDelTexto) {
      expect(opacidad).toBeGreaterThanOrEqual(0.72)
      const mezcla = [31, 54, 92].map((c) => c * opacidad + 255 * (1 - opacidad))
      const contraste = 1.05 / (luminancia(mezcla) + 0.05)
      expect(contraste).toBeGreaterThanOrEqual(4.5)
    }
  })

  it('el degradado va de más oscuro a más claro hacia la derecha y la foto se ve al final', () => {
    const lateral = token('--degradado-lateral-foto').replace(/\s+/g, ' ')
    const opacidades = [...lateral.matchAll(/rgb\(31 54 92 \/ (\d+)%\)/g)].map((m) => Number(m[1]))
    expect(opacidades).toEqual([...opacidades].sort((a, b) => b - a))
    expect(opacidades.at(-1)).toBe(0)
  })

  it('solo los tokens declaran degradados (tres) y solo el login y la portada del Inicio los usan', () => {
    expect(leer('styles/tokens.css').match(/linear-gradient\(/g)).toHaveLength(3)
    const usan = TODOS_LOS_CSS.filter((ruta) => /var\(--degradado-/.test(leer(ruta)))
    expect(usan).toEqual([
      'components/InicioAdmin/Portada.module.css',
      'pages/LoginPage.module.css',
    ])
  })

  it('la portada del Inicio deja el texto blanco a 4,5:1 o más sobre cada color de su degradado', () => {
    const colores = [...token('--degradado-portada').matchAll(/#([0-9a-f]{6})/gi)].map((m) => m[1])
    expect(colores.length).toBeGreaterThanOrEqual(3)
    for (const hex of colores) {
      const canales = [0, 2, 4].map((i) => Number.parseInt(hex.slice(i, i + 2), 16))
      expect(1.05 / (luminancia(canales) + 0.05), `#${hex}`).toBeGreaterThanOrEqual(4.5)
    }
  })

  it('el formulario del login usa controles de 48 px y el fondo gris azulado de la tarjeta', () => {
    expect(pixeles(token('--alto-control-login'))).toBe(48)
    expect(token('--fondo-login').toLowerCase()).toBe('#f4f6fa')
    expect(login).toMatch(/--alto-control:\s*var\(--alto-control-login\)/)
    expect(login).toMatch(/background:\s*var\(--fondo-login\)/)
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
    expect(readFileSync(join(SRC, 'components/Layout/MenuLateral.jsx'), 'utf8')).toMatch(
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
