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

await new Promise((resolver) => servidor.listen(5186, '127.0.0.1', resolver))
console.log('Servidor estático corriendo en http://127.0.0.1:5186')

const navegador = await chromium.launch({ executablePath: ejecutable, headless: true })

const SESION = JSON.stringify({
  token: 'mock-token',
  usuarioId: 2,
  nombreCompleto: 'Ana Torres',
  rol: 'Solicitante',
  correo: 'ana.torres@upla.edu.pe',
  expiraEn: '2030-01-01T00:00:00Z',
})

const AMBIENTES_CON_RESERVAS = {
  fecha: '2026-11-20',
  soloLectura: false,
  ambientes: [
    {
      id: 1,
      nombre: 'Laboratorio de Cómputo 2',
      estado: 'Disponible',
      bloques: [
        {
          id: 101,
          horaInicio: '09:00',
          horaFin: '11:00',
          estado: 'Aprobada',
          solicitanteNombre: 'Carlos Prado',
          motivo: 'Clase Sistemas Distribuidos',
        },
      ],
    },
    {
      id: 2,
      nombre: 'Auditorio Principal',
      estado: 'Disponible',
      bloques: [
        {
          id: 102,
          horaInicio: '10:00',
          horaFin: '12:00',
          estado: 'Aprobada',
          solicitanteNombre: 'Beatriz Silva',
          motivo: 'Conferencia de Inteligencia Artificial',
        },
        {
          id: 103,
          horaInicio: '11:30',
          horaFin: '13:30',
          estado: 'Pendiente',
          solicitanteNombre: 'Ana Torres',
          motivo: 'Ensayo General de Graduación',
          propia: true,
        },
      ],
    },
    {
      id: 3,
      nombre: 'Sala de Reuniones A',
      estado: 'En mantenimiento',
      bloques: [],
    },
  ],
}

const AMBIENTES_VACIOS = {
  fecha: '2026-11-20',
  soloLectura: false,
  ambientes: [
    { id: 1, nombre: 'Laboratorio de Cómputo 2', estado: 'Disponible', bloques: [] },
    { id: 2, nombre: 'Auditorio Principal', estado: 'Disponible', bloques: [] },
    { id: 3, nombre: 'Sala de Reuniones A', estado: 'En mantenimiento', bloques: [] },
  ],
}

const AMBIENTES_PASADO = {
  fecha: '2026-11-01',
  soloLectura: true,
  ambientes: [
    {
      id: 1,
      nombre: 'Laboratorio de Cómputo 2',
      estado: 'Disponible',
      bloques: [
        {
          id: 99,
          horaInicio: '10:00',
          horaFin: '12:00',
          estado: 'Aprobada',
          solicitanteNombre: 'Carlos Prado',
        },
      ],
    },
    { id: 2, nombre: 'Auditorio Principal', estado: 'Disponible', bloques: [] },
    { id: 3, nombre: 'Sala de Reuniones A', estado: 'En mantenimiento', bloques: [] },
  ],
}

async function capturarCaso(nombreArchivo, modo, ancho, alto, configuradorRutas) {
  const contexto = await navegador.newContext({
    viewport: { width: ancho, height: alto },
    locale: 'es-PE',
  })
  await contexto.addInitScript(
    (s) => sessionStorage.setItem('reservaupla.sesion', s),
    SESION,
  )

  await contexto.route('**/api/**', async (route) => {
    if (configuradorRutas) {
      const atendida = await configuradorRutas(route)
      if (atendida) return
    }
    return route.fulfill({
      status: 200,
      contentType: 'application/json',
      body: JSON.stringify({}),
    })
  })

  const pagina = await contexto.newPage()
  await pagina.goto('http://127.0.0.1:5186/disponibilidad', { waitUntil: 'networkidle' })

  if (modo === 'carga') {
    // Para carga, ya se renderiza el esqueleto
  } else {
    await pagina.waitForSelector('main', { timeout: 5000 })
  }

  // Comprobar scroll horizontal
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

const DISPOSITIVOS = [
  { sufijo: 'escritorio', ancho: 1280, alto: 800 },
  { sufijo: 'movil', ancho: 375, alto: 667 },
]

for (const { sufijo, ancho, alto } of DISPOSITIVOS) {
  console.log(`\n=== Procesando ${sufijo} (${ancho}px) ===`)

  // 1. Día con reservas
  await capturarCaso(
    `C-con-reservas-${sufijo}.png`,
    'normal',
    ancho,
    alto,
    async (route) => {
      const url = route.request().url()
      if (url.includes('/reservas/disponibilidad-dia')) {
        await route.fulfill({
          status: 200,
          contentType: 'application/json',
          body: JSON.stringify(AMBIENTES_CON_RESERVAS),
        })
        return true
      }
      return false
    },
  )

  // 2. Día vacío
  await capturarCaso(
    `C-vacio-${sufijo}.png`,
    'normal',
    ancho,
    alto,
    async (route) => {
      const url = route.request().url()
      if (url.includes('/reservas/disponibilidad-dia')) {
        await route.fulfill({
          status: 200,
          contentType: 'application/json',
          body: JSON.stringify(AMBIENTES_VACIOS),
        })
        return true
      }
      return false
    },
  )

  // 3. Día pasado
  await capturarCaso(
    `C-pasado-${sufijo}.png`,
    'normal',
    ancho,
    alto,
    async (route) => {
      const url = route.request().url()
      if (url.includes('/reservas/disponibilidad-dia')) {
        await route.fulfill({
          status: 200,
          contentType: 'application/json',
          body: JSON.stringify(AMBIENTES_PASADO),
        })
        return true
      }
      return false
    },
  )

  // 4. Estado de carga
  await capturarCaso(
    `C-carga-${sufijo}.png`,
    'carga',
    ancho,
    alto,
    async (route) => {
      const url = route.request().url()
      if (url.includes('/reservas/disponibilidad-dia')) {
        // No responde inmediatamente para capturar el esqueleto
        await new Promise((r) => setTimeout(r, 60000))
        return true
      }
      return false
    },
  )

  // 5. Error de red con reintentar
  await capturarCaso(
    `C-error-${sufijo}.png`,
    'normal',
    ancho,
    alto,
    async (route) => {
      const url = route.request().url()
      if (url.includes('/reservas/disponibilidad-dia')) {
        await route.fulfill({
          status: 500,
          contentType: 'application/json',
          body: JSON.stringify({ mensaje: 'Error al conectar' }),
        })
        return true
      }
      return false
    },
  )
}

await navegador.close()
servidor.close()
console.log('\nTodas las capturas de Disponibilidad (C-*) se generaron correctamente.')

