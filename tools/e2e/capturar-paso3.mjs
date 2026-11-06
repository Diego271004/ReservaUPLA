import { existsSync, mkdirSync, readFileSync } from 'node:fs'
import { createServer } from 'node:http'
import { extname, join, resolve } from 'node:path'
import { fileURLToPath } from 'node:url'
import { chromium } from 'playwright-core'

const aqui = resolve(fileURLToPath(import.meta.url), '..')
const RAIZ = resolve(aqui, '../..')
const DIST = resolve(RAIZ, 'frontend/dist')
const DESTINO = resolve(RAIZ, 'docs/evidencias/experiencia')
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

await new Promise((resolver) => servidor.listen(5187, '127.0.0.1', resolver))
console.log('Servidor estático corriendo en http://127.0.0.1:5187')

const navegador = await chromium.launch({ executablePath: ejecutable, headless: true })

const SESION_ADMIN = JSON.stringify({
  token: 'mock-token',
  usuarioId: 1,
  nombreCompleto: 'Carla Rojas',
  rol: 'Administrador',
  correo: 'carla.rojas@upla.edu.pe',
  expiraEn: '2030-01-01T00:00:00Z',
})

const FECHA_EVENTO_1 = new Date(Date.now() - 3 * 3600 * 1000).toISOString()
const FECHA_EVENTO_2 = new Date(Date.now() - 30 * 60 * 1000).toISOString()

function armarDetalle(id, estado, historialExtra = []) {
  return {
    reserva: {
      id,
      ambienteId: 1,
      ambienteNombre: 'Laboratorio de Cómputo 2',
      usuarioId: 2,
      solicitanteNombre: 'Ana Torres',
      fecha: '2026-11-20',
      horaInicio: '10:00',
      horaFin: '12:00',
      motivo: 'Práctica guiada de Algoritmos y Estructuras de Datos',
      estado,
    },
    historial: [
      {
        id: 1,
        estadoAnterior: null,
        estadoNuevo: 'Pendiente',
        usuarioNombre: 'Ana Torres',
        fecha: FECHA_EVENTO_1,
      },
      ...historialExtra,
    ],
  }
}

const CASOS = {
  pendiente: armarDetalle(10, 'Pendiente'),
  aprobada: armarDetalle(11, 'Aprobada', [
    {
      id: 2,
      estadoAnterior: 'Pendiente',
      estadoNuevo: 'Aprobada',
      usuarioNombre: 'Carla Rojas',
      fecha: FECHA_EVENTO_2,
    },
  ]),
  rechazada: armarDetalle(12, 'Rechazada', [
    {
      id: 2,
      estadoAnterior: 'Pendiente',
      estadoNuevo: 'Rechazada',
      usuarioNombre: 'Carla Rojas',
      fecha: FECHA_EVENTO_2,
    },
  ]),
  cancelada: armarDetalle(13, 'Cancelada', [
    {
      id: 2,
      estadoAnterior: 'Pendiente',
      estadoNuevo: 'Cancelada',
      usuarioNombre: 'Carla Rojas',
      fecha: FECHA_EVENTO_2,
    },
  ]),
  conflicto: armarDetalle(14, 'Pendiente'),
}

const DISPONIBILIDAD_CON_CONFLICTO = {
  fecha: '2026-11-20',
  soloLectura: false,
  ambientes: [
    {
      id: 1,
      nombre: 'Laboratorio de Cómputo 2',
      estado: 'Disponible',
      bloques: [
        {
          id: 12,
          horaInicio: '10:00',
          horaFin: '12:00',
          estado: 'Aprobada',
          solicitanteNombre: 'Carlos Prado',
        },
      ],
    },
  ],
}

const DISPOSITIVOS = [
  { sufijo: 'escritorio', ancho: 1280, alto: 800 },
  { sufijo: 'movil', ancho: 375, alto: 667 },
]

for (const { sufijo, ancho, alto } of DISPOSITIVOS) {
  console.log(`\n=== Procesando Detalle ${sufijo} (${ancho}px) ===`)

  for (const [clave, detalleData] of Object.entries(CASOS)) {
    const nombreArchivo = `D-${clave}-${sufijo}.png`

    const contexto = await navegador.newContext({
      viewport: { width: ancho, height: alto },
      locale: 'es-PE',
    })
    await contexto.addInitScript(
      (s) => sessionStorage.setItem('reservaupla.sesion', s),
      SESION_ADMIN,
    )

    await contexto.route('**/api/**', async (route) => {
      const url = route.request().url()
      if (url.includes('/reservas/disponibilidad-dia')) {
        return route.fulfill({
          status: 200,
          contentType: 'application/json',
          body: JSON.stringify(
            clave === 'conflicto'
              ? DISPONIBILIDAD_CON_CONFLICTO
              : { fecha: '2026-11-20', soloLectura: false, ambientes: [] },
          ),
        })
      }
      if (url.includes('/api/reservas/')) {
        return route.fulfill({
          status: 200,
          contentType: 'application/json',
          body: JSON.stringify(detalleData),
        })
      }
      return route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({}),
      })
    })

    const pagina = await contexto.newPage()
    await pagina.goto(`http://127.0.0.1:5187/reservas/${detalleData.reserva.id}`, {
      waitUntil: 'networkidle',
    })

    await pagina.waitForSelector('h1', { timeout: 5000 })

    const desborda = await pagina.evaluate(
      () => document.documentElement.scrollWidth > window.innerWidth,
    )
    const rutaCompleta = join(DESTINO, nombreArchivo)
    await pagina.screenshot({ path: rutaCompleta, fullPage: true })
    console.log(
      `Capturado: ${nombreArchivo} (${ancho}px) - Desborda: ${desborda ? 'SÍ' : 'NO'}`,
    )

    await contexto.close()
  }
}

await navegador.close()
servidor.close()
console.log('\nTodas las capturas de Detalle de Reserva (D-*) se generaron correctamente.')

