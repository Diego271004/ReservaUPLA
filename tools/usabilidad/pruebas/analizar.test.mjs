// Prueba del analizador con un archivo SINTÉTICO (resultados-SINTETICO.csv): los valores esperados están calculados a mano.
// Estos números NO son resultados de personas y no se citan en ningún informe.
import assert from 'node:assert/strict'
import { readFileSync } from 'node:fs'
import { dirname, resolve } from 'node:path'
import { test } from 'node:test'
import { fileURLToPath } from 'node:url'
import { ENCABEZADOS, analizar, informe, leerCsv, puntajeSus } from '../analizar.mjs'

const aqui = dirname(fileURLToPath(import.meta.url))
const filas = leerCsv(readFileSync(resolve(aqui, 'resultados-SINTETICO.csv'), 'utf8'))
const resultado = analizar(filas, { T01: 100 })
const t01 = resultado.porTarea.find((t) => t.id === 'T01')

test('SUS: las respuestas extremas dan 100, las neutras 50 y un patrón mixto 75', () => {
  assert.equal(puntajeSus([5, 1, 5, 1, 5, 1, 5, 1, 5, 1]), 100)
  assert.equal(puntajeSus([3, 3, 3, 3, 3, 3, 3, 3, 3, 3]), 50)
  assert.equal(puntajeSus([4, 2, 4, 2, 4, 2, 4, 2, 4, 2]), 75)
  assert.equal(puntajeSus([1, 5, 1, 5, 1, 5, 1, 5, 1, 5]), 0)
})

test('SUS: un cuestionario incompleto o fuera de la escala no se puntúa', () => {
  assert.equal(puntajeSus([5, 1, 5]), null)
  assert.equal(puntajeSus([6, 1, 5, 1, 5, 1, 5, 1, 5, 1]), null)
  assert.equal(puntajeSus([5, 1, 5, 1, 5, 1, 5, 1, 5, null]), null)
})

test('el CSV con comillas y comas dentro del comentario se lee bien', () => {
  assert.equal(filas.find((f) => f.participante === 'P3' && f.tarea === 'T01').comentario, 'se rindió, con coma')
  assert.equal(filas.length, 7)
})

test('eficacia = completadas / intentadas, global y por tarea', () => {
  assert.equal(resultado.eficaciaGlobal, 3 / 4)
  assert.equal(t01.intentadas, 3)
  assert.equal(t01.completadas, 2)
  assert.equal(t01.eficacia, 2 / 3)
})

test('eficiencia: tiempo mediana, clics medios y eficiencia frente al óptimo (8 clics) y a la referencia (100 s)', () => {
  assert.equal(t01.tiempoMedianaS, 125)
  assert.equal(t01.dentroDelTiempo, 1)
  assert.equal(t01.clicsMedia, 9)
  assert.ok(Math.abs(t01.eficienciaClics - 0.9) < 1e-9)
  assert.ok(Math.abs(t01.eficienciaTiempo - (1 + 100 / 150) / 2) < 1e-9)
  assert.equal(t01.errores, 3)
  assert.equal(t01.conAyuda, 1)
})

test('SUS del grupo: media, mediana y desviación', () => {
  assert.equal(resultado.sus.validos, 3)
  assert.equal(resultado.sus.media, 75)
  assert.equal(resultado.sus.mediana, 75)
  assert.equal(resultado.sus.desviacion, 25)
})

test('el informe de datos sintéticos lo avisa en la primera línea', () => {
  assert.equal(resultado.sinteticos, true)
  assert.match(informe(resultado).split('\n')[0], /SINTÉTICOS/)
})

test('un CSV con solo los encabezados no produce filas (no se inventa nada)', () => {
  assert.deepEqual(leerCsv(ENCABEZADOS.join(',') + '\n'), [])
})

test('la plantilla de docs/usabilidad tiene exactamente los encabezados esperados y ninguna fila', () => {
  const plantilla = readFileSync(resolve(aqui, '../../../docs/usabilidad/resultados-prueba.csv'), 'utf8')
  assert.equal(plantilla.trim(), ENCABEZADOS.join(','))
})
