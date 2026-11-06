import test from 'node:test'
import assert from 'node:assert/strict'
import { dirname, resolve } from 'node:path'
import { fileURLToPath } from 'node:url'

const aqui = dirname(fileURLToPath(import.meta.url))
process.env.CLAVE_PRUEBA = process.env.CLAVE_PRUEBA || 'Prueba!123'
const { destinoSeguro, CARPETA_EXPERIENCIAS } = await import('./lib.mjs')

const raiz = resolve(aqui, '../..')

test('redirige destinos históricos a la carpeta de experiencia', () => {
  assert.equal(destinoSeguro([resolve(raiz, 'docs/evidencias/fase9')]), CARPETA_EXPERIENCIAS)
  assert.equal(destinoSeguro([resolve(raiz, 'docs/evidencias/fase-ai')]), CARPETA_EXPERIENCIAS)
})

test('permite únicamente la carpeta de experiencia', () => {
  const permitido = resolve(raiz, 'docs/evidencias/experiencia')
  assert.equal(destinoSeguro([permitido]), permitido)
  assert.equal(destinoSeguro([resolve(raiz, 'docs/evidencias/experiencia/accesibilidad')]), resolve(raiz, 'docs/evidencias/experiencia/accesibilidad'))
})
