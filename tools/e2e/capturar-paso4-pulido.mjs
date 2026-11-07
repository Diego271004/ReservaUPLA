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

await new Promise((resolver) => servidor.listen(5189, '127.0.0.1', resolver))

const navegador = await chromium.launch({ executablePath: ejecutable, headless: true })

const SESION_ADMIN = JSON.stringify({
  token: 'mock-token-admin',
  usuarioId: 1,
  nombreCompleto: 'Carla Mendoza',
  rol: 'Administrador',
  correo: 'carla.mendoza@upla.edu.pe',
  expiraEn: '2030-01-01T00:00:00Z',
})

const RESERVA_MOCK = {
  id: 1,
  reservaId: 1,
  codigoReserva: 'RES-2026-001',
  ambienteId: 1,
  ambienteNombre: 'Laboratorio de Cómputo 2',
  solicitanteId: 2,
  solicitanteNombre: 'Ana Torres',
  solicitanteCorreo: 'ana.torres@upla.edu.pe',
  fecha: '2026-11-20',
  horaInicio: '09:00',
  horaFin: '11:00',
  motivo: 'Clase magistral de Programación Concurrente y Distribuida',
  estado: 'Pendiente',
  creadoEn: '2026-11-06T10:00:00Z',
}

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

async function capturar() {
  const contexto = await navegador.newContext({
    viewport: { width: 1280, height: 800 },
    locale: 'es-PE',
    timezoneId: 'America/Lima',
  })

  const pagina = await contexto.newPage()

  await pagina.route('**/api/**', async (route) => {
    const url = route.request().url()
    if (url.includes('/api/paneles/administrador')) {
      return route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify(DASHBOARD_ADMIN_NORMAL),
      })
    }
    if (url.includes('/api/reservas/1')) {
      return route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({ reserva: RESERVA_MOCK, historial: [] }),
      })
    }
    if (url.includes('/api/reservas/disponibilidad')) {
      return route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({
          fecha: '2026-11-20',
          ambientes: [
            { id: 1, nombre: 'Laboratorio de Cómputo 2', bloques: [] },
          ],
        }),
      })
    }
    if (url.includes('/api/reservas')) {
      return route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({
          elementos: [RESERVA_MOCK],
          total: 1,
          pagina: 1,
          tamano: 10,
        }),
      })
    }
    return route.fulfill({
      status: 200,
      contentType: 'application/json',
      body: JSON.stringify([]),
    })
  })

  await contexto.addInitScript((sesion) => {
    sessionStorage.setItem('reservaupla.sesion', sesion)
  }, SESION_ADMIN)

  // 1. P4-menu-secciones-1280.png
  await pagina.setViewportSize({ width: 1280, height: 800 })
  await pagina.goto('http://127.0.0.1:5189/dashboard')
  await pagina.waitForSelector('aside')
  await pagina.waitForTimeout(400)
  await pagina.screenshot({
    path: join(DESTINO, 'P4-menu-secciones-1280.png'),
    fullPage: false,
  })
  console.log('Generada: P4-menu-secciones-1280.png')

  // 2. P4-topbar-miga-1280.png
  await pagina.goto('http://127.0.0.1:5189/reservas/1')
  await pagina.waitForSelector('header')
  await pagina.waitForTimeout(500)
  await pagina.screenshot({
    path: join(DESTINO, 'P4-topbar-miga-1280.png'),
    fullPage: false,
  })
  console.log('Generada: P4-topbar-miga-1280.png')

  // 3. P4-topbar-miga-375.png
  await pagina.setViewportSize({ width: 375, height: 667 })
  await pagina.waitForTimeout(300)
  await pagina.screenshot({
    path: join(DESTINO, 'P4-topbar-miga-375.png'),
    fullPage: false,
  })
  console.log('Generada: P4-topbar-miga-375.png')

  // 4. P4-topbar-seccion-188.png
  await pagina.setViewportSize({ width: 188, height: 400 })
  await pagina.waitForTimeout(300)
  await pagina.screenshot({
    path: join(DESTINO, 'P4-topbar-seccion-188.png'),
    fullPage: false,
  })
  console.log('Generada: P4-topbar-seccion-188.png')

  // 5. P4-microinteracciones-hover-1280.png
  await pagina.setViewportSize({ width: 1280, height: 800 })
  await pagina.goto('http://127.0.0.1:5189/reservas')
  await pagina.waitForSelector('table tbody tr')
  await pagina.hover('table tbody tr:first-child')
  await pagina.waitForTimeout(300)
  await pagina.screenshot({
    path: join(DESTINO, 'P4-microinteracciones-hover-1280.png'),
    fullPage: false,
  })
  console.log('Generada: P4-microinteracciones-hover-1280.png')

  await contexto.close()
  await navegador.close()
  servidor.close()
}

capturar().catch((err) => {
  console.error(err)
  process.exit(1)
})
