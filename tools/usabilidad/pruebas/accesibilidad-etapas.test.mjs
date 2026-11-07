import assert from 'node:assert/strict'
import { readFileSync } from 'node:fs'
import { dirname, resolve } from 'node:path'
import { test } from 'node:test'
import { fileURLToPath } from 'node:url'

const aqui = dirname(fileURLToPath(import.meta.url))
const scriptPath = resolve(aqui, '..', 'accesibilidad.mjs')
const codigo = readFileSync(scriptPath, 'utf8')

test('accesibilidad.mjs soporta la etapa pulido y su archivo pulido-accesibilidad.txt', () => {
  assert.ok(codigo.includes("'pulido'"), 'debe incluir la etapa pulido en la lista permitida')
  assert.ok(codigo.includes("pulido: ['pulido', 'medicion']"), 'debe mapear la etapa pulido a su subcarpeta')
  assert.ok(codigo.includes("pulido: 'pulido-accesibilidad.txt'"), 'debe guardar el informe en pulido-accesibilidad.txt')
  assert.ok(codigo.includes("ETAPA === 'pulido'"), 'debe activar subfase A para pulido')
})

