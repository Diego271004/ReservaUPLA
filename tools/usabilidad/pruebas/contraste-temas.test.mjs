import test from 'node:test'
import assert from 'node:assert/strict'
import { analizarContraste, leerTokens } from '../contraste.mjs'

test('los tokens del tema claro y del oscuro se leen por separado (el oscuro no pisa al claro)', () => {
  const claro = leerTokens('claro')
  const oscuro = leerTokens('oscuro')
  assert.equal(claro['--color-fondo'], '#f4f6fa')
  assert.equal(oscuro['--color-fondo'], '#0f1726')
  assert.equal(claro['--texto-marino'], '#1f365c')
  assert.equal(oscuro['--texto-marino'], '#e8edf6')
  // La marca no cambia: el menú marino es el mismo en los dos temas.
  assert.equal(claro['--color-marino'], oscuro['--color-marino'])
})

test('el informe mide los dos temas y ningún par real de las hojas de estilo queda por debajo del umbral', () => {
  const { lineas, fallos } = analizarContraste()
  assert.ok(lineas.some((l) => l.includes('TEMA CLARO')))
  assert.ok(lineas.some((l) => l.includes('TEMA OSCURO')))
  assert.deepEqual(fallos, [])
})
