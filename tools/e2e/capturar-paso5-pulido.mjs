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

await new Promise((resolver) => servidor.listen(5190, '127.0.0.1', resolver))

const navegador = await chromium.launch({ executablePath: ejecutable, headless: true })

const SESION_ADMIN = JSON.stringify({
  token: 'mock-token-admin',
  usuarioId: 1,
  nombreCompleto: 'Carla Mendoza',
  rol: 'Administrador',
  correo: 'carla.mendoza@upla.edu.pe',
  expiraEn: '2030-01-01T00:00:00Z',
})

const SESION_RESPONSABLE = JSON.stringify({
  token: 'mock-token-resp',
  usuarioId: 3,
  nombreCompleto: 'Mario Huamán',
  rol: 'Responsable',
  correo: 'mario.huaman@upla.edu.pe',
  expiraEn: '2030-01-01T00:00:00Z',
})

const USUARIOS_MOCK = [
  { id: 1, nombreCompleto: 'Carla Mendoza', correo: 'carla.mendoza@upla.edu.pe', rol: 'Administrador', activo: true },
  { id: 2, nombreCompleto: 'Ana Torres', correo: 'ana.torres@upla.edu.pe', rol: 'Solicitante', activo: true },
]

const AMBIENTES_MOCK = [
  { id: 1, nombre: 'Laboratorio de Cómputo 2', tipo: 'Laboratorio', capacidad: 30, ubicacion: 'Pabellón B, piso 2', estado: 'Disponible' },
]

const MI_AMBIENTE_VACIO = {
  ambiente: { id: 1, nombre: 'Laboratorio de Cómputo 2', tipo: 'Laboratorio', capacidad: 30, ubicacion: 'Pabellón B, piso 2' },
  ambientes: [{ id: 1, nombre: 'Laboratorio de Cómputo 2' }],
  indicadores: { total: 0, pendientes: 0, aprobadas: 0, rechazadas: 0 },
  reservas: { elementos: [], total: 0, pagina: 1, tamano: 10 },
}

async function capturar() {
  // 1. Reservas vacío (1280 y 375 px)
  {
    const contexto = await navegador.newContext({
      viewport: { width: 1280, height: 800 },
      locale: 'es-PE',
      timezoneId: 'America/Lima',
    })
    await contexto.addInitScript((sesion) => {
      sessionStorage.setItem('reservaupla.sesion', sesion)
    }, SESION_ADMIN)

    await contexto.route('**/api/**', async (route) => {
      const url = route.request().url()
      if (url.includes('/api/ambientes')) {
        return route.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify(AMBIENTES_MOCK) })
      }
      if (url.includes('/api/reservas')) {
        return route.fulfill({
          status: 200,
          contentType: 'application/json',
          body: JSON.stringify({ elementos: [], total: 0, pagina: 1, tamano: 10 }),
        })
      }
      return route.fulfill({ status: 200, contentType: 'application/json', body: '[]' })
    })

    const pagina = await contexto.newPage()
    await pagina.goto('http://127.0.0.1:5190/reservas')
    await pagina.waitForSelector('[data-testid="estado-vacio"]')
    await pagina.waitForTimeout(400)
    await pagina.screenshot({
      path: join(DESTINO, 'P5-vacio-reservas-1280.png'),
      fullPage: false,
    })
    console.log('Generada: P5-vacio-reservas-1280.png')

    await pagina.setViewportSize({ width: 375, height: 667 })
    await pagina.waitForTimeout(300)
    await pagina.screenshot({
      path: join(DESTINO, 'P5-vacio-reservas-375.png'),
      fullPage: false,
    })
    console.log('Generada: P5-vacio-reservas-375.png')

    await contexto.close()
  }

  // 2. Usuarios sin resultados de búsqueda (1280 px)
  {
    const contexto = await navegador.newContext({
      viewport: { width: 1280, height: 800 },
      locale: 'es-PE',
      timezoneId: 'America/Lima',
    })
    await contexto.addInitScript((sesion) => {
      sessionStorage.setItem('reservaupla.sesion', sesion)
    }, SESION_ADMIN)

    await contexto.route('**/api/**', async (route) => {
      const url = route.request().url()
      if (url.includes('/api/usuarios')) {
        return route.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify(USUARIOS_MOCK) })
      }
      return route.fulfill({ status: 200, contentType: 'application/json', body: '[]' })
    })

    const pagina = await contexto.newPage()
    await pagina.goto('http://127.0.0.1:5190/usuarios')
    await pagina.waitForSelector('#buscar-usuario')
    const buscador = pagina.locator('#buscar-usuario')
    await buscador.fill('inexistente')
    await pagina.waitForSelector('[data-testid="estado-vacio"]')
    await pagina.waitForTimeout(400)
    await pagina.screenshot({
      path: join(DESTINO, 'P5-vacio-usuarios-1280.png'),
      fullPage: false,
    })
    console.log('Generada: P5-vacio-usuarios-1280.png')

    await contexto.close()
  }

  // 3. Mi ambiente sin reservas hoy (1280 px)
  {
    const contexto = await navegador.newContext({
      viewport: { width: 1280, height: 800 },
      locale: 'es-PE',
      timezoneId: 'America/Lima',
    })
    await contexto.addInitScript((sesion) => {
      sessionStorage.setItem('reservaupla.sesion', sesion)
    }, SESION_RESPONSABLE)

    await contexto.route('**/api/**', async (route) => {
      const url = route.request().url()
      if (url.includes('/api/mi-ambiente')) {
        return route.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify(MI_AMBIENTE_VACIO) })
      }
      return route.fulfill({ status: 200, contentType: 'application/json', body: '[]' })
    })

    const pagina = await contexto.newPage()
    await pagina.goto('http://127.0.0.1:5190/mi-ambiente')
    await pagina.waitForSelector('[data-testid="estado-vacio"]')
    await pagina.waitForTimeout(400)
    await pagina.screenshot({
      path: join(DESTINO, 'P5-vacio-mi-ambiente-1280.png'),
      fullPage: false,
    })
    console.log('Generada: P5-vacio-mi-ambiente-1280.png')

    await contexto.close()
  }

  await navegador.close()
  servidor.close()
}

capturar().catch((err) => {
  console.error(err)
  process.exit(1)
})
