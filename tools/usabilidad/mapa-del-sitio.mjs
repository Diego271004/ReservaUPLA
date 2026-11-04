// Mapa del sitio generado desde el código real: frontend/src/constants/rutas.js (pantallas y roles) y
// navegacion.js (menú por rol y pantalla inicial). No hay datos escritos a mano: si cambia una ruta, cambia el mapa.
// Uso: node mapa-del-sitio.mjs               imprime la tabla y el diagrama Mermaid
//      node mapa-del-sitio.mjs --escribir    los pone entre las marcas MAPA de docs/usabilidad/arquitectura-de-informacion.md
//      node mapa-del-sitio.mjs --verificar   falla (código 1) si ese documento no coincide con el código
import { readFileSync, writeFileSync } from 'node:fs'
import { dirname, join, resolve } from 'node:path'
import { fileURLToPath, pathToFileURL } from 'node:url'

const RAIZ = resolve(dirname(fileURLToPath(import.meta.url)), '../..')
const CONSTANTES = join(RAIZ, 'frontend', 'src', 'constants')
export const DOCUMENTO = join(RAIZ, 'docs', 'usabilidad', 'arquitectura-de-informacion.md')
const INICIO = '<!-- MAPA:inicio -->'
const FIN = '<!-- MAPA:fin -->'

const cargar = (archivo) => import(pathToFileURL(join(CONSTANTES, archivo)).href)

const idDe = (rol, ruta) => `${rol[0]}${ruta.replace(/[^a-z]/gi, '_')}`
const nombreDeRol = (NOMBRE_DE_ROL, rol) => NOMBRE_DE_ROL[rol] ?? rol

/** Lo que hace falta del código: rutas, menú, pantalla inicial y nombres de rol. */
export async function leerEstructura() {
  const { RUTAS } = await cargar('rutas.js')
  const { MENU_POR_ROL, RUTA_INICIAL_POR_ROL, NOMBRE_DE_ROL, ROLES } = await cargar('navegacion.js')
  const { TEXTOS } = await cargar('messages.js')
  return { RUTAS, MENU_POR_ROL, RUTA_INICIAL_POR_ROL, NOMBRE_DE_ROL, ROLES, TEXTOS }
}

const enMenu = (menu, ruta) => menu.find((opcion) => opcion.ruta === ruta)

/** Tabla: dirección, pantalla, roles que entran, roles que la ven en su menú y desde dónde se llega a las demás. */
export function tablaDeRutas({ RUTAS, MENU_POR_ROL, NOMBRE_DE_ROL, ROLES, TEXTOS }) {
  const filas = [
    `| \`/login\` | ${TEXTOS.tituloLogin} | Sin sesión (pública) | — | Dirección o cierre de sesión |`,
    '| `/` | Redirige a la pantalla inicial del rol (o a `/login`) | Cualquiera | — | Dirección |',
  ]
  for (const r of RUTAS) {
    const delMenu = Object.values(ROLES).filter((rol) => enMenu(MENU_POR_ROL[rol], r.ruta))
    const origen = r.contextual
      ? `Enlace desde ${r.desde.map((d) => `\`${d}\``).join(', ')}`
      : delMenu.length
        ? 'Menú lateral'
        : 'Botón dentro de la pantalla del menú'
    filas.push(
      `| \`${r.ruta}\` | ${r.titulo} | ${r.roles.map((x) => nombreDeRol(NOMBRE_DE_ROL, x)).join(', ')} | ${
        delMenu.map((x) => nombreDeRol(NOMBRE_DE_ROL, x)).join(', ') || '—'
      } | ${origen} |`,
    )
  }
  filas.push(`| \`*\` | ${TEXTOS.paginaNoEncontrada} | Con sesión | — | Dirección que no existe |`)
  return [
    '| Dirección | Pantalla | Roles que pueden entrar | Lo ve en su menú | Cómo se llega |',
    '|---|---|---|---|---|',
    ...filas,
  ].join('\n')
}

/** Diagrama Mermaid de la estructura: un bloque por rol con su menú, sus subpantallas y los enlaces contextuales. */
export function diagramaDeEstructura({ RUTAS, MENU_POR_ROL, RUTA_INICIAL_POR_ROL, NOMBRE_DE_ROL, ROLES }) {
  const lineas = ['flowchart LR', '  LOGIN[Iniciar sesión]']
  for (const rol of Object.values(ROLES)) {
    const permitidas = RUTAS.filter((r) => r.roles.includes(rol))
    lineas.push(`  subgraph ${rol}["${nombreDeRol(NOMBRE_DE_ROL, rol)}"]`, '    direction TB')
    for (const r of permitidas) {
      const marca = enMenu(MENU_POR_ROL[rol], r.ruta) ? '' : r.contextual ? ' (enlace)' : ' (botón)'
      lineas.push(`    ${idDe(rol, r.ruta)}["${r.titulo}${marca}"]`)
    }
    for (const r of permitidas) {
      const padre = permitidas.find((p) => !p.contextual && r.ruta.startsWith(`${p.ruta}/`) && p !== r)
      if (padre && !r.contextual && !enMenu(MENU_POR_ROL[rol], r.ruta)) lineas.push(`    ${idDe(rol, padre.ruta)} --> ${idDe(rol, r.ruta)}`)
      for (const d of r.desde ?? []) {
        if (permitidas.some((p) => p.ruta === d)) lineas.push(`    ${idDe(rol, d)} -->|Ver detalle| ${idDe(rol, r.ruta)}`)
      }
    }
    lineas.push('  end')
    lineas.push(`  LOGIN --> ${idDe(rol, RUTA_INICIAL_POR_ROL[rol])}`)
  }
  return lineas.join('\n')
}

export async function generarMapa() {
  const estructura = await leerEstructura()
  return [INICIO, '', tablaDeRutas(estructura), '', '```mermaid', diagramaDeEstructura(estructura), '```', '', FIN].join(
    '\n',
  )
}

const entre = (texto) => {
  const a = texto.indexOf(INICIO)
  const b = texto.indexOf(FIN)
  if (a < 0 || b < 0) throw new Error(`Faltan las marcas ${INICIO} y ${FIN} en ${DOCUMENTO}`)
  return [a, b + FIN.length]
}

if (process.argv[1] && pathToFileURL(resolve(process.argv[1])).href === import.meta.url) {
  const mapa = await generarMapa()
  const modo = process.argv[2]
  if (!modo) {
    console.log(mapa)
  } else {
    const documento = readFileSync(DOCUMENTO, 'utf8')
    const [a, b] = entre(documento)
    if (modo === '--escribir') {
      writeFileSync(DOCUMENTO, documento.slice(0, a) + mapa + documento.slice(b), 'utf8')
      console.log('Mapa del sitio escrito en docs/usabilidad/arquitectura-de-informacion.md')
    } else if (modo === '--verificar') {
      const igual = documento.slice(a, b) === mapa
      console.log(igual ? 'El mapa del documento coincide con el código.' : 'El mapa del documento está desactualizado: ejecuta --escribir.')
      process.exit(igual ? 0 : 1)
    } else {
      console.error('Uso: node mapa-del-sitio.mjs [--escribir | --verificar]')
      process.exit(2)
    }
  }
}
