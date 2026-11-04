// Analiza los resultados de la prueba con usuarios (ISO 9241-11): eficacia, eficiencia y satisfacción (SUS).
// Lee docs/usabilidad/resultados-prueba.csv (o la ruta que se indique) y, si existe, docs/usabilidad/tiempos-referencia.csv.
//
// Uso (desde tools/usabilidad):
//   node analizar.mjs                                     → analiza docs/usabilidad/resultados-prueba.csv
//   node analizar.mjs ruta/al/archivo.csv [ruta/referencias.csv]
//
// El script NO inventa nada: con el CSV vacío (solo encabezados) lo dice y termina. Si alguna fila trae origen
// SINTETICO, el informe lo avisa en la primera línea: esos números no son resultados de personas.
import { existsSync, readFileSync } from 'node:fs'
import { dirname, resolve } from 'node:path'
import { fileURLToPath } from 'node:url'

const RAIZ = resolve(dirname(fileURLToPath(import.meta.url)), '../..')

/** Tareas que se pueden probar hoy (ver docs/usabilidad/plan-prueba-usuarios.md): camino óptimo y tiempo máximo. */
export const TAREAS = Object.freeze({
  T01: { nombre: 'Registrar una reserva', clicsOptimos: 8, tiempoMaximoS: 120 },
  T02: { nombre: 'Cancelar su solicitud', clicsOptimos: 3, tiempoMaximoS: 60 },
  T05: { nombre: 'Detectar un conflicto de horario', clicsOptimos: 0, tiempoMaximoS: 90 },
  T06: { nombre: 'Registrar un ambiente', clicsOptimos: 11, tiempoMaximoS: 180 },
  T07: { nombre: 'Registrar un usuario', clicsOptimos: 8, tiempoMaximoS: 150 },
})

export const ENCABEZADOS = [
  'origen',
  'participante',
  'tipo',
  'tarea',
  'completada',
  'tiempo_s',
  'clics',
  'errores',
  'ayuda_moderador',
  ...Array.from({ length: 10 }, (_, i) => `sus_${i + 1}`),
  'comentario',
]

// ---------------------------------------------------------------- CSV
export function leerCsv(texto) {
  const filas = []
  let campo = ''
  let fila = []
  let comillas = false
  for (let i = 0; i < texto.length; i++) {
    const c = texto[i]
    if (comillas) {
      if (c === '"' && texto[i + 1] === '"') {
        campo += '"'
        i++
      } else if (c === '"') comillas = false
      else campo += c
    } else if (c === '"') comillas = true
    else if (c === ',') {
      fila.push(campo)
      campo = ''
    } else if (c === '\n' || c === '\r') {
      if (c === '\r' && texto[i + 1] === '\n') i++
      fila.push(campo)
      campo = ''
      if (fila.some((v) => v.trim() !== '')) filas.push(fila)
      fila = []
    } else campo += c
  }
  fila.push(campo)
  if (fila.some((v) => v.trim() !== '')) filas.push(fila)
  if (filas.length === 0) return []
  const [cabecera, ...cuerpo] = filas
  return cuerpo.map((valores) => Object.fromEntries(cabecera.map((nombre, i) => [nombre.trim(), (valores[i] ?? '').trim()])))
}

// ---------------------------------------------------------------- Cálculos
const numero = (valor) => (valor === '' || valor === undefined ? null : Number(valor))
const media = (xs) => (xs.length === 0 ? null : xs.reduce((a, b) => a + b, 0) / xs.length)
const mediana = (xs) => {
  if (xs.length === 0) return null
  const orden = [...xs].sort((a, b) => a - b)
  const m = Math.floor(orden.length / 2)
  return orden.length % 2 ? orden[m] : (orden[m - 1] + orden[m]) / 2
}
const desviacion = (xs) => {
  if (xs.length < 2) return null
  const m = media(xs)
  return Math.sqrt(xs.reduce((a, x) => a + (x - m) ** 2, 0) / (xs.length - 1))
}

/** Puntaje SUS 0-100 de las 10 respuestas (1 a 5): impares (respuesta - 1), pares (5 - respuesta), suma × 2.5. */
export function puntajeSus(respuestas) {
  if (respuestas.length !== 10 || respuestas.some((r) => !Number.isInteger(r) || r < 1 || r > 5)) return null
  const suma = respuestas.reduce((total, r, i) => total + (i % 2 === 0 ? r - 1 : 5 - r), 0)
  return suma * 2.5
}

/** Eficacia = tareas completadas / tareas intentadas. */
export const eficacia = (intentos) => (intentos.length === 0 ? null : intentos.filter((i) => i.completada).length / intentos.length)

export function analizar(filas, referencias = {}) {
  const sinteticos = filas.some((f) => f.origen.toUpperCase().includes('SINTETICO'))
  const tareas = filas
    .filter((f) => f.tipo === 'tarea')
    .map((f) => ({
      participante: f.participante,
      tarea: f.tarea,
      completada: f.completada === '1',
      tiempoS: numero(f.tiempo_s),
      clics: numero(f.clics),
      errores: numero(f.errores) ?? 0,
      ayuda: f.ayuda_moderador === '1',
    }))
  const sus = filas
    .filter((f) => f.tipo === 'sus')
    .map((f) => ({ participante: f.participante, puntaje: puntajeSus(Array.from({ length: 10 }, (_, i) => numero(f[`sus_${i + 1}`]))) }))

  const porTarea = Object.keys(TAREAS)
    .map((id) => {
      const intentos = tareas.filter((t) => t.tarea === id)
      if (intentos.length === 0) return null
      const completadas = intentos.filter((t) => t.completada)
      const tiempos = completadas.map((t) => t.tiempoS).filter((x) => x !== null)
      const clics = completadas.map((t) => t.clics).filter((x) => x !== null)
      const optimos = TAREAS[id].clicsOptimos
      const referencia = referencias[id] ?? null
      return {
        id,
        nombre: TAREAS[id].nombre,
        intentadas: intentos.length,
        completadas: completadas.length,
        eficacia: eficacia(intentos),
        tiempoMedianaS: mediana(tiempos),
        tiempoMaximoS: TAREAS[id].tiempoMaximoS,
        dentroDelTiempo: completadas.filter((t) => t.tiempoS !== null && t.tiempoS <= TAREAS[id].tiempoMaximoS).length,
        clicsMedia: media(clics),
        clicsOptimos: optimos,
        // Eficiencia en clics: óptimo / real (1 = camino óptimo). Con óptimo 0 (T05) solo cuenta que no haya clics de más.
        eficienciaClics: clics.length === 0 ? null : optimos === 0 ? (clics.every((c) => c === 0) ? 1 : 0) : media(clics.map((c) => Math.min(1, optimos / Math.max(c, 1)))),
        tiempoReferenciaS: referencia,
        eficienciaTiempo: referencia && tiempos.length > 0 ? media(tiempos.map((t) => Math.min(1, referencia / t))) : null,
        errores: intentos.reduce((a, t) => a + t.errores, 0),
        conAyuda: intentos.filter((t) => t.ayuda).length,
      }
    })
    .filter(Boolean)

  const puntajes = sus.map((s) => s.puntaje).filter((p) => p !== null)
  return {
    sinteticos,
    participantes: new Set(filas.map((f) => f.participante)).size,
    intentos: tareas.length,
    eficaciaGlobal: eficacia(tareas),
    porTarea,
    sus: { respuestas: sus.length, validos: puntajes.length, media: media(puntajes), mediana: mediana(puntajes), desviacion: desviacion(puntajes), minimo: puntajes.length ? Math.min(...puntajes) : null, maximo: puntajes.length ? Math.max(...puntajes) : null },
  }
}

// ---------------------------------------------------------------- Informe
const pct = (x) => (x === null ? 'sin datos' : `${(x * 100).toFixed(0)} %`)
const dec = (x, d = 1) => (x === null ? 'sin datos' : x.toFixed(d))

export function informe(r) {
  const L = []
  if (r.sinteticos) L.push('*** DATOS SINTÉTICOS: este análisis es solo una prueba del script; NO son resultados de personas y no deben citarse. ***', '')
  L.push(`Participantes: ${r.participantes} · Intentos de tarea: ${r.intentos}`)
  L.push(`EFICACIA global (tareas completadas / intentadas): ${pct(r.eficaciaGlobal)}`, '')
  L.push('Por tarea:')
  L.push('  Tarea | Intentadas | Completadas | Eficacia | Tiempo mediana (máx.) | Clics medios (óptimo) | Efic. clics | Efic. tiempo | Errores | Con ayuda')
  for (const t of r.porTarea) {
    L.push(`  ${t.id} ${t.nombre} | ${t.intentadas} | ${t.completadas} | ${pct(t.eficacia)} | ${dec(t.tiempoMedianaS, 0)} s (${t.tiempoMaximoS} s; ${t.dentroDelTiempo} dentro) | ${dec(t.clicsMedia)} (${t.clicsOptimos}) | ${pct(t.eficienciaClics)} | ${t.tiempoReferenciaS === null ? 'sin tiempo de referencia' : pct(t.eficienciaTiempo)} | ${t.errores} | ${t.conAyuda}`)
  }
  L.push('', `SATISFACCIÓN (SUS 0-100): cuestionarios ${r.sus.validos} válidos de ${r.sus.respuestas}`)
  L.push(`  media ${dec(r.sus.media)} · mediana ${dec(r.sus.mediana)} · desviación ${dec(r.sus.desviacion)} · mín. ${dec(r.sus.minimo, 0)} · máx. ${dec(r.sus.maximo, 0)}`)
  if (r.sus.validos > 0 && r.sus.validos < 5) L.push(`  Con ${r.sus.validos} participante(s) el SUS es solo orientativo (la media de referencia de 68 es de muestras grandes).`)
  return L.join('\n')
}

// ---------------------------------------------------------------- Línea de órdenes
function leerReferencias(ruta) {
  if (!ruta || !existsSync(ruta)) return {}
  return Object.fromEntries(leerCsv(readFileSync(ruta, 'utf8')).filter((f) => f.tarea && f.tiempo_experto_s).map((f) => [f.tarea, Number(f.tiempo_experto_s)]))
}

if (process.argv[1] && resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
  const ruta = resolve(process.argv[2] ?? resolve(RAIZ, 'docs', 'usabilidad', 'resultados-prueba.csv'))
  const referencias = leerReferencias(resolve(process.argv[3] ?? resolve(RAIZ, 'docs', 'usabilidad', 'tiempos-referencia.csv')))
  const filas = leerCsv(readFileSync(ruta, 'utf8'))
  if (filas.length === 0) {
    console.log(`${ruta}\nEl archivo no tiene filas de datos (solo encabezados): todavía no hay resultados que analizar.`)
  } else {
    console.log(informe(analizar(filas, referencias)))
  }
}
