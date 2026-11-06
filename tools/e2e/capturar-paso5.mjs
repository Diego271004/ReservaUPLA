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

await new Promise((resolver) => servidor.listen(5189, '127.0.0.1', resolver))
console.log('Servidor estático corriendo en http://127.0.0.1:5189')

const navegador = await chromium.launch({ executablePath: ejecutable, headless: true })

const SESION_ADMIN = JSON.stringify({
  token: 'mock-token',
  usuarioId: 1,
  nombreCompleto: 'Carla Rojas',
  rol: 'Administrador',
  correo: 'carla.rojas@upla.edu.pe',
  expiraEn: '2030-01-01T00:00:00Z',
})

const AMBIENTES = [
  {
    id: 1,
    nombre: 'Laboratorio de Cómputo 2',
    tipo: 'Laboratorio',
    capacidad: 30,
    ubicacion: 'Pabellón A, piso 2',
    estado: 'Disponible',
    responsableNombre: 'Mario Huamán',
  },
  {
    id: 2,
    nombre: 'Auditorio Principal',
    tipo: 'Auditorio',
    capacidad: 200,
    ubicacion: 'Pabellón B, piso 1',
    estado: 'Disponible',
    responsableNombre: 'Rosa Chávez',
  },
  {
    id: 3,
    nombre: 'Sala de Reuniones A',
    tipo: 'Sala',
    capacidad: 12,
    ubicacion: 'Pabellón A, piso 3',
    estado: 'En mantenimiento',
    responsableNombre: null,
  },
]

const DISPONIBILIDAD_HOY = {
  fecha: '2026-11-05',
  soloLectura: false,
  ambientes: [
    {
      id: 1,
      nombre: 'Laboratorio de Cómputo 2',
      estado: 'Disponible',
      bloques: [
        { id: 1, horaInicio: '10:00', horaFin: '13:00', estado: 'Aprobada' },
      ],
    },
    {
      id: 2,
      nombre: 'Auditorio Principal',
      estado: 'Disponible',
      bloques: [
        { id: 2, horaInicio: '08:00', horaFin: '12:00', estado: 'Aprobada' },
        { id: 3, horaInicio: '14:00', horaFin: '18:00', estado: 'Aprobada' },
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

const USUARIOS = [
  {
    id: 1,
    nombreCompleto: 'Carla Rojas',
    correo: 'carla.rojas@upla.edu.pe',
    rol: 'Administrador',
    activo: true,
  },
  {
    id: 2,
    nombreCompleto: 'Ana Torres',
    correo: 'ana.torres@upla.edu.pe',
    rol: 'Solicitante',
    activo: true,
  },
  {
    id: 3,
    nombreCompleto: 'Mario Huamán',
    correo: 'mario.huaman@upla.edu.pe',
    rol: 'Responsable',
    activo: true,
  },
  {
    id: 4,
    nombreCompleto: 'Rosa Chávez',
    correo: 'rosa.chavez@upla.edu.pe',
    rol: 'Responsable',
    activo: true,
  },
  {
    id: 5,
    nombreCompleto: 'Usuario Inactivo',
    correo: 'inactivo@upla.edu.pe',
    rol: 'Solicitante',
    activo: false,
  },
]

const ESCENARIOS = [
  {
    clave: 'ambientes-tabla',
    ruta: '/ambientes',
    preparar: async (page) => {
      await page.evaluate(() => localStorage.setItem('reservaupla.vistaAmbientes', 'tabla'))
    },
  },
  {
    clave: 'ambientes-tarjetas',
    ruta: '/ambientes',
    preparar: async (page) => {
      await page.evaluate(() => localStorage.setItem('reservaupla.vistaAmbientes', 'tarjetas'))
    },
  },
  {
    clave: 'ambiente-formulario',
    ruta: '/ambientes/nuevo',
    preparar: async () => {},
  },
  {
    clave: 'usuarios-lista',
    ruta: '/usuarios',
    preparar: async () => {},
  },
  {
    clave: 'usuarios-filtrados',
    ruta: '/usuarios',
    preparar: async (page) => {
      await page.waitForSelector('#buscar-usuario')
      await page.fill('#buscar-usuario', 'Responsable')
    },
  },
  {
    clave: 'usuario-formulario',
    ruta: '/usuarios/nuevo',
    preparar: async () => {},
  },
]

const DISPOSITIVOS = [
  { sufijo: 'escritorio', ancho: 1280, alto: 800 },
  { sufijo: 'movil', ancho: 375, alto: 667 },
]

for (const { sufijo, ancho, alto } of DISPOSITIVOS) {
  console.log(`\n=== Procesando Paso 5 ${sufijo} (${ancho}px) ===`)

  for (const esc of ESCENARIOS) {
    const nombreArchivo = `A-${esc.clave}-${sufijo}.png`

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
      if (url.includes('/api/ambientes')) {
        return route.fulfill({
          status: 200,
          contentType: 'application/json',
          body: JSON.stringify(AMBIENTES),
        })
      }
      if (url.includes('/api/usuarios')) {
        return route.fulfill({
          status: 200,
          contentType: 'application/json',
          body: JSON.stringify(USUARIOS),
        })
      }
      if (url.includes('/api/reservas/disponibilidad-dia')) {
        return route.fulfill({
          status: 200,
          contentType: 'application/json',
          body: JSON.stringify(DISPONIBILIDAD_HOY),
        })
      }
      return route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({}),
      })
    })

    const pagina = await contexto.newPage()
    await pagina.goto(`http://127.0.0.1:5189${esc.ruta}`, { waitUntil: 'networkidle' })

    await esc.preparar(pagina)
    await pagina.waitForTimeout(200)

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
console.log('\nCapturas de Paso 5 completadas con éxito.')

