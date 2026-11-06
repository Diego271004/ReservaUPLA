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

await new Promise((resolver) => servidor.listen(5188, '127.0.0.1', resolver))
console.log('Servidor estático corriendo en http://127.0.0.1:5188')

const navegador = await chromium.launch({ executablePath: ejecutable, headless: true })

const SESION_ADMIN = JSON.stringify({
  token: 'mock-token',
  usuarioId: 1,
  nombreCompleto: 'Carla Rojas',
  rol: 'Administrador',
  correo: 'carla.rojas@upla.edu.pe',
  expiraEn: '2030-01-01T00:00:00Z',
})

const SESION_SOLICITANTE = JSON.stringify({
  token: 'mock-token',
  usuarioId: 2,
  nombreCompleto: 'Ana Torres',
  rol: 'Solicitante',
  correo: 'ana.torres@upla.edu.pe',
  expiraEn: '2030-01-01T00:00:00Z',
})

const SESION_RESPONSABLE = JSON.stringify({
  token: 'mock-token',
  usuarioId: 3,
  nombreCompleto: 'Carlos Prado',
  rol: 'Responsable',
  correo: 'carlos.prado@upla.edu.pe',
  expiraEn: '2030-01-01T00:00:00Z',
})

const DASHBOARD_ADMIN = {
  indicadores: { total: 48, pendientes: 2, aprobadas: 31, rechazadas: 10 },
  ambientesMasUtilizados: [
    { ambienteId: 1, nombre: 'Laboratorio de Cómputo 2', reservasAprobadas: 14 },
  ],
  pendientesMasAntiguas: {
    elementos: [
      {
        id: 7,
        ambienteId: 1,
        ambienteNombre: 'Laboratorio de Cómputo 2',
        solicitanteNombre: 'Ana Torres',
        fecha: '2026-11-20',
        horaInicio: '10:00',
        horaFin: '12:00',
        motivo: 'Práctica guiada',
        estado: 'Pendiente',
      },
    ],
    total: 2,
    pagina: 1,
    tamano: 5,
  },
  solicitudesRequierenDecision: [
    {
      reserva: {
        id: 7,
        ambienteId: 1,
        ambienteNombre: 'Laboratorio de Cómputo 2',
        solicitanteNombre: 'Ana Torres',
        fecha: '2026-11-20',
        horaInicio: '10:00',
        horaFin: '12:00',
        motivo: 'Práctica guiada',
        estado: 'Pendiente',
      },
      choqueAprobada: false,
      ambienteEnMantenimiento: false,
    },
  ],
  hoyEnLosAmbientes: [
    {
      id: 1,
      nombre: 'Laboratorio de Cómputo 2',
      estado: 'Disponible',
      reservas: [
        {
          id: 44,
          horaInicio: '10:00',
          horaFin: '12:00',
          solicitanteNombre: 'Ana Torres',
        },
      ],
    },
  ],
  usoPorAmbiente: [
    { ambienteId: 1, nombre: 'Laboratorio de Cómputo 2', reservasAprobadas: 14 },
  ],
}

const DASHBOARD_SOLICITANTE_CON_RESERVAS = {
  inicioSolicitante: {
    proximaReserva: {
      id: 21,
      ambienteId: 1,
      ambienteNombre: 'Laboratorio de Cómputo 2',
      fecha: '2026-11-20',
      horaInicio: '10:00',
      horaFin: '12:00',
      motivo: 'Práctica de Programación Avanzada',
      estado: 'Aprobada',
    },
    solicitudes: [
      {
        id: 21,
        ambienteId: 1,
        ambienteNombre: 'Laboratorio de Cómputo 2',
        fecha: '2026-11-20',
        horaInicio: '10:00',
        horaFin: '12:00',
        estado: 'Aprobada',
      },
      {
        id: 22,
        ambienteId: 2,
        ambienteNombre: 'Auditorio Principal',
        fecha: '2026-11-25',
        horaInicio: '14:00',
        horaFin: '16:00',
        estado: 'Pendiente',
      },
    ],
    resumenPorEstado: [
      { estado: 'Pendiente', total: 1 },
      { estado: 'Aprobada', total: 2 },
      { estado: 'Rechazada', total: 0 },
      { estado: 'Cancelada', total: 1 },
    ],
  },
}

const DASHBOARD_SOLICITANTE_VACIO = {
  inicioSolicitante: {
    proximaReserva: null,
    solicitudes: [],
    resumenPorEstado: [
      { estado: 'Pendiente', total: 0 },
      { estado: 'Aprobada', total: 0 },
      { estado: 'Rechazada', total: 0 },
      { estado: 'Cancelada', total: 0 },
    ],
  },
}

const DASHBOARD_RESPONSABLE_CON_RESERVAS = {
  inicioResponsable: {
    ambientes: [
      {
        id: 1,
        nombre: 'Laboratorio de Cómputo 2',
        ubicacion: 'Pabellón A, piso 2',
        capacidad: 30,
        estado: 'Disponible',
      },
    ],
    hoy: [
      {
        id: 31,
        ambienteId: 1,
        ambienteNombre: 'Laboratorio de Cómputo 2',
        solicitanteNombre: 'Ana Torres',
        fecha: '2026-11-05',
        horaInicio: '09:00',
        horaFin: '11:00',
        estado: 'Aprobada',
      },
      {
        id: 32,
        ambienteId: 1,
        ambienteNombre: 'Laboratorio de Cómputo 2',
        solicitanteNombre: 'Luis Quispe',
        fecha: '2026-11-05',
        horaInicio: '14:00',
        horaFin: '16:00',
        estado: 'Pendiente',
      },
    ],
    proximas: [
      {
        id: 33,
        ambienteId: 1,
        ambienteNombre: 'Laboratorio de Cómputo 2',
        solicitanteNombre: 'María Silva',
        fecha: '2026-11-12',
        horaInicio: '10:00',
        horaFin: '12:00',
        estado: 'Aprobada',
      },
    ],
  },
}

const DASHBOARD_RESPONSABLE_VACIO = {
  inicioResponsable: {
    ambientes: [
      {
        id: 1,
        nombre: 'Laboratorio de Cómputo 2',
        ubicacion: 'Pabellón A, piso 2',
        capacidad: 30,
        estado: 'Disponible',
      },
    ],
    hoy: [],
    proximas: [],
  },
}

const CASOS = [
  { clave: 'admin', sesion: SESION_ADMIN, datos: DASHBOARD_ADMIN, estado: 'ok' },
  {
    clave: 'solicitante-con-reservas',
    sesion: SESION_SOLICITANTE,
    datos: DASHBOARD_SOLICITANTE_CON_RESERVAS,
    estado: 'ok',
  },
  {
    clave: 'solicitante-vacio',
    sesion: SESION_SOLICITANTE,
    datos: DASHBOARD_SOLICITANTE_VACIO,
    estado: 'ok',
  },
  {
    clave: 'responsable-con-reservas',
    sesion: SESION_RESPONSABLE,
    datos: DASHBOARD_RESPONSABLE_CON_RESERVAS,
    estado: 'ok',
  },
  {
    clave: 'responsable-vacio',
    sesion: SESION_RESPONSABLE,
    datos: DASHBOARD_RESPONSABLE_VACIO,
    estado: 'ok',
  },
  { clave: 'carga', sesion: SESION_SOLICITANTE, datos: null, estado: 'carga' },
  { clave: 'error', sesion: SESION_SOLICITANTE, datos: null, estado: 'error' },
]

const DISPOSITIVOS = [
  { sufijo: 'escritorio', ancho: 1280, alto: 800 },
  { sufijo: 'movil', ancho: 375, alto: 667 },
]

for (const { sufijo, ancho, alto } of DISPOSITIVOS) {
  console.log(`\n=== Procesando Inicio ${sufijo} (${ancho}px) ===`)

  for (const caso of CASOS) {
    const nombreArchivo = `I-${caso.clave}-${sufijo}.png`

    const contexto = await navegador.newContext({
      viewport: { width: ancho, height: alto },
      locale: 'es-PE',
    })
    await contexto.addInitScript(
      (s) => sessionStorage.setItem('reservaupla.sesion', s),
      caso.sesion,
    )

    await contexto.route('**/api/**', async (route) => {
      const url = route.request().url()
      if (url.includes('/api/dashboard')) {
        if (caso.estado === 'carga') {
          // No responder para capturar el esqueleto
          return new Promise(() => {})
        }
        if (caso.estado === 'error') {
          return route.fulfill({
            status: 500,
            contentType: 'application/json',
            body: JSON.stringify({ mensaje: 'No se pudo cargar el inicio.' }),
          })
        }
        return route.fulfill({
          status: 200,
          contentType: 'application/json',
          body: JSON.stringify(caso.datos),
        })
      }
      return route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({}),
      })
    })

    const pagina = await contexto.newPage()
    if (caso.estado === 'carga') {
      await pagina.goto('http://127.0.0.1:5188/dashboard', { waitUntil: 'domcontentloaded' })
      await pagina.waitForSelector('[aria-busy="true"]', { timeout: 3000 })
    } else {
      await pagina.goto('http://127.0.0.1:5188/dashboard', { waitUntil: 'networkidle' })
      await pagina.waitForSelector('h1', { timeout: 5000 })
    }

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
console.log('\nCapturas de Paso 4 completadas con éxito.')

