// Valida TODOS los diagramas Mermaid de docs/ (y del README): cada bloque ```mermaid se RENDERIZA a SVG con la biblioteca
// `mermaid` dentro de Edge/Chrome sin ventana; un error de sintaxis hace fallar el bloque. No basta con que «parezca» bien.
// Uso (desde tools/usabilidad, tras `npm install`):
//   node validar-mermaid.mjs                    informa cuántos diagramas se renderizaron y cuáles fallan (código 1 si falla alguno)
//   node validar-mermaid.mjs --salida <carpeta> además guarda cada SVG (por defecto no se guarda nada)
import { mkdirSync, readdirSync, readFileSync, statSync, writeFileSync } from 'node:fs'
import { createRequire } from 'node:module'
import { dirname, join, relative, resolve } from 'node:path'
import { fileURLToPath } from 'node:url'

// lib.mjs exige CLAVE_PRUEBA al cargarse; aquí no se inicia sesión, así que cualquier valor sirve.
process.env.CLAVE_PRUEBA ??= 'no-se-usa'
const { abrirNavegador } = await import('../e2e/lib.mjs')

const RAIZ = resolve(dirname(fileURLToPath(import.meta.url)), '../..')
const RUTA_MERMAID = createRequire(import.meta.url).resolve('mermaid/dist/mermaid.min.js')

function archivosMarkdown(carpeta) {
  return readdirSync(carpeta).flatMap((nombre) => {
    const ruta = join(carpeta, nombre)
    if (nombre === 'node_modules') return []
    return statSync(ruta).isDirectory() ? archivosMarkdown(ruta) : ruta.endsWith('.md') ? [ruta] : []
  })
}

/** Los bloques ```mermaid de un texto, con la línea en que empiezan. */
export function extraerDiagramas(texto) {
  const diagramas = []
  const lineas = texto.split('\n')
  for (let i = 0; i < lineas.length; i++) {
    if (lineas[i].trim() !== '```mermaid') continue
    const inicio = i + 1
    const cuerpo = []
    for (i = inicio; i < lineas.length && lineas[i].trim() !== '```'; i++) cuerpo.push(lineas[i])
    diagramas.push({ linea: inicio, codigo: cuerpo.join('\n') })
  }
  return diagramas
}

export function todosLosDiagramas() {
  const archivos = [...archivosMarkdown(join(RAIZ, 'docs')), join(RAIZ, 'README.md')]
  return archivos.flatMap((archivo) =>
    extraerDiagramas(readFileSync(archivo, 'utf8')).map((d) => ({ ...d, archivo: relative(RAIZ, archivo).replaceAll('\\', '/') })),
  )
}

async function renderizar(pagina, diagrama, indice) {
  return pagina.evaluate(
    async ({ codigo, id }) => {
      try {
        const { svg } = await window.mermaid.render(id, codigo)
        return { svg }
      } catch (error) {
        return { error: String(error?.message ?? error).split('\n').slice(0, 3).join(' / ') }
      }
    },
    { codigo: diagrama.codigo, id: `diagrama${indice}` },
  )
}

if (process.argv[1] && resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
  const posicion = process.argv.indexOf('--salida')
  const salida = posicion > 0 ? resolve(process.argv[posicion + 1]) : null
  if (salida) mkdirSync(salida, { recursive: true })

  const diagramas = todosLosDiagramas()
  const navegador = await abrirNavegador()
  const fallos = []
  try {
    const pagina = await navegador.newPage()
    await pagina.setContent('<!doctype html><html><body></body></html>')
    await pagina.addScriptTag({ path: RUTA_MERMAID })
    await pagina.evaluate(() => window.mermaid.initialize({ startOnLoad: false, securityLevel: 'strict' }))
    for (const [indice, diagrama] of diagramas.entries()) {
      const { svg, error } = await renderizar(pagina, diagrama, indice)
      const donde = `${diagrama.archivo}:${diagrama.linea}`
      if (error || !svg?.includes('<svg')) {
        fallos.push({ donde, error: error ?? 'sin SVG' })
        console.log(`   FALLA  ${donde}: ${error ?? 'sin SVG'}`)
      } else {
        console.log(`   OK     ${donde} (${svg.length} bytes de SVG)`)
        if (salida) writeFileSync(join(salida, `${diagrama.archivo.replaceAll('/', '__')}-L${diagrama.linea}.svg`), svg, 'utf8')
      }
    }
  } finally {
    await navegador.close()
  }
  console.log(`\n${diagramas.length - fallos.length} de ${diagramas.length} diagramas renderizados a SVG.`)
  process.exit(fallos.length === 0 && diagramas.length > 0 ? 0 : 1)
}
