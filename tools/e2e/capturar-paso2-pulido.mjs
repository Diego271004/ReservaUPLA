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

await new Promise((resolver) => servidor.listen(5187, '127.0.0.1', resolver))

const navegador = await chromium.launch({ executablePath: ejecutable, headless: true })

const SESION = JSON.stringify({
  token: 'mock-token',
  usuarioId: 1,
  nombreCompleto: 'Admin General',
  rol: 'Administrador',
  correo: 'admin@upla.edu.pe',
  expiraEn: '2030-01-01T00:00:00Z',
})

const hoyIso = new Date().toISOString().slice(0, 10)

const DISPONIBILIDAD_HOY = {
  fecha: hoyIso,
  soloLectura: false,
  ambientes: [
    {
      id: 1,
      nombre: 'Laboratorio de Cómputo 2',
      estado: 'Disponible',
      bloques: [
        {
          id: 1,
          horaInicio: '09:00',
          horaFin: '11:00',
          estado: 'Aprobada',
          solicitanteNombre: 'Ana Torres',
          motivo: 'Clase de Programación',
        },
        {
          id: 2,
          horaInicio: '14:00',
          horaFin: '16:00',
          estado: 'Pendiente',
          solicitanteNombre: 'Carlos Gómez',
          motivo: 'Examen sustitutorio',
        },
      ],
    },
    {
      id: 2,
      nombre: 'Auditorio Principal',
      estado: 'Disponible',
      bloques: [
        {
          id: 3,
          horaInicio: '11:00',
          horaFin: '13:00',
          estado: 'Aprobada',
          solicitanteNombre: 'Decanato',
          motivo: 'Conferencia Magistral',
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

async function prepararPagina(ancho, alto) {
  const contexto = await navegador.newContext({
    viewport: { width: ancho, height: alto },
    locale: 'es-PE',
  })
  await contexto.addInitScript(
    (s) => sessionStorage.setItem('reservaupla.sesion', s),
    SESION,
  )

  await contexto.route('**/api/**', async (route) => {
    const url = route.request().url()
    if (url.includes('/reservas/disponibilidad-dia')) {
      return route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify(DISPONIBILIDAD_HOY),
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
  console.log(`\n=== Procesando capturas Paso 2 (${config.num}px) ===`)

  // 1. Eje de tiempo con etiqueta Ahora en fila propia
  {
    const { pagina, contexto } = await prepararPagina(config.num, config.alto)
    await pagina.goto('http://127.0.0.1:5187/disponibilidad')
    await pagina.getByText('Laboratorio de Cómputo 2').waitFor()
    await guardarCaptura(pagina, 'P2-eje-tiempo-etiqueta-ahora', config.num)
    await contexto.close()
  }

  // 2. Tramos libres con fondo verde suave y horas pasadas sombreadas
  {
    const { pagina, contexto } = await prepararPagina(config.num, config.alto)
    await pagina.goto('http://127.0.0.1:5187/disponibilidad')
    await pagina.getByText('Auditorio Principal').waitFor()
    await guardarCaptura(pagina, 'P2-tramos-libres-y-pasados', config.num)
    await contexto.close()
  }

  // 3. Columna de ambientes ancha (Laboratorio de Cómputo 2 en 2 líneas)
  {
    const { pagina, contexto } = await prepararPagina(config.num, config.alto)
    await pagina.goto('http://127.0.0.1:5187/disponibilidad')
    await pagina.getByText('Sala de Reuniones A').waitFor()
    await guardarCaptura(pagina, 'P2-columna-ambientes', config.num)
    await contexto.close()
  }
}

await navegador.close()
servidor.close()
console.log('\nCapturas Paso 2 completadas.')

