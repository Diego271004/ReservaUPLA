// Cifras del informe. Las que cambian con el código se CALCULAN al generar (git, archivos); las que salen de una
// ejecución (pruebas, accesibilidad) llevan la fecha y el comando de esa ejecución. Nada se copia de memoria.
import { execFileSync } from 'node:child_process'
import { readdirSync, readFileSync, statSync } from 'node:fs'
import path from 'node:path'
import { RAIZ } from './codigo.js'

// ------------------------------------------------------------------ Ejecuciones medidas (fecha y comando)
export const PRUEBAS = {
  frontend: {
    total: 1375,
    archivos: 62,
    fecha: '2026-11-10',
    comando: 'npm --prefix frontend test',
  },
  backendAplicacion: { total: 162, fecha: '2026-11-10', entorno: 'WSL (Ubuntu), sin base de datos', comando: 'dotnet test ReservaUPLA.Application.Tests' },
  backendInfraestructura: { total: 14, fecha: '2026-11-10', entorno: 'WSL con PostgreSQL 18 real', comando: 'dotnet test ReservaUPLA.Infrastructure.Tests' },
  backendApi: {
    total: 60,
    fecha: '2026-11-07',
    entorno: 'Windows, con PostgreSQL real (60 de 60)',
    comando: 'dotnet test backend/ReservaUPLA.sln',
  },
  usabilidad: { total: 24, fecha: '2026-11-10', comando: 'node --test pruebas/*.test.mjs (tools/usabilidad)' },
}

export const ACCESIBILIDAD = {
  fecha: '2026-11-07 16:23',
  comando: '$env:ETAPA="taste"; node tools/usabilidad/accesibilidad.mjs',
  axe: '0 violaciones en 87 estados (43 a 1280 px y 44 a 375 px)',
  contraste: '0 pares por debajo del umbral AA',
  objetivos: '0 objetivos táctiles menores de 44 px (44 estados móviles)',
  foco: '0 paradas de teclado sin foco visible',
  zoom: '0 de 30 combinaciones con desplazamiento horizontal a 188 px (zoom 200 %)',
  movimiento: '0 animaciones infinitas con prefers-reduced-motion',
}

export const E2E = { fecha: '2026-11-07 16:33', fases: '9 de 9', comando: 'npm run todo (tools/e2e)' }
export const BUILD = { fecha: '2026-11-10', js: '130,02 kB', css: '15,79 kB', comando: 'npm --prefix frontend run build (tamaños gzip)' }
export const DUPLICACION = { antes: '1,38 %', despues: '0,93 %', herramienta: 'jscpd 4.0.5, perfil de 4 líneas y 30 tokens' }

export const CUENTAS = [
  ['Administrador', 'carla.rojas@upla.edu.pe', 'Carla Rojas'],
  ['Solicitante', 'ana.torres@upla.edu.pe', 'Ana Torres'],
  ['Responsable de ambiente', 'mario.huaman@upla.edu.pe', 'Mario Huamán'],
]

// ------------------------------------------------------------------ Calculadas al generar
const git = (...args) => execFileSync('git', args, { cwd: RAIZ, encoding: 'utf8' }).trim()

export function estadisticasDeGit() {
  const mensajes = git('log', '--format=%s').split('\n').filter(Boolean)
  const tipos = {}
  for (const m of mensajes) {
    const tipo = m.match(/^(\w+):/)?.[1]
    if (tipo) tipos[tipo] = (tipos[tipo] ?? 0) + 1
  }
  return {
    commits: mensajes.length,
    tipos,
    ramas: git('branch', '--format=%(refname:short)').split('\n').filter(Boolean),
    ramaActual: git('branch', '--show-current'),
    ultimo: git('log', '-1', '--format=%h %s'),
  }
}

function archivos(carpeta, filtro) {
  return readdirSync(carpeta).flatMap((nombre) => {
    if (['node_modules', 'bin', 'obj', 'dist', 'assets'].includes(nombre)) return []
    const ruta = path.join(carpeta, nombre)
    return statSync(ruta).isDirectory() ? archivos(ruta, filtro) : filtro(ruta) ? [ruta] : []
  })
}

/** Cuántos archivos de producción de frontend/src (sin pruebas) importan cada componente: la reutilización medida. */
export function usoDeComponentes(nombres) {
  const src = path.join(RAIZ, 'frontend', 'src')
  const fuentes = archivos(src, (r) => /\.(jsx|js)$/.test(r) && !/\.test\./.test(r))
  const textos = fuentes.map((r) => ({ r: path.relative(src, r).replaceAll('\\', '/'), t: readFileSync(r, 'utf8') }))
  return nombres.map((nombre) => {
    const importan = textos.filter(({ t }) => new RegExp(`import\\s+${nombre}\\s+from\\s+'[^']*${nombre}\\.jsx'`).test(t))
    return { nombre, archivos: importan.length, ejemplos: importan.slice(0, 3).map(({ r }) => r) }
  })
}

export function tamanoDelCodigo() {
  const src = path.join(RAIZ, 'frontend', 'src')
  const contar = (rutas) =>
    rutas
      .map((r) => ({
        r: path.relative(RAIZ, r).replaceAll(path.sep, '/'),
        n: readFileSync(r, 'utf8').split(/\r?\n/).length,
      }))
      .sort((a, b) => b.n - a.n)
  const codigo = contar(archivos(src, (r) => /\.(jsx|js)$/.test(r) && !/\.test\./.test(r)))
  const estilos = contar(archivos(src, (r) => r.endsWith('.css')))
  const cs = contar(archivos(path.join(RAIZ, 'backend'), (r) => r.endsWith('.cs') && !/Tests/.test(r)))
  return {
    archivosFrontend: codigo.length + estilos.length,
    archivosBackend: cs.length,
    masLargoJs: codigo[0],
    masLargoCs: cs[0],
    masLargoCss: estilos[0],
    pruebasFrontend: archivos(src, (r) => /\.test\.(jsx|js)$/.test(r)).length,
  }
}
