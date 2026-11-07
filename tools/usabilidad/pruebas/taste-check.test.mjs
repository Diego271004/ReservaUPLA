import assert from 'node:assert/strict'
import { test } from 'node:test'
import { validarDuracionTransicion, verificarAlineacionBordes } from '../taste-check.mjs'

test('verificarAlineacionBordes: detecta bordes alineados dentro de la tolerancia', () => {
  const r1 = { left: 100, right: 900 }
  const r2 = { left: 101, right: 899 }
  const res = verificarAlineacionBordes(r1, r2, 2)
  assert.equal(res.alineadoIzquierda, true)
  assert.equal(res.alineadoDerecha, true)
  assert.equal(res.difIzquierda, 1)
  assert.equal(res.difDerecha, 1)
})

test('verificarAlineacionBordes: detecta desalineación fuera de la tolerancia', () => {
  const r1 = { left: 100, right: 900 }
  const r2 = { left: 110, right: 880 }
  const res = verificarAlineacionBordes(r1, r2, 2)
  assert.equal(res.alineadoIzquierda, false)
  assert.equal(res.alineadoDerecha, false)
  assert.equal(res.difIzquierda, 10)
  assert.equal(res.difDerecha, 20)
})

test('validarDuracionTransicion: aprueba transiciones rápidas y sobrias ≤ 250 ms', () => {
  assert.equal(validarDuracionTransicion(0), true)
  assert.equal(validarDuracionTransicion(150), true)
  assert.equal(validarDuracionTransicion(200), true)
  assert.equal(validarDuracionTransicion(250), true)
  assert.equal(validarDuracionTransicion(400), false)
  assert.equal(validarDuracionTransicion(-10), false)
})

