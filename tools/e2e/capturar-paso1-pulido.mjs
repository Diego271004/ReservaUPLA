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

await new Promise((resolver) => servidor.listen(5186, '127.0.0.1', resolver))

const navegador = await chromium.launch({ executablePath: ejecutable, headless: true })

const SESION = JSON.stringify({
  token: 'mock-token',
  usuarioId: 2,
  nombreCompleto: 'Ana Torres',
  rol: 'Solicitante',
  correo: 'ana.torres@upla.edu.pe',
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
  },
  {
    id: 2,
    nombre: 'Auditorio Principal',
    tipo: 'Auditorio',
    capacidad: 200,
    ubicacion: 'Pabellón B, piso 1',
    estado: 'Disponible',
  },
  {
    id: 3,
    nombre: 'Sala de Reuniones A',
    tipo: 'Sala',
    capacidad: 12,
    ubicacion: 'Pabellón A, piso 3',
    estado: 'En mantenimiento',
  },
]

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
    if (url.includes('/api/ambientes')) {
      return route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify(AMBIENTES),
      })
    }
    if (url.includes('/reservas/disponibilidad')) {
      return route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({
          disponible: true,
          mensaje: 'Disponible: no hay reservas aprobadas en ese horario',
        }),
      })
    }
    return route.fulfill({ status: 200, body: '{}' })
  })

  const pagina = await contexto.newPage()
  return { pagina, contexto }
}

async function guardarCaptura(pagina, nombre, anchoNum) {
  await pagina.waitForTimeout(200)
  const ruta = resolve(DESTINO, `${nombre}-${anchoNum}.png`)
  await pagina.screenshot({ path: ruta, fullPage: true })
  console.log(`Captura guardada: ${ruta}`)
}

const CONFIGS = [
  { num: 1280, alto: 900 },
  { num: 375, alto: 812 },
]

for (const config of CONFIGS) {
  console.log(`\n=== Procesando capturas Paso 1 (${config.num}px) ===`)

  // 1. Resumen vivo vacío
  {
    const { pagina, contexto } = await prepararPagina(config.num, config.alto)
    await pagina.goto('http://127.0.0.1:5186/reservas/nueva')
    await pagina.getByRole('radio', { name: /Laboratorio de Cómputo 2/ }).waitFor()
    await guardarCaptura(pagina, 'P1-resumen-vivo-vacio', config.num)
    await contexto.close()
  }

  // 2. Tarjeta ambiente seleccionada
  {
    const { pagina, contexto } = await prepararPagina(config.num, config.alto)
    await pagina.goto('http://127.0.0.1:5186/reservas/nueva')
    const radio = pagina.getByRole('radio', { name: /Laboratorio de Cómputo 2/ })
    await radio.waitFor()
    await radio.click()
    await guardarCaptura(pagina, 'P1-tarjeta-ambiente-seleccionada', config.num)
    await contexto.close()
  }

  // 3. Atajos de duración
  {
    const { pagina, contexto } = await prepararPagina(config.num, config.alto)
    await pagina.goto('http://127.0.0.1:5186/reservas/nueva')
    await pagina.getByRole('radio', { name: /Laboratorio de Cómputo 2/ }).click()
    await pagina.getByLabel('Hora de inicio').selectOption('10:00')
    const atajo2h = pagina.getByRole('button', { name: '2 h' })
    await atajo2h.click()
    await guardarCaptura(pagina, 'P1-atajos-duracion', config.num)
    await contexto.close()
  }

  // 4. Resumen vivo elegido
  {
    const { pagina, contexto } = await prepararPagina(config.num, config.alto)
    await pagina.goto('http://127.0.0.1:5186/reservas/nueva')
    await pagina.getByRole('radio', { name: /Laboratorio de Cómputo 2/ }).click()
    await pagina.getByLabel('Fecha').fill('')
    await pagina.getByLabel('Fecha').pressSequentially('20112026')
    await pagina.getByLabel('Hora de inicio').selectOption('14:00')
    const atajo2h = pagina.getByRole('button', { name: '2 h' })
    await atajo2h.click()
    await pagina.getByLabel('Motivo').fill('Práctica calificada de laboratorio')
    await guardarCaptura(pagina, 'P1-resumen-vivo-elegido', config.num)
    await contexto.close()
  }
}

await navegador.close()
servidor.close()
console.log('\nCapturas Paso 1 completadas.')

