import { existsSync, mkdirSync, readFileSync } from 'node:fs'
import { createServer } from 'node:http'
import { extname, join, resolve } from 'node:path'
import { fileURLToPath } from 'node:url'
import { chromium } from 'playwright-core'

const aqui = resolve(fileURLToPath(import.meta.url), '..')
const RAIZ = resolve(aqui, '../..')
const DIST = resolve(RAIZ, 'frontend/dist')
const DESTINO = resolve(RAIZ, 'docs/evidencias/pulido')
mkdirSync(DESTINO, { recursive: true })

const NAVEGADORES = [
  'C:\\Program Files (x86)\\Microsoft\\Edge\\Application\\msedge.exe',
  'C:\\Program Files\\Microsoft\\Edge\\Application\\msedge.exe',
  'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe',
  '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome',
  '/Applications/Microsoft Edge.app/Contents/MacOS/Microsoft Edge',
  '/usr/bin/google-chrome',
  '/usr/bin/chromium',
]

const ejecutable = NAVEGADORES.find((p) => existsSync(p))
if (!ejecutable) {
  console.error('No se encontró Chrome ni Edge')
  process.exit(1)
}

const MIME_TYPES = {
  '.html': 'text/html',
  '.js': 'application/javascript',
  '.css': 'text/css',
  '.json': 'application/json',
  '.webp': 'image/webp',
  '.png': 'image/png',
  '.woff': 'font/woff',
  '.woff2': 'font/woff2',
}

const servidor = createServer((req, res) => {
  let ruta = join(DIST, req.url.split('?')[0])
  if (!existsSync(ruta) || ruta.endsWith('/') || !extname(ruta)) {
    ruta = join(DIST, 'index.html')
  }
  const ext = extname(ruta)
  const mime = MIME_TYPES[ext] || 'application/octet-stream'
  try {
    const contenido = readFileSync(ruta)
    res.writeHead(200, { 'Content-Type': mime })
    res.end(contenido)
  } catch {
    res.writeHead(404)
    res.end()
  }
})

await new Promise((resolver) => servidor.listen(5188, '127.0.0.1', resolver))

const navegador = await chromium.launch({ executablePath: ejecutable, headless: true })

const SESION_ADMIN = JSON.stringify({
  token: 'mock-token-admin',
  usuarioId: 1,
  nombreCompleto: 'Carla Mendoza',
  rol: 'Administrador',
  correo: 'carla.mendoza@upla.edu.pe',
  expiraEn: '2030-01-01T00:00:00Z',
})

const SESION_SOLICITANTE = JSON.stringify({
  token: 'mock-token-sol',
  usuarioId: 2,
  nombreCompleto: 'Ana Torres',
  rol: 'Solicitante',
  correo: 'ana.torres@upla.edu.pe',
  expiraEn: '2030-01-01T00:00:00Z',
})

const DASHBOARD_ADMIN_NORMAL = {
  indicadores: { total: 48, pendientes: 6, aprobadas: 34, rechazadas: 8 },
  pendientesMasAntiguas: { elementos: [], total: 6, pagina: 1, tamano: 5 },
  solicitudesRequierenDecision: [],
  hoyEnLosAmbientes: [],
  ambientesMasUtilizados: [
    { ambienteId: 1, nombre: 'Laboratorio de Cómputo 2', reservasAprobadas: 18 },
  ],
  usoPorAmbiente: [],
}

const DASHBOARD_ADMIN_EMPATE = {
  indicadores: { total: 52, pendientes: 4, aprobadas: 38, rechazadas: 10 },
  pendientesMasAntiguas: { elementos: [], total: 4, pagina: 1, tamano: 5 },
  solicitudesRequierenDecision: [],
  hoyEnLosAmbientes: [],
  ambientesMasUtilizados: [
    { ambienteId: 1, nombre: 'Laboratorio de Cómputo 2', reservasAprobadas: 14 },
    { ambienteId: 2, nombre: 'Auditorio Principal', reservasAprobadas: 14 },
  ],
  usoPorAmbiente: [],
}

const DASHBOARD_SOLICITANTE = {
  inicioSolicitante: {
    proximaReserva: {
      id: 12,
      ambienteNombre: 'Laboratorio de Cómputo 2',
      fecha: '2026-11-20',
      horaInicio: '08:00',
      horaFin: '10:00',
      estado: 'Aprobada',
      motivo: 'Clase Práctica',
    },
    resumenPorEstado: [
      { estado: 'Pendiente', total: 2 },
      { estado: 'Aprobada', total: 5 },
      { estado: 'Rechazada', total: 1 },
      { estado: 'Cancelada', total: 1 },
    ],
    solicitudes: [],
  },
}

async function prepararPagina(sesion, dashboardData, ancho, alto) {
  const contexto = await navegador.newContext({
    viewport: { width: ancho, height: alto },
    locale: 'es-PE',
  })
  await contexto.addInitScript(
    (s) => sessionStorage.setItem('reservaupla.sesion', s),
    sesion,
  )

  await contexto.route('**/api/**', async (route) => {
    const url = route.request().url()
    if (url.includes('/api/dashboard')) {
      return route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify(dashboardData),
      })
    }
    return route.fulfill({ status: 200, body: '{}' })
  })

  const pagina = await contexto.newPage()
  return { pagina, contexto }
}

async function guardarCaptura(pagina, nombre, anchoNum) {
  await pagina.waitForTimeout(250)
  const ruta = resolve(DESTINO, `${nombre}-${anchoNum}.png`)
  await pagina.screenshot({ path: ruta, fullPage: true })
  console.log(`Captura guardada: ${ruta}`)
}

const CONFIGS = [
  { num: 1280, alto: 900 },
  { num: 375, alto: 812 },
]

for (const config of CONFIGS) {
  console.log(`\n=== Procesando capturas Paso 3 (${config.num}px) ===`)

  // 1. Indicadores Admin (4 columnas ancho completo, número 40px)
  {
    const { pagina, contexto } = await prepararPagina(
      SESION_ADMIN,
      DASHBOARD_ADMIN_NORMAL,
      config.num,
      config.alto,
    )
    await pagina.goto('http://127.0.0.1:5188/dashboard')
    await pagina.getByText('Total de reservas').waitFor()
    await guardarCaptura(pagina, 'P3-indicadores-admin', config.num)
    await contexto.close()
  }

  // 2. Ambiente más utilizado con empate (chips sin cortar texto)
  {
    const { pagina, contexto } = await prepararPagina(
      SESION_ADMIN,
      DASHBOARD_ADMIN_EMPATE,
      config.num,
      config.alto,
    )
    await pagina.goto('http://127.0.0.1:5188/dashboard')
    await pagina.getByText(/Empate: 2 ambientes/).waitFor()
    await guardarCaptura(pagina, 'P3-ambiente-mas-usado-empate', config.num)
    await contexto.close()
  }

  // 3. Indicadores Solicitante (ancho completo y números 40px)
  if (config.num === 1280) {
    const { pagina, contexto } = await prepararPagina(
      SESION_SOLICITANTE,
      DASHBOARD_SOLICITANTE,
      config.num,
      config.alto,
    )
    await pagina.goto('http://127.0.0.1:5188/dashboard')
    await pagina.getByText('Tus solicitudes').waitFor()
    const ruta = resolve(DESTINO, 'P3-indicadores-solicitante-responsable-1280.png')
    await pagina.screenshot({ path: ruta, fullPage: true })
    console.log(`Captura guardada: ${ruta}`)
    await contexto.close()
  }
}

await navegador.close()
servidor.close()
console.log('\nCapturas Paso 3 completadas.')

