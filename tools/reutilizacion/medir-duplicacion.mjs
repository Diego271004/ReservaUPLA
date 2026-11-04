// Mide la duplicación de código con jscpd sobre frontend/src y backend y escribe el informe en un archivo de texto.
// Uso (desde tools/reutilizacion):
//   node medir-duplicacion.mjs <archivo-de-salida> [etiqueta]
//   node medir-duplicacion.mjs ../../docs/evidencias/fase7-duplicacion-antes.txt antes
// Se mide solo el código de la aplicación: se excluyen bin, obj, node_modules, dist, CSS y TODO el código de pruebas
// (*.test.js(x), src/test y los proyectos *.Tests de C#), porque las pruebas repiten estructura a propósito.
import { execFileSync } from 'node:child_process'
import { mkdtempSync, readFileSync, writeFileSync } from 'node:fs'
import { tmpdir } from 'node:os'
import { dirname, join, relative, resolve } from 'node:path'
import { fileURLToPath } from 'node:url'

const aqui = dirname(fileURLToPath(import.meta.url))
const raiz = resolve(aqui, '../..')
const [salida, etiqueta = 'medición'] = process.argv.slice(2)
if (!salida) {
  console.error('Uso: node medir-duplicacion.mjs <archivo-de-salida> [etiqueta]')
  process.exit(2)
}

// Tres sensibilidades. Con la estándar de jscpd (5 líneas y 50 tokens) el proyecto ya da 0 %, así que la medida de
// referencia es la "sensible" (4 líneas y 30 tokens); la "muy sensible" (3 líneas y 20 tokens) también cuenta bloques
// pequeños, muchos triviales (importaciones, firmas parecidas), y sirve para ver la tendencia.
const PERFILES = [
  { nombre: 'sensible (medida de referencia)', minLineas: 4, minTokens: 30, lista: true },
  { nombre: 'estándar de jscpd', minLineas: 5, minTokens: 50, lista: false },
  { nombre: 'muy sensible', minLineas: 3, minTokens: 20, lista: true },
]
const IGNORAR = [
  '**/bin/**',
  '**/obj/**',
  '**/node_modules/**',
  '**/dist/**',
  '**/*.test.js',
  '**/*.test.jsx',
  '**/src/test/**',
  '**/*.Tests/**',
  '**/*.css',
]

const jscpd = resolve(aqui, 'node_modules/jscpd/bin/jscpd')
const limpio = (ruta) => relative(raiz, resolve(raiz, ruta)).split('\\').join('/')

function medir({ minLineas, minTokens }) {
  const carpetaTemporal = mkdtempSync(join(tmpdir(), 'jscpd-'))
  execFileSync(
    process.execPath,
    [
      jscpd,
      'frontend/src',
      'backend',
      '--format',
      'javascript,jsx,csharp',
      '--min-lines',
      String(minLineas),
      '--min-tokens',
      String(minTokens),
      '--ignore',
      IGNORAR.join(','),
      '--reporters',
      'json',
      '--output',
      carpetaTemporal,
      '--silent',
    ],
    { cwd: raiz, stdio: 'pipe' },
  )
  return JSON.parse(readFileSync(join(carpetaTemporal, 'jscpd-report.json'), 'utf8'))
}

const lineas = []
lineas.push(`INFORME DE DUPLICACIÓN (${etiqueta}) — jscpd 4.0.5`)
lineas.push(
  'Carpetas: frontend/src y backend. Excluidos: bin, obj, node_modules, dist, CSS y todo el código de pruebas ' +
    '(*.test.js, *.test.jsx, src/test, proyectos *.Tests).',
)
lineas.push('Formatos: javascript, jsx y csharp.')

for (const perfil of PERFILES) {
  const informe = medir(perfil)
  const total = informe.statistics.total
  lineas.push('')
  lineas.push('='.repeat(78))
  lineas.push(`PERFIL ${perfil.nombre.toUpperCase()}: bloques de al menos ${perfil.minLineas} líneas y ${perfil.minTokens} tokens`)
  lineas.push('='.repeat(78))
  lineas.push(`  Archivos analizados : ${total.sources}`)
  lineas.push(`  Líneas analizadas   : ${total.lines}`)
  lineas.push(`  Líneas duplicadas   : ${total.duplicatedLines}`)
  lineas.push(`  Bloques duplicados  : ${total.clones}`)
  lineas.push(
    `  PORCENTAJE DUPLICADO: ${total.percentage.toFixed(2)} % de las líneas (${total.percentageTokens.toFixed(2)} % de los tokens)`,
  )
  lineas.push('  Por formato:')
  for (const [nombre, datos] of Object.entries(informe.statistics.formats)) {
    const f = datos.total
    lineas.push(
      `    ${nombre.padEnd(11)} ${String(f.lines).padStart(6)} líneas  ${String(f.duplicatedLines).padStart(5)} duplicadas  ` +
        `${String(f.clones).padStart(3)} bloques  ${f.percentage.toFixed(2).padStart(6)} %`,
    )
  }
  if (!perfil.lista) continue

  lineas.push('')
  lineas.push(`  BLOQUES DUPLICADOS (${informe.duplicates.length}), de mayor a menor:`)
  informe.duplicates
    .map((d) => ({
      formato: d.format,
      lineas: d.lines,
      a: `${limpio(d.firstFile.name)}:${d.firstFile.start}-${d.firstFile.end}`,
      b: `${limpio(d.secondFile.name)}:${d.secondFile.start}-${d.secondFile.end}`,
    }))
    .sort((x, y) => y.lineas - x.lineas || x.a.localeCompare(y.a))
    .forEach((d, i) => {
      lineas.push(`  ${String(i + 1).padStart(3)}. [${d.formato}] ${d.lineas} líneas`)
      lineas.push(`        ${d.a}`)
      lineas.push(`        ${d.b}`)
    })
  if (informe.duplicates.length === 0) lineas.push('  (ninguno)')
}

writeFileSync(resolve(process.cwd(), salida), lineas.join('\n') + '\n', 'utf8')
console.log(lineas.filter((l) => /^PERFIL|PORCENTAJE|Bloques duplicados/.test(l.trim() === l ? l : l.trim())).join('\n'))
