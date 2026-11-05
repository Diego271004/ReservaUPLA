import assert from 'node:assert/strict'
import { test } from 'node:test'
import sharp from 'sharp'
import { luminancia, peorPixel, razonBlancoSobre } from '../contraste-foto.mjs'

test('el blanco sobre blanco es 1:1 y sobre negro 21:1', () => {
  assert.ok(Math.abs(razonBlancoSobre([255, 255, 255]) - 1) < 0.001)
  assert.ok(Math.abs(razonBlancoSobre([0, 0, 0]) - 21) < 0.001)
})

test('el blanco sobre el azul marino #1F365C da el contraste calculado a mano (12,07:1)', () => {
  const razon = razonBlancoSobre([0x1f, 0x36, 0x5c])
  assert.ok(razon > 12.0 && razon < 12.1, `razón ${razon}`)
  assert.ok(luminancia([0x1f, 0x36, 0x5c]) < 0.05)
})

test('peorPixel encuentra el píxel MÁS CLARO de la caja pedida y solo mira dentro de ella', async () => {
  // Imagen 6x4 oscura con un píxel claro en (4,2) y otro, aún más claro, FUERA de la caja en (0,0).
  const ancho = 6
  const alto = 4
  const datos = Buffer.alloc(ancho * alto * 3, 30)
  const poner = (x, y, v) => datos.fill(v, (y * ancho + x) * 3, (y * ancho + x) * 3 + 3)
  poner(4, 2, 200)
  poner(0, 0, 250)
  const png = await sharp(datos, { raw: { width: ancho, height: alto, channels: 3 } }).png().toBuffer()
  const { data, info } = await sharp(png).raw().toBuffer({ resolveWithObject: true })
  const peor = peorPixel(data, info.width, info.channels, { x: 2, y: 1, ancho: 4, alto: 3 })
  assert.deepEqual(peor.pixel, [200, 200, 200])
  assert.ok(Math.abs(peor.razon - razonBlancoSobre([200, 200, 200])) < 1e-9)
})
