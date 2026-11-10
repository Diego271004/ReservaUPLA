// Escribe la lista de ficheros y líneas que capturar con VS Code real (la lee capturas-vscode.ps1).
import { readFileSync, writeFileSync } from 'node:fs'
import path from 'node:path'
import { fileURLToPath } from 'node:url'
import { CODIGOS, rangoDe } from './lib/codigos.js'

const RAIZ = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..', '..')
const lista = CODIGOS.map((c) => {
  const lineas = readFileSync(path.join(RAIZ, c.ruta), 'utf8').split(/\r?\n/)
  const { ini, fin } = rangoDe(c, lineas)
  return { clave: c.clave, ruta: path.join(RAIZ, c.ruta), ini, fin, medio: ini + 14 }
})
writeFileSync(process.argv[2], JSON.stringify(lista, null, 1))
console.log(`${lista.length} fragmentos`)
