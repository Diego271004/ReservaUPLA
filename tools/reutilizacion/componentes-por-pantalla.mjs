// Genera la tabla "Componente | Pantallas que lo usan" recorriendo el código del frontend (no se escribe a mano).
// Lee los import de cada archivo de src/pages y src/components y comprueba que la etiqueta <Componente> se use en el JSX.
//  - "Directo": la pantalla escribe <Componente> en su propio JSX.
//  - "Indirecto": la pantalla lo recibe a través de otro componente que sí lo usa (por ejemplo FormularioTarjeta → Button).
// Reemplaza el bloque entre <!-- componentes:inicio --> y <!-- componentes:fin --> de docs/reutilizacion.md.
// Uso (desde tools/reutilizacion):  node componentes-por-pantalla.mjs
import { existsSync, readdirSync, readFileSync, writeFileSync } from 'node:fs'
import { basename, dirname, join, relative, resolve } from 'node:path'
import { fileURLToPath } from 'node:url'

const aqui = dirname(fileURLToPath(import.meta.url))
const RAIZ = resolve(aqui, '../..')
const SRC = join(RAIZ, 'frontend', 'src')
const DOC = join(RAIZ, 'docs', 'reutilizacion.md')
const INICIO = '<!-- componentes:inicio -->'
const FIN = '<!-- componentes:fin -->'

const NUEVE_DEL_DISENO = [
  'TextInput',
  'SelectInput',
  'DateInput',
  'TimeInput',
  'Button',
  'AlertMessage',
  'ModalConfirmacion',
  'TableList',
  'CardIndicador',
]

const esFuente = (nombre) => nombre.endsWith('.jsx') && !nombre.endsWith('.test.jsx')
const listar = (carpeta) =>
  readdirSync(carpeta, { withFileTypes: true }).flatMap((entrada) => {
    const ruta = join(carpeta, entrada.name)
    if (entrada.isDirectory()) return listar(ruta)
    return esFuente(entrada.name) ? [ruta] : []
  })

const nombreDe = (ruta) => basename(ruta, '.jsx')
const comentariosFuera = (texto) => texto.replace(/\/\*[\s\S]*?\*\//g, '').replace(/^\s*\/\/.*$/gm, '')

// ---------------------------------------------------------------- Grafo de componentes
const componentes = listar(join(SRC, 'components')).map((ruta) => ({ nombre: nombreDe(ruta), ruta }))
// Una pantalla también puede apoyarse en otra (AmbientesPage y UsuariosPage usan ListadoPage): entra al grafo para seguir el rastro.
const rutasDePaginas = listar(join(SRC, 'pages'))
const nodos = [...componentes, ...rutasDePaginas.map((ruta) => ({ nombre: nombreDe(ruta), ruta }))]
const porRuta = new Map(nodos.map((c) => [c.ruta, c]))

/** Componentes que el archivo importa Y usa como etiqueta JSX (<Nombre). */
function componentesUsadosPor(ruta) {
  const texto = comentariosFuera(readFileSync(ruta, 'utf8'))
  const usados = new Set()
  for (const [, local, origen] of texto.matchAll(/import\s+(\w+)\s+from\s+'(\.[^']+\.jsx)'/g)) {
    const destino = resolve(dirname(ruta), origen)
    if (porRuta.has(destino) && new RegExp(`<${local}[\\s/>]`).test(texto)) usados.add(porRuta.get(destino).nombre)
  }
  // Importaciones con nombre: import { A, B } from '...jsx'
  for (const [, lista, origen] of texto.matchAll(/import\s+\{([^}]+)\}\s+from\s+'(\.[^']+\.jsx)'/g)) {
    const destino = resolve(dirname(ruta), origen)
    if (!existsSync(destino)) continue
    for (const nombre of lista.split(',').map((n) => n.trim().split(/\s+as\s+/).pop())) {
      if (nombre && new RegExp(`<${nombre}[\\s/>]`).test(texto)) usados.add(nombre)
    }
  }
  return usados
}

// Un archivo de components/ puede exportar varios componentes (Icono, IconoError): se cuentan por el nombre del archivo.
const usoDeComponente = new Map(nodos.map((c) => [c.nombre, componentesUsadosPor(c.ruta)]))

function indirectosDe(directos) {
  const vistos = new Set(directos)
  const cola = [...directos]
  while (cola.length > 0) {
    for (const hijo of usoDeComponente.get(cola.pop()) ?? []) {
      if (!vistos.has(hijo)) {
        vistos.add(hijo)
        cola.push(hijo)
      }
    }
  }
  return [...vistos].filter((nombre) => !directos.has(nombre))
}

// ---------------------------------------------------------------- Pantallas
const paginas = rutasDePaginas.map((ruta) => {
  const directos = componentesUsadosPor(ruta)
  return { nombre: nombreDe(ruta), directos, indirectos: new Set(indirectosDe(directos)) }
})

const layoutEnApp = componentesUsadosPor(join(SRC, 'App.jsx')).has('Layout')

// ---------------------------------------------------------------- Tabla
const nombresDeComponentes = [...new Set(componentes.map((c) => c.nombre))].sort((a, b) => a.localeCompare(b, 'es'))
const lista = (nombres) => (nombres.length > 0 ? nombres.join(', ') : '—')

const filas = nombresDeComponentes.map((componente) => {
  const directas = paginas.filter((p) => p.directos.has(componente)).map((p) => p.nombre)
  const indirectas = paginas.filter((p) => !p.directos.has(componente) && p.indirectos.has(componente)).map((p) => p.nombre)
  const extra = componente === 'Layout' && layoutEnApp ? ['App.jsx (envuelve todas las rutas protegidas)'] : []
  const delDiseno = NUEVE_DEL_DISENO.includes(componente) ? 'sí' : 'no'
  return { componente, delDiseno, directas: [...extra, ...directas], indirectas, total: directas.length + indirectas.length + extra.length }
})

const tabla = [
  '| Componente | De los nueve del diseño | Pantallas que lo escriben (directo) | Pantallas que lo reciben a través de otro componente | Pantallas en total |',
  '|---|---|---|---|---|',
  ...filas.map((f) => `| \`${f.componente}\` | ${f.delDiseno} | ${lista(f.directas)} | ${lista(f.indirectas)} | ${f.total} |`),
].join('\n')

const sinUso = filas.filter((f) => f.total === 0).map((f) => f.componente)
const resumen = [
  `Pantallas recorridas (${paginas.length}): ${paginas.map((p) => p.nombre).join(', ')}.`,
  `Componentes recorridos (${nombresDeComponentes.length}): los de \`src/components\`.`,
  sinUso.length > 0
    ? `Componentes que ninguna pantalla usa todavía: ${sinUso.map((n) => `\`${n}\``).join(', ')}.`
    : 'Todos los componentes se usan al menos en una pantalla.',
].join('\n\n')

const generado = `${INICIO}\n<!-- Generado por tools/reutilizacion/componentes-por-pantalla.mjs a partir de los import y el JSX de frontend/src. No editar a mano. -->\n\n${resumen}\n\n${tabla}\n${FIN}`

if (existsSync(DOC)) {
  const actual = readFileSync(DOC, 'utf8')
  const i = actual.indexOf(INICIO)
  const f = actual.indexOf(FIN)
  if (i === -1 || f === -1) {
    console.error(`Faltan los marcadores ${INICIO} y ${FIN} en ${relative(RAIZ, DOC)}.`)
    process.exit(1)
  }
  writeFileSync(DOC, actual.slice(0, i) + generado + actual.slice(f + FIN.length), 'utf8')
  console.log(`Tabla actualizada en ${relative(RAIZ, DOC)}.`)
} else {
  console.log(generado)
}
