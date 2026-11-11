import { describe, expect, it } from 'vitest'
import { readdirSync, readFileSync } from 'node:fs'
import { extname, join } from 'node:path'

const RAIZ = join(process.cwd(), 'src')
const SEC = /(?:â€|Ã[¡éíóúñ]|Â )/

function archivos(directorio) {
  return readdirSync(directorio, { withFileTypes: true }).flatMap((entrada) => {
    const ruta = join(directorio, entrada.name)
    return entrada.isDirectory() ? archivos(ruta) : [ruta]
  })
}

describe('codificación UTF-8', () => {
  it('frontend/src no contiene secuencias de mojibake conocidas', () => {
    const fallos = archivos(RAIZ)
      .filter((ruta) => ['.js', '.jsx', '.css'].includes(extname(ruta)))
      .filter((ruta) => !ruta.endsWith('encoding.test.js'))
      .filter((ruta) => SEC.test(readFileSync(ruta, 'utf8')))
    expect(fallos, `Mojibake encontrado en: ${fallos.join(', ')}`).toEqual([])
  })
})
