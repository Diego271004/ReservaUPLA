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

// Servidor local para frontend/dist
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

await new Promise((resolver) => servidor.listen(5185, '127.0.0.1', resolver))
console.log('Servidor estático corriendo en http://127.0.0.1:5185')

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

const DISPONIBILIDAD_DIA = {
  fecha: '2026-11-20',
  soloLectura: false,
  ambientes: [
    {
      id: 1,
      nombre: 'Laboratorio de Cómputo 2',
      estado: 'Disponible',
      bloques: [
        {
          horaInicio: '10:00',
          horaFin: '12:00',
          estado: 'Aprobada',
          motivo: 'Clase Base de Datos',
        },
      ],
    },
    {
      id: 2,
      nombre: 'Auditorio Principal',
      estado: 'Disponible',
      bloques: [],
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
    const method = route.request().method()

    if (url.includes('/api/ambientes')) {
      return route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify(AMBIENTES),
      })
    }
    if (url.includes('/reservas/disponibilidad-dia')) {
      return route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify(DISPONIBILIDAD_DIA),
      })
    }
    if (url.includes('/reservas/disponibilidad')) {
      const parsedUrl = new URL(url)
      const horaInicio = parsedUrl.searchParams.get('horaInicio')
      const horaFin = parsedUrl.searchParams.get('horaFin')
      if (horaInicio === '10:00' && horaFin === '12:00') {
        return route.fulfill({
          status: 200,
          contentType: 'application/json',
          body: JSON.stringify({
            disponible: false,
            mensaje:
              'Ese ambiente ya tiene una reserva aprobada de 10:00 a 12:00. Elige otro horario u otro ambiente.',
          }),
        })
      }
      return route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({
          disponible: true,
          mensaje: 'Disponible: no hay reservas aprobadas en ese horario',
        }),
      })
    }
    if (url.includes('/api/reservas') && method === 'POST') {
      return route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({
          id: 7,
          ambienteNombre: 'Laboratorio de Cómputo 2',
          fecha: '2026-11-20',
          horaInicio: '14:00',
          horaFin: '16:00',
          estado: 'Pendiente',
        }),
      })
    }
    return route.fulfill({ status: 200, body: '{}' })
  })

  const pagina = await contexto.newPage()
  return { pagina, contexto }
}

async function guardarCaptura(pagina, nombreBase, anchoNom, anchoNum) {
  await pagina.waitForTimeout(180)
  const medida = await pagina.evaluate(() => ({
    scrollW: document.documentElement.scrollWidth,
    clientW: document.documentElement.clientWidth,
  }))
  const desborda = medida.scrollW > medida.clientW
  const ruta1 = resolve(DESTINO, `${nombreBase}-${anchoNom}.png`)
  const ruta2 = resolve(DESTINO, `${nombreBase}-${anchoNum}.png`)
  await pagina.screenshot({ path: ruta1, fullPage: true })
  await pagina.screenshot({ path: ruta2, fullPage: true })
  console.log(
    `Capturado: ${nombreBase}-${anchoNom}.png (${medida.scrollW}px en ${medida.clientW}px) - Desborda: ${desborda ? 'SÍ' : 'NO'}`,
  )
}

const CONFIGS = [
  { nombre: 'escritorio', num: 1280, alto: 900 },
  { nombre: 'movil', num: 375, alto: 812 },
]

for (const config of CONFIGS) {
  console.log(`\n=== Procesando ${config.nombre} (${config.num}px) ===`)

  // 1. Vacío
  {
    const { pagina, contexto } = await prepararPagina(config.num, config.alto)
    await pagina.goto('http://127.0.0.1:5185/reservas/nueva')
    await pagina.getByRole('radio', { name: /Laboratorio de Cómputo 2/ }).waitFor()
    await guardarCaptura(pagina, 'N-vacio', config.nombre, config.num)
    await contexto.close()
  }

  // 2. Ambiente elegido
  {
    const { pagina, contexto } = await prepararPagina(config.num, config.alto)
    await pagina.goto('http://127.0.0.1:5185/reservas/nueva')
    const radio = pagina.getByRole('radio', { name: /Laboratorio de Cómputo 2/ })
    await radio.waitFor()
    await radio.click()
    await pagina.getByText('Disponibilidad del ambiente').waitFor()
    await guardarCaptura(pagina, 'N-ambiente-elegido', config.nombre, config.num)
    await contexto.close()
  }

  // 3. Errores
  {
    const { pagina, contexto } = await prepararPagina(config.num, config.alto)
    await pagina.goto('http://127.0.0.1:5185/reservas/nueva')
    await pagina.getByRole('radio', { name: /Laboratorio de Cómputo 2/ }).waitFor()
    await pagina.getByRole('button', { name: 'Registrar solicitud' }).click()
    await pagina.getByText('Selecciona un ambiente.').waitFor()
    await guardarCaptura(pagina, 'N-errores', config.nombre, config.num)
    await contexto.close()
  }

  // 4. Disponible
  {
    const { pagina, contexto } = await prepararPagina(config.num, config.alto)
    await pagina.goto('http://127.0.0.1:5185/reservas/nueva')
    await pagina.getByRole('radio', { name: /Laboratorio de Cómputo 2/ }).click()
    await pagina.getByLabel('Fecha').fill('')
    await pagina.getByLabel('Fecha').pressSequentially('20112026')
    await pagina.getByLabel('Hora de inicio').selectOption('14:00')
    await pagina.getByLabel('Hora de fin').selectOption('16:00')
    await pagina.getByText('Disponible: no hay reservas aprobadas en ese horario').waitFor()
    await guardarCaptura(pagina, 'N-disponible', config.nombre, config.num)
    await contexto.close()
  }

  // 5. Conflicto
  {
    const { pagina, contexto } = await prepararPagina(config.num, config.alto)
    await pagina.goto('http://127.0.0.1:5185/reservas/nueva')
    await pagina.getByRole('radio', { name: /Laboratorio de Cómputo 2/ }).click()
    await pagina.getByLabel('Fecha').fill('')
    await pagina.getByLabel('Fecha').pressSequentially('20112026')
    await pagina.getByLabel('Hora de inicio').selectOption('10:00')
    await pagina.getByLabel('Hora de fin').selectOption('12:00')
    await pagina.getByText(/Ese ambiente ya tiene una reserva aprobada/).waitFor()
    await guardarCaptura(pagina, 'N-conflicto', config.nombre, config.num)
    await contexto.close()
  }

  // 6. Fecha pasada
  {
    const { pagina, contexto } = await prepararPagina(config.num, config.alto)
    await pagina.goto('http://127.0.0.1:5185/reservas/nueva')
    await pagina.getByRole('radio', { name: /Laboratorio de Cómputo 2/ }).click()
    await pagina.getByLabel('Fecha').fill('')
    await pagina.getByLabel('Fecha').pressSequentially('01012020')
    await pagina.getByRole('button', { name: 'Registrar solicitud' }).click()
    await pagina.getByText('No puedes reservar para una fecha anterior a hoy.').waitFor()
    await guardarCaptura(pagina, 'N-fecha-pasada', config.nombre, config.num)
    await contexto.close()
  }

  // 7. Éxito
  {
    const { pagina, contexto } = await prepararPagina(config.num, config.alto)
    await pagina.goto('http://127.0.0.1:5185/reservas/nueva')
    await pagina.getByRole('radio', { name: /Laboratorio de Cómputo 2/ }).click()
    await pagina.getByLabel('Fecha').fill('')
    await pagina.getByLabel('Fecha').pressSequentially('20112026')
    await pagina.getByLabel('Hora de inicio').selectOption('14:00')
    await pagina.getByLabel('Hora de fin').selectOption('16:00')
    await pagina.getByLabel('Motivo').fill('Práctica calificada de desarrollo de software')
    await pagina.getByRole('button', { name: 'Registrar solicitud' }).click()
    await pagina.getByText('Solicitud registrada. Quedó Pendiente de aprobación.').waitFor()
    await pagina.getByRole('button', { name: 'Ver detalle' }).waitFor()
    await guardarCaptura(pagina, 'N-exito', config.nombre, config.num)
    await contexto.close()
  }
}

await navegador.close()
servidor.close()
console.log('\nTodas las capturas se generaron correctamente.')

