// Contraste WCAG medido (no declarado): la razón de luminancia de los pares de color de frontend/src/styles/tokens.css
// y de los pares texto/fondo que de verdad escriben las hojas de estilo (CSS Modules y global.css).
// Umbrales: texto 4.5:1 (AA), componentes de interfaz y foco 3:1 (WCAG 1.4.11).
// Uso: node contraste.mjs            (imprime el informe)
import { readdirSync, readFileSync } from 'node:fs'
import { dirname, join, relative, resolve } from 'node:path'
import { fileURLToPath } from 'node:url'

const RAIZ = resolve(dirname(fileURLToPath(import.meta.url)), '../..')
const SRC = join(RAIZ, 'frontend', 'src')
export const UMBRAL_TEXTO = 4.5
export const UMBRAL_COMPONENTE = 3

// ---------------------------------------------------------------- Color
const hexARgb = (hex) => {
  const h = hex.replace('#', '')
  const completo = h.length === 3 ? [...h].map((c) => c + c).join('') : h
  return [0, 2, 4].map((i) => parseInt(completo.slice(i, i + 2), 16))
}
const luminancia = (hex) => {
  const [r, g, b] = hexARgb(hex).map((c) => {
    const v = c / 255
    return v <= 0.03928 ? v / 12.92 : ((v + 0.055) / 1.055) ** 2.4
  })
  return 0.2126 * r + 0.7152 * g + 0.0722 * b
}
export function razon(a, b) {
  const [claro, oscuro] = [luminancia(a), luminancia(b)].sort((x, y) => y - x)
  return (claro + 0.05) / (oscuro + 0.05)
}

// ---------------------------------------------------------------- Tokens
export function leerTokens() {
  const texto = readFileSync(join(SRC, 'styles', 'tokens.css'), 'utf8')
  const tokens = {}
  for (const [, nombre, valor] of texto.matchAll(/(--[\w-]+)\s*:\s*(#[0-9a-fA-F]{3,6})\s*;/g)) tokens[nombre] = valor.toLowerCase()
  return tokens
}

function resolverColor(valor, tokens) {
  const v = valor.trim()
  const variable = v.match(/^var\((--[\w-]+)\)$/)
  if (variable) return tokens[variable[1]] ?? null
  return /^#[0-9a-fA-F]{3,6}$/.test(v) ? v.toLowerCase() : null
}

// Varios tokens pueden valer lo mismo (#ffffff es la superficie y el foco sobre oscuro): se prefiere el nombre de uso general.
const nombreDe = (hex, tokens) => {
  const iguales = Object.entries(tokens).filter(([, valor]) => valor === hex).map(([nombre]) => nombre)
  return iguales.find((n) => !/foco-sobre-oscuro|celeste/.test(n)) ?? iguales[0] ?? hex
}

// ---------------------------------------------------------------- Pares que escriben las hojas de estilo
function archivosCss(carpeta) {
  return readdirSync(carpeta, { withFileTypes: true }).flatMap((e) => {
    const ruta = join(carpeta, e.name)
    if (e.isDirectory()) return archivosCss(ruta)
    return e.name.endsWith('.css') && e.name !== 'tokens.css' ? [ruta] : []
  })
}

export function paresDeLasHojas(tokens) {
  const pares = []
  for (const archivo of archivosCss(SRC)) {
    const css = readFileSync(archivo, 'utf8').replace(/\/\*[\s\S]*?\*\//g, '')
    for (const [, selector, cuerpo] of css.matchAll(/([^{}]+)\{([^{}]*)\}/g)) {
      const declaraciones = Object.fromEntries(
        [...cuerpo.matchAll(/([\w-]+)\s*:\s*([^;]+);?/g)].map(([, p, v]) => [p, v]),
      )
      const color = declaraciones.color && resolverColor(declaraciones.color, tokens)
      const fondo = resolverColor(declaraciones.background ?? declaraciones['background-color'] ?? '', tokens)
      const borde = declaraciones['border-color'] && resolverColor(declaraciones['border-color'], tokens)
      const donde = `${relative(SRC, archivo).split('\\').join('/')} ${selector.trim().replace(/\s+/g, ' ')}`
      if (color && fondo) pares.push({ tipo: 'texto', primero: color, segundo: fondo, donde })
      else if (color) pares.push({ tipo: 'texto-sin-fondo-propio', primero: color, donde })
      if (borde && fondo) pares.push({ tipo: 'borde', primero: borde, segundo: fondo, donde })
    }
  }
  return pares
}

// ---------------------------------------------------------------- Informe
export function analizarContraste() {
  const tokens = leerTokens()
  const lineas = []
  const fallos = []
  const nombre = (hex) => `${nombreDe(hex, tokens)} ${hex}`
  const fila = (etiqueta, a, b, umbral, extra = '') => {
    const r = razon(a, b)
    const bien = r >= umbral
    // Los controles deshabilitados están exentos de WCAG 1.4.3 (decisión registrada en la bitácora): se miden y se marcan EXENTO.
    const exento = !bien && a === tokens['--color-deshabilitado'] && umbral === UMBRAL_TEXTO
    const marca = bien ? 'OK   ' : exento ? 'EXENTO' : 'FALLA'
    const linea = `${marca} ${r.toFixed(2).padStart(5)}:1 (mín. ${umbral}:1)  ${etiqueta}: ${nombre(a)} sobre ${nombre(b)}${extra}`
    lineas.push(linea)
    if (!bien && !exento) fallos.push(linea)
  }

  lineas.push('A) ESTADOS (texto en el color de estado sobre su fondo, como en AlertMessage e Insignia) — mínimo 4.5:1')
  for (const estado of ['error', 'exito', 'aviso', 'info']) {
    fila(`estado ${estado}`, tokens[`--color-${estado}`], tokens[`--fondo-${estado}`], UMBRAL_TEXTO)
  }
  fila('estado neutro', tokens['--color-neutro'], tokens['--fondo-neutro'], UMBRAL_TEXTO)
  fila('estado deshabilitado (WCAG exime a los controles deshabilitados; se mide igual)', tokens['--color-deshabilitado'], tokens['--fondo-deshabilitado'], UMBRAL_TEXTO)
  for (const estado of ['error', 'exito', 'aviso', 'info']) {
    fila(`estado ${estado} sobre la superficie blanca`, tokens[`--color-${estado}`], tokens['--color-superficie'], UMBRAL_TEXTO)
  }

  lineas.push('', 'B) FOCO Y BORDES (componentes de interfaz) — mínimo 3:1')
  for (const fondo of ['--color-superficie', '--color-fondo']) {
    fila('anillo de foco (--color-foco #1E73BE)', tokens['--color-foco'], tokens[fondo], UMBRAL_COMPONENTE)
  }
  fila('anillo de foco sobre el menú marino (--color-foco-sobre-oscuro)', tokens['--color-foco-sobre-oscuro'], tokens['--color-marino'], UMBRAL_COMPONENTE)
  lineas.push(`INFO  ${razon(tokens['--color-celeste'], tokens['--color-fondo']).toFixed(2).padStart(5)}:1 el celeste #3696EA (--color-celeste) sobre el fondo gris: por eso ya no es el anillo de foco, queda solo decorativo`)
  fila('límite de los campos y del botón secundario (--color-borde-control)', tokens['--color-borde-control'], tokens['--color-superficie'], UMBRAL_COMPONENTE, '  [WCAG 1.4.11: el límite del campo debe distinguirse]')
  fila('límite de los campos (--color-borde-control) sobre el fondo de la página', tokens['--color-borde-control'], tokens['--color-fondo'], UMBRAL_COMPONENTE)
  lineas.push(`INFO  ${razon(tokens['--color-borde'], tokens['--color-superficie']).toFixed(2).padStart(5)}:1 divisores y bordes de tarjeta (--color-borde ${tokens['--color-borde']}): decorativos, WCAG 1.4.11 no les exige contraste`)

  lineas.push('', 'C) MATRIZ COMPLETA: cada color de texto de tokens.css sobre cada fondo de tokens.css (4.5:1)')
  const textos = ['--color-texto', '--color-texto-suave', '--color-marino', '--color-primario', '--color-titulo', '--color-error', '--color-exito', '--color-aviso', '--color-info', '--color-neutro', '--color-deshabilitado', '--color-sobre-oscuro', '--color-dorado']
  const fondos = ['--color-superficie', '--color-fondo', '--fondo-error', '--fondo-exito', '--fondo-aviso', '--fondo-info', '--fondo-neutro', '--fondo-deshabilitado', '--color-primario', '--color-marino', '--color-error']
  const matriz = []
  for (const t of textos) {
    for (const f of fondos) {
      if (t === f) continue
      matriz.push({ t, f, r: razon(tokens[t], tokens[f]) })
    }
  }
  lineas.push(`   ${matriz.length} pares; ${matriz.filter((p) => p.r >= UMBRAL_TEXTO).length} llegan a 4.5:1 y ${matriz.filter((p) => p.r < UMBRAL_TEXTO).length} no (los que no llegan solo importan si la interfaz los usa: ver D).`)
  const encabezado = ['texto \\ fondo', ...fondos.map((f) => f.replace('--', ''))]
  lineas.push('   ' + encabezado.join(' | '))
  for (const t of textos) {
    lineas.push('   ' + [t.replace('--', ''), ...fondos.map((f) => (t === f ? '—' : `${razon(tokens[t], tokens[f]).toFixed(1)}${razon(tokens[t], tokens[f]) >= UMBRAL_TEXTO ? '' : '✗'}`))].join(' | '))
  }

  lineas.push('', 'D) PARES REALES: color y fondo declarados en la misma regla de las hojas de estilo')
  const reales = paresDeLasHojas(tokens)
  const vistos = new Set()
  for (const par of reales.filter((p) => p.tipo === 'texto')) {
    const clave = `${par.primero}/${par.segundo}`
    const repetido = vistos.has(clave)
    vistos.add(clave)
    if (!repetido) fila('texto', par.primero, par.segundo, UMBRAL_TEXTO, `  [${par.donde}]`)
    else if (razon(par.primero, par.segundo) < UMBRAL_TEXTO) lineas.push(`      (también en ${par.donde})`)
  }
  lineas.push('', 'E) TEXTO SIN FONDO PROPIO: se mide contra la superficie blanca y el fondo de la página (el texto blanco, contra el menú marino y el azul primario)')
  const sinFondo = new Map()
  for (const par of reales.filter((p) => p.tipo === 'texto-sin-fondo-propio')) {
    sinFondo.set(par.primero, [...(sinFondo.get(par.primero) ?? []), par.donde])
  }
  for (const [color, donde] of sinFondo) {
    // El texto blanco sin fondo propio vive sobre el menú lateral (marino) o un botón relleno: no sobre blanco.
    const fondosPosibles = color === '#ffffff' ? ['--color-marino', '--color-primario'] : ['--color-superficie', '--color-fondo']
    for (const f of fondosPosibles) fila('texto', color, tokens[f], UMBRAL_TEXTO, `  [${donde.length} regla(s), p. ej. ${donde[0]}]`)
  }
  lineas.push('', 'F) BORDES DE CONTROLES declarados junto a su fondo — mínimo 3:1')
  const bordes = new Set()
  for (const par of reales.filter((p) => p.tipo === 'borde')) {
    const clave = `${par.primero}/${par.segundo}`
    if (bordes.has(clave)) continue
    bordes.add(clave)
    fila('borde', par.primero, par.segundo, UMBRAL_COMPONENTE, `  [${par.donde}]`)
  }
  return { lineas, fallos, tokens }
}

if (process.argv[1] && resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
  const { lineas, fallos } = analizarContraste()
  console.log(lineas.join('\n'))
  console.log(`\nRESUMEN: ${fallos.length} par(es) por debajo del umbral.`)
}
