// Genera las versiones del logo que carga la interfaz, a 2x de su alto de uso (80 px para el logo de 40 px del menú y 160 px
// para el de 80 px del login), a partir del original de 1724x2000 de frontend/src/assets/. El original no se importa en pantalla.
// Uso (desde tools/usabilidad, tras `npm install`): node optimizar-imagenes.mjs
import { statSync } from 'node:fs'
import { dirname, resolve } from 'node:path'
import { fileURLToPath } from 'node:url'
import sharp from 'sharp'

const ASSETS = resolve(dirname(fileURLToPath(import.meta.url)), '../../frontend/src/assets')
const ORIGINAL = resolve(ASSETS, 'logo-upla.webp')
const VERSIONES = [
  { archivo: 'logo-upla-menu.webp', alto: 80 },
  { archivo: 'logo-upla-login.webp', alto: 160 },
]

console.log(`original: ${statSync(ORIGINAL).size} bytes`)
for (const { archivo, alto } of VERSIONES) {
  const destino = resolve(ASSETS, archivo)
  const info = await sharp(ORIGINAL).resize({ height: alto }).webp({ quality: 88, alphaQuality: 100, effort: 6 }).toFile(destino)
  console.log(`${archivo}: ${info.width}x${info.height}, ${info.size} bytes`)
}
