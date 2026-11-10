// Ubica fragmentos en el código fuente para citar archivo:línea EXACTOS.
// Si un ancla no existe, la generación falla: así nunca se publica un número de línea inventado.
import { readFileSync } from 'node:fs'
import path from 'node:path'
import { fileURLToPath } from 'node:url'

export const RAIZ = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..', '..', '..')

const cache = new Map()

function leerLineas(ruta) {
  if (!cache.has(ruta)) {
    const texto = readFileSync(path.join(RAIZ, ruta), 'utf8')
    cache.set(ruta, texto.replace(/\r\n/g, '\n').split('\n'))
  }
  return cache.get(ruta)
}

function buscar(ruta, ancla, desde = 0) {
  const lineas = leerLineas(ruta)
  for (let i = desde; i < lineas.length; i++) {
    if (lineas[i].includes(ancla)) return i
  }
  throw new Error(`Ancla no encontrada en ${ruta}: "${ancla}"`)
}

/** Registro de todas las citas, para el reporte de verificación. */
export const citas = []

/**
 * Rango de líneas (1-based) desde la primera línea que contiene `desde` hasta la primera
 * línea posterior que contiene `hasta`. `menos`/`mas` amplían el rango (comentarios, llaves).
 */
export function rango(ruta, desde, hasta, { menos = 0, mas = 0 } = {}) {
  const ini = buscar(ruta, desde) - menos
  const fin = (hasta ? buscar(ruta, hasta, ini + menos) : ini + menos) + mas
  const lineas = leerLineas(ruta)
  if (ini < 0 || fin >= lineas.length || fin < ini) throw new Error(`Rango inválido en ${ruta}`)
  const cita = { ruta, ini: ini + 1, fin: fin + 1 }
  citas.push({ ...cita, primera: lineas[ini].trim(), ultima: lineas[fin].trim() })
  return cita
}

/** "ruta:N" o "ruta:N–M" para columnas de evidencia. */
export function ev(ruta, desde, hasta, opciones) {
  const { ini, fin } = rango(ruta, desde, hasta, opciones)
  return ini === fin ? `${ruta}:${ini}` : `${ruta}:${ini}–${fin}`
}

/** "ruta, líneas N–M" para los recuadros de captura de código. */
export function lineasDe(ruta, desde, hasta, opciones) {
  const { ini, fin } = rango(ruta, desde, hasta, opciones)
  return ini === fin ? `${ruta}, línea ${ini}` : `${ruta}, líneas ${ini}–${fin}`
}

/** Ruta corta para Windows (barras invertidas) cuando se indica una carpeta en PowerShell. */
export const win = (ruta) => ruta.replaceAll('/', '\\')
