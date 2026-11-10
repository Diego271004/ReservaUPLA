import { figura, p } from '../lib/word.js'
import { porClave, rangoDe } from '../lib/codigos.js'
import { readFileSync } from 'node:fs'
import path from 'node:path'
import { RAIZ } from '../lib/codigo.js'

/**
 * Explicación + captura de VS Code (generada por capturas-codigo.mjs) de uno o más fragmentos de código reales.
 * El pie de la figura indica archivo y líneas calculados del repositorio al generar el informe.
 */
export function codigoVs(...claves) {
  return claves.flatMap((clave) => {
    const c = porClave(clave)
    const lineas = readFileSync(path.join(RAIZ, c.ruta), 'utf8').split(/\r?\n/)
    const { ini, fin } = rangoDe(c, lineas)
    return [
      p(c.explica),
      ...figura(`vs-${clave}`, `${c.titulo} (${c.ruta}, líneas ${ini}–${fin})`, {
        tipo: 'Código',
        que: c.titulo,
        pasos: [],
        archivo: `codigo/${clave}.png`,
        seccion: '',
      }),
    ]
  })
}
