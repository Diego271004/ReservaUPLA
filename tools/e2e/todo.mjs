// Ejecuta todas las fases de extremo a extremo en orden (5, 6 y 7), cada una sobre una base recién creada y una API recién
// arrancada: ninguna depende de los datos que dejó otra, y el límite de intentos de login empieza de cero en cada fase.
// Las fechas de los guiones son relativas a hoy (RN-07 no admite fechas pasadas).
//
// Uso (desde tools/e2e):
//   PGPASSWORD="<clave de postgres>" CLAVE_PRUEBA="<clave de los usuarios de prueba>" npm run todo
// Requisitos: PostgreSQL en :5432, los user-secrets de la API configurados, el puerto 5263 (API) y el 5180 (frontend) libres.
// Este guion arranca y detiene la API y el frontend por su cuenta.
import { spawn, spawnSync } from 'node:child_process'
import { dirname, resolve } from 'node:path'
import { fileURLToPath } from 'node:url'
import { API, BASE, RAIZ } from './lib.mjs'

const aqui = dirname(fileURLToPath(import.meta.url))
const FASES = [
  { nombre: 'Fase 5 · entrada de datos (login, ambientes, usuarios, nueva reserva)', guion: 'fase5.mjs' },
  { nombre: 'Fase 6 · validaciones (disponibilidad, aprobar, conflicto, rechazar, cancelar)', guion: 'fase6.mjs' },
  { nombre: 'Fase 7 · ayuda del ambiente y RN-07', guion: 'fase7.mjs' },
]

if (!process.env.PGPASSWORD) {
  console.error('Falta la variable PGPASSWORD (clave de postgres).')
  process.exit(2)
}

const esperar = (ms) => new Promise((resolver) => setTimeout(resolver, ms))
const responde = (url) =>
  fetch(url, { signal: AbortSignal.timeout(2000) }).then(
    () => true,
    () => false,
  )

async function esperarA(url, nombre, intentos = 90) {
  for (let i = 0; i < intentos; i++) {
    if (await responde(url)) return
    await esperar(1000)
  }
  throw new Error(`${nombre} no respondió en ${url}`)
}

const procesos = []
function arrancar(comando, argumentos, carpeta) {
  const hijo = spawn(comando, argumentos, { cwd: carpeta, stdio: 'ignore', shell: process.platform === 'win32', windowsHide: true })
  procesos.push(hijo)
  return hijo
}

function detener(hijo) {
  if (!hijo || hijo.exitCode !== null) return
  if (process.platform === 'win32') spawnSync('taskkill', ['/PID', String(hijo.pid), '/T', '/F'], { stdio: 'ignore' })
  else hijo.kill('SIGTERM')
}

async function arrancarApi() {
  const hijo = arrancar('dotnet', ['run', '--no-build', '--launch-profile', 'http'], resolve(RAIZ, 'backend', 'ReservaUPLA.API'))
  await esperarA(`${API}/api/salud`, 'La API')
  return hijo
}

function recrearBase() {
  const resultado = spawnSync('bash', [resolve(aqui, 'recrear-bd.sh')], { cwd: RAIZ, encoding: 'utf8', env: process.env })
  if (resultado.status !== 0) throw new Error(`No se pudo recrear la base:\n${resultado.stdout}\n${resultado.stderr}`)
  console.log(`   ${resultado.stdout.trim().split('\n').at(-1)}`)
}

function ejecutarGuion(guion) {
  return spawnSync(process.execPath, [resolve(aqui, guion)], { cwd: aqui, stdio: 'inherit', env: process.env }).status === 0
}

let api = null
const resultados = []
const inicio = Date.now()

try {
  if ((await responde(`${API}/api/salud`)) || (await responde(BASE))) {
    throw new Error('Ya hay algo escuchando en la API (:5263) o en el frontend (:5180). Deténlos: este guion los arranca solo.')
  }
  console.log(`Compilando la API una vez…`)
  const compilacion = spawnSync('dotnet', ['build', '--nologo', '-v', 'q', resolve(RAIZ, 'backend', 'ReservaUPLA.API')], { encoding: 'utf8', shell: process.platform === 'win32' })
  if (compilacion.status !== 0) throw new Error(`dotnet build falló:\n${compilacion.stdout}`)
  arrancar('npx', ['vite'], resolve(RAIZ, 'frontend'))
  await esperarA(BASE, 'El frontend')

  for (const fase of FASES) {
    console.log(`\n${'='.repeat(100)}\n${fase.nombre}\n${'='.repeat(100)}`)
    detener(api)
    await esperar(1500)
    console.log('   recreando la base con los scripts de database/ y reiniciando la API…')
    recrearBase()
    api = await arrancarApi()
    const correcta = ejecutarGuion(fase.guion)
    resultados.push({ fase: fase.nombre, correcta })
  }
} catch (error) {
  console.error(`\nFALLO DEL ORQUESTADOR: ${error.message}`)
  resultados.push({ fase: 'orquestador', correcta: false })
} finally {
  detener(api)
  procesos.forEach(detener)
}

console.log(`\n${'='.repeat(100)}\nRESUMEN (${Math.round((Date.now() - inicio) / 1000)} s, ${new Date().toISOString().slice(0, 10)})\n${'='.repeat(100)}`)
for (const { fase, correcta } of resultados) console.log(`  ${correcta ? 'OK   ' : 'FALLO'}  ${fase}`)
const todoBien = resultados.length === FASES.length && resultados.every((r) => r.correcta)
console.log(`\nResultado general: ${todoBien ? 'todo correcto' : 'CON FALLOS'}`)
process.exit(todoBien ? 0 : 1)
