// Capturas del informe con el sistema en marcha (frontend en :5180, API en :5263 y la base cargada con database/07_datos_demo.sql).
// Uso: node capturas.mjs   → escribe docs/evidencias/informe/*.png. Necesita Edge o Chrome y los usuarios de prueba del README.
import { existsSync, mkdirSync } from 'node:fs'
import path from 'node:path'
import { fileURLToPath } from 'node:url'
import { createRequire } from 'node:module'

const aqui = path.dirname(fileURLToPath(import.meta.url))
const RAIZ = path.resolve(aqui, '..', '..')
const SALIDA = path.join(RAIZ, 'docs', 'evidencias', 'informe')
mkdirSync(SALIDA, { recursive: true })
const { chromium } = createRequire(path.join(RAIZ, 'tools', 'e2e') + path.sep)('playwright-core')

const BASE = process.env.E2E_BASE_URL ?? 'http://localhost:5180'
const CLAVE = process.env.CLAVE_PRUEBA ?? 'Prueba#2026Upla'
const NAVEGADORES = [
  'C:\\Program Files (x86)\\Microsoft\\Edge\\Application\\msedge.exe',
  'C:\\Program Files\\Microsoft\\Edge\\Application\\msedge.exe',
  'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe',
]
const ejecutable = NAVEGADORES.find((r) => existsSync(r))
if (!ejecutable) throw new Error('No se encontró Edge ni Chrome')

const CORREOS = { admin: 'carla.rojas', solicitante: 'ana.torres', responsable: 'mario.huaman' }
const sesiones = {}
for (const [rol, usuario] of Object.entries(CORREOS)) {
  const resp = await fetch(`${BASE}/api/auth/login`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ correo: `${usuario}@upla.edu.pe`, contrasena: CLAVE }),
  })
  if (!resp.ok) throw new Error(`No se pudo iniciar sesión como ${rol} (${resp.status}). El límite es de 5 intentos por minuto.`)
  sesiones[rol] = { ...(await resp.json()), correo: `${usuario}@upla.edu.pe` }
}
const api = async (rol, ruta) =>
  (await fetch(`${BASE}/api${ruta}`, { headers: { Authorization: `Bearer ${sesiones[rol].token}` } })).json()

const navegador = await chromium.launch({ executablePath: ejecutable, headless: true })
const hechas = []
const fallidas = []

async function contexto({ rol = null, ancho = 1280, alto = 800, oscuro = false }) {
  const ctx = await navegador.newContext({ viewport: { width: ancho, height: alto }, locale: 'es-PE', timezoneId: 'America/Lima', deviceScaleFactor: 1 })
  await ctx.addInitScript(
    ([sesion, tema]) => {
      if (sesion) sessionStorage.setItem('reservaupla.sesion', sesion)
      if (tema) localStorage.setItem('reservaupla.tema', 'oscuro')
    },
    [rol ? JSON.stringify(sesiones[rol]) : null, oscuro],
  )
  return ctx
}

/** Una captura: abre la pantalla, ejecuta los pasos y guarda el PNG. Si algo falla, lo registra y sigue con la siguiente. */
const SOLO = process.argv.slice(2)
async function capturar(archivo, opciones, pasos) {
  if (SOLO.length && !SOLO.some((n) => archivo.startsWith(n))) return
  const ctx = await contexto(opciones)
  const pagina = await ctx.newPage()
  try {
    await pagina.goto(`${BASE}${opciones.ruta}`, { waitUntil: 'networkidle' })
    await pagina.waitForTimeout(opciones.espera ?? 900)
    await pasos?.(pagina)
    await pagina.waitForTimeout(350)
    await pagina.screenshot({ path: path.join(SALIDA, archivo), clip: opciones.recorte })
    hechas.push(archivo)
  } catch (error) {
    fallidas.push(`${archivo}: ${String(error.message).split('\n')[0]}`)
  } finally {
    await ctx.close()
  }
}

const desplazarA = (pagina, selector) => pagina.locator(selector).first().scrollIntoViewIfNeeded()
const bajar = (pagina, px) => pagina.evaluate((y) => window.scrollTo(0, y), px)

// ---------- Datos reales para los casos (reserva con choque, reserva aprobada para probar el cruce)
const reservas = [
  ...((await api('admin', '/reservas?estado=Pendiente')).elementos ?? []),
  ...((await api('admin', '/reservas?estado=Aprobada')).elementos ?? []),
]
const pendienteConChoque = (await api('admin', '/dashboard')).solicitudesRequierenDecision?.find((s) => s.choqueAprobada)?.reserva
const pendienteSimple = reservas.find((r) => r.estado === 'Pendiente' && r.id !== pendienteConChoque?.id)
const aprobada = reservas.find((r) => r.estado === 'Aprobada' && r.fecha >= new Date(Date.now() - 5 * 3600e3).toISOString().slice(0, 10))
const aFecha = (iso) => iso.split('-').reverse().join('/')

// ---------- Login
await capturar('01-login.png', { ruta: '/login', espera: 3500, recorte: undefined })
await capturar('02-login-oscuro.png', { ruta: '/login', espera: 3500, oscuro: true })
await capturar('03-login-movil.png', { ruta: '/login', ancho: 375, alto: 720, espera: 1500 })
await capturar('04-login-error.png', { ruta: '/login', espera: 3000 }, async (p) => {
  await p.getByLabel('Correo institucional').fill('ana.torres@upla.edu.pe')
  await p.getByLabel('Contraseña').first().fill('clave-equivocada')
  await p.getByRole('button', { name: 'Ingresar' }).click()
  await p.getByRole('alert').first().waitFor()
})

// ---------- Inicio del Administrador
await capturar('05-inicio-admin.png', { rol: 'admin', ruta: '/dashboard', alto: 900 })
await capturar('06-inicio-admin-indicadores.png', { rol: 'admin', ruta: '/dashboard', alto: 900 }, async (p) => {
  await desplazarA(p, '[aria-label="Indicadores de gestión"]')
  await bajar(p, await p.evaluate(() => document.querySelector('[aria-label="Indicadores"]').getBoundingClientRect().top + window.scrollY - 24))
})
await capturar('07-inicio-admin-actividad.png', { rol: 'admin', ruta: '/dashboard', alto: 900 }, async (p) => {
  await bajar(p, await p.evaluate(() => document.querySelector('#actividad-titulo').getBoundingClientRect().top + window.scrollY - 24))
})
await capturar('08-inicio-admin-oscuro.png', { rol: 'admin', ruta: '/dashboard', alto: 900, oscuro: true })
await capturar('09-inicio-solicitante.png', { rol: 'solicitante', ruta: '/dashboard', alto: 900 })
await capturar('10-inicio-responsable.png', { rol: 'responsable', ruta: '/dashboard', alto: 900 })
await capturar('11-inicio-admin-movil.png', { rol: 'admin', ruta: '/dashboard', ancho: 375, alto: 812 })

// ---------- Salida de datos
await capturar('12-reservas.png', { rol: 'admin', ruta: '/reservas', alto: 900 })
await capturar('13-reservas-pendientes.png', { rol: 'admin', ruta: '/reservas?estado=Pendiente', alto: 700 })
await capturar('14-disponibilidad.png', { rol: 'admin', ruta: '/disponibilidad', alto: 700 })
if (pendienteSimple) {
  await capturar('15-detalle-pendiente.png', { rol: 'admin', ruta: `/reservas/${pendienteSimple.id}`, alto: 720 })
}
if (pendienteConChoque) {
  await capturar('16-detalle-con-choque.png', { rol: 'admin', ruta: `/reservas/${pendienteConChoque.id}`, alto: 800 })
  await capturar('17-modal-aprobar.png', { rol: 'admin', ruta: `/reservas/${pendienteConChoque.id}`, alto: 720 }, async (p) => {
    const botonAprobar = p.getByRole('button', { name: /^Aprobar/ })
    if (await botonAprobar.isEnabled()) await botonAprobar.click()
    else await p.getByRole('button', { name: /^Rechazar/ }).click()
    await p.getByRole('dialog').waitFor()
  })
}
await capturar('18-ambientes-tarjetas.png', { rol: 'admin', ruta: '/ambientes', alto: 720 }, async (p) => {
  await p.getByRole('button', { name: /Tarjetas/ }).click()
})
await capturar('19-usuarios.png', { rol: 'admin', ruta: '/usuarios', alto: 700 })

// ---------- Entrada de datos y validaciones
await capturar('20-nueva-reserva.png', { rol: 'solicitante', ruta: '/reservas/nueva', alto: 900 })
await capturar('21-nueva-reserva-errores.png', { rol: 'solicitante', ruta: '/reservas/nueva', alto: 900 }, async (p) => {
  await p.getByRole('button', { name: 'Registrar solicitud' }).click()
  await p.getByText('Selecciona un ambiente.', { exact: false }).first().waitFor()
})
await capturar('22-nueva-reserva-completa.png', { rol: 'solicitante', ruta: '/reservas/nueva', alto: 900 }, async (p) => {
  await p.getByRole('radio', { name: /Auditorio Principal/ }).click()
  await p.getByLabel('Hora de inicio').selectOption('15:00')
  await p.getByRole('button', { name: '2 h' }).click()
  await p.getByLabel('Motivo').fill('Conferencia de bienvenida a los estudiantes de primer ciclo')
})
if (aprobada) {
  await capturar('23-nueva-reserva-ocupado.png', { rol: 'solicitante', ruta: '/reservas/nueva', alto: 900 }, async (p) => {
    await p.getByRole('radio', { name: new RegExp(aprobada.ambienteNombre) }).click()
    await p.getByLabel('Fecha').fill(aFecha(aprobada.fecha))
    await p.getByLabel('Hora de inicio').selectOption(aprobada.horaInicio)
    await p.getByLabel('Hora de fin').selectOption(aprobada.horaFin)
    await p.getByText('ya tiene una reserva aprobada', { exact: false }).first().waitFor()
  })
}
await capturar('24-ambiente-nuevo-errores.png', { rol: 'admin', ruta: '/ambientes/nuevo', alto: 800 }, async (p) => {
  await p.getByLabel('Capacidad').fill('0')
  await p.getByRole('button', { name: 'Registrar ambiente' }).click()
  await p.getByRole('alert').first().waitFor().catch(() => {})
})
await capturar('25-usuario-nuevo-errores.png', { rol: 'admin', ruta: '/usuarios/nuevo', alto: 900 }, async (p) => {
  await p.getByLabel('Nombre completo').fill('X')
  await p.getByLabel('Correo institucional').fill('correo-sin-arroba')
  await p.locator('input[type="password"]').first().fill('corta')
  await p.getByRole('button', { name: 'Registrar usuario' }).click()
  await p.waitForTimeout(500)
})

await navegador.close()
console.log(`Capturas hechas: ${hechas.length}`)
for (const archivo of hechas) console.log(`  ok  ${archivo}`)
if (fallidas.length) {
  console.log(`Fallidas: ${fallidas.length}`)
  for (const f of fallidas) console.log(`  --  ${f}`)
  process.exitCode = 1
}
