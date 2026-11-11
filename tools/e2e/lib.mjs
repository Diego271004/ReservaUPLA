// Utilidades comunes de las pruebas de extremo a extremo. Las claves llegan por variables de entorno.
import { existsSync, mkdirSync } from 'node:fs'
import { dirname, resolve, sep } from 'node:path'
import { fileURLToPath } from 'node:url'
import { chromium } from 'playwright-core'

const aqui = dirname(fileURLToPath(import.meta.url))
export const RAIZ = resolve(aqui, '../..')
export const BASE = process.env.E2E_BASE_URL ?? 'http://localhost:5180'
export const API = process.env.E2E_API_URL ?? 'http://localhost:5263'
export const CLAVE = process.env.CLAVE_PRUEBA
export const CLAVE_ADMIN = process.env.CLAVE_ADMIN ?? CLAVE
export const ANCHOS = { escritorio: { width: 1280, height: 900 }, movil: { width: 375, height: 812 } }

if (!CLAVE) {
  console.error('Falta la variable de entorno CLAVE_PRUEBA (la contraseña de los usuarios de prueba).')
  process.exit(2)
}

const NAVEGADORES = [
  'C:\\Program Files (x86)\\Microsoft\\Edge\\Application\\msedge.exe',
  'C:\\Program Files\\Microsoft\\Edge\\Application\\msedge.exe',
  'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe',
  '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome',
  '/Applications/Microsoft Edge.app/Contents/MacOS/Microsoft Edge',
  '/usr/bin/google-chrome',
  '/usr/bin/chromium',
]

export const paso = (texto) => console.log(`\n== ${texto}`)
export const ok = (texto) => console.log(`   OK  ${texto}`)

export const CARPETA_EXPERIENCIAS = resolve(RAIZ, 'docs/evidencias/experiencia')

export function destinoSeguro(partes) {
  const solicitada = resolve(RAIZ, ...(Array.isArray(partes) ? partes : [partes]))
  const permitida = resolve(CARPETA_EXPERIENCIAS)
  if (solicitada === permitida || solicitada.startsWith(`${permitida}${sep}`)) return solicitada
  return permitida
}

export function carpeta(...partes) {
  const ruta = destinoSeguro(partes)
  mkdirSync(ruta, { recursive: true })
  return ruta
}

export async function abrirNavegador() {
  const ejecutable = process.env.E2E_NAVEGADOR ?? NAVEGADORES.find((ruta) => existsSync(ruta))
  if (!ejecutable) {
    throw new Error('No se encontró Edge ni Chrome. Indica la ruta con la variable E2E_NAVEGADOR.')
  }
  return chromium.launch({ executablePath: ejecutable, headless: true })
}

/** Página nueva con el ancho indicado. `sesion` (texto JSON) la deja con la sesión ya iniciada, sin pasar por el login. */
export async function nuevaPagina(navegador, ancho = 'escritorio', sesion = null) {
  const contexto = await navegador.newContext({ locale: 'es-PE', viewport: ANCHOS[ancho] })
  if (sesion) {
    await contexto.addInitScript((texto) => sessionStorage.setItem('reservaupla.sesion', texto), sesion)
  }
  return contexto.newPage()
}

export async function iniciarSesion(pagina, correo, clave = CLAVE) {
  await pagina.goto(`${BASE}/login`)
  await pagina.getByLabel('Correo institucional').fill(correo)
  await pagina.getByLabel('Contraseña', { exact: true }).fill(clave)
  await pagina.getByRole('button', { name: 'Ingresar' }).click()
}

/** Cierra la sesión por el menú de usuario de la barra superior (el botón lleva el nombre y el rol de la persona). */
export async function cerrarSesionPorMenu(pagina) {
  await pagina.getByRole('button', { name: /, (Administrador|Solicitante|Responsable de ambiente)$/ }).click()
  await pagina.getByRole('button', { name: 'Cerrar sesión' }).click()
}

/** La sesión guardada (para reutilizarla en otras páginas sin gastar intentos del límite de login). */
export const leerSesion = (pagina) => pagina.evaluate(() => sessionStorage.getItem('reservaupla.sesion'))

/** Mide si la página se desplaza horizontalmente. */
export async function medirDesbordamiento(pagina) {
  return pagina.evaluate(() => ({
    ancho: document.documentElement.scrollWidth,
    visible: document.documentElement.clientWidth,
  }))
}

const resultados = []
export const capturasConDesbordamiento = () => resultados.filter((r) => r.desborda)

/** Guarda la captura `<nombre>-<ancho>.png` y comprueba que no hay scroll horizontal. */
export async function capturar(pagina, destino, nombre, ancho) {
  await pagina.waitForTimeout(150) // deja terminar transiciones
  const medida = await medirDesbordamiento(pagina)
  const desborda = medida.ancho > medida.visible
  const destinoPermitido = destinoSeguro(destino)
  mkdirSync(destinoPermitido, { recursive: true })
  await pagina.screenshot({ path: resolve(destinoPermitido, `${nombre}-${ancho}.png`), fullPage: true })
  resultados.push({ nombre: `${nombre}-${ancho}`, desborda })
  const detalle = `${medida.ancho}px de contenido en ${medida.visible}px visibles`
  if (desborda) console.log(`   FALLO  ${nombre}-${ancho}: scroll horizontal (${detalle})`)
  else ok(`${nombre}-${ancho}.png sin scroll horizontal (${detalle})`)
}

export const registrarResultado = (nombre, desborda) => resultados.push({ nombre, desborda })

/** Llama a la API directamente (sin pasar por la interfaz): útil para comprobar lo que la interfaz no permite hacer. */
export async function api(ruta, { metodo = 'GET', token, cuerpo } = {}) {
  const respuesta = await fetch(`${API}${ruta}`, {
    method: metodo,
    headers: {
      Accept: 'application/json',
      ...(cuerpo === undefined ? {} : { 'Content-Type': 'application/json' }),
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
    },
    body: cuerpo === undefined ? undefined : JSON.stringify(cuerpo),
  })
  const texto = await respuesta.text()
  let data = null
  try {
    data = texto ? JSON.parse(texto) : null
  } catch {
    data = texto
  }
  return { status: respuesta.status, data }
}

export const tokenDe = (sesionTexto) => JSON.parse(sesionTexto).token

const dos = (n) => String(n).padStart(2, '0')

/** La fecha de hoy + `dias` (hora local): `texto` dd/mm/aaaa (lo que se escribe en el campo), `iso` aaaa-mm-dd (lo que usa la API). */
export function fechaRelativa(dias = 0) {
  const fecha = new Date()
  fecha.setDate(fecha.getDate() + dias)
  const [d, m, a] = [dos(fecha.getDate()), dos(fecha.getMonth() + 1), fecha.getFullYear()]
  return { texto: `${d}/${m}/${a}`, digitos: `${d}${m}${a}`, iso: `${a}-${m}-${d}` }
}

/** Crea una reserva por la API como el usuario del token y devuelve su id (los guiones no dependen de datos de otra fase). */
export async function crearReservaApi(token, ambienteId, fechaIso, horaInicio, horaFin, motivo) {
  const respuesta = await api('/api/reservas', { metodo: 'POST', token, cuerpo: { ambienteId, fecha: fechaIso, horaInicio, horaFin, motivo } })
  if (respuesta.status !== 201) throw new Error(`No se pudo crear la reserva de partida (HTTP ${respuesta.status}): ${JSON.stringify(respuesta.data)}`)
  return respuesta.data.id
}

export async function aprobarReservaApi(token, id) {
  const respuesta = await api(`/api/reservas/${id}/aprobar`, { metodo: 'POST', token })
  if (respuesta.status !== 200) throw new Error(`No se pudo aprobar la reserva #${id} (HTTP ${respuesta.status})`)
}

/** En móvil los filtros de Reservas están plegados detrás del botón «Filtros»: lo despliega si hace falta (en escritorio no hace nada). */
export async function abrirFiltros(pagina) {
  const boton = pagina.getByRole('button', { name: /^Filtros/ })
  if ((await boton.isVisible()) && (await boton.getAttribute('aria-expanded')) === 'false') await boton.click()
}

/** Falla con un mensaje claro si la condición no se cumple; si se cumple, lo deja anotado en la salida. */
export const esperar = (condicion, mensaje) => {
  if (!condicion) throw new Error(`No se cumplió: ${mensaje}`)
  ok(mensaje)
}

/** Inicia sesión como Ana, Carla y Mario una sola vez y devuelve sus sesiones (las páginas móviles las reutilizan). */
export async function iniciarSesionDeLosRoles(navegador) {
  const sesiones = {}
  for (const [rol, correo] of [
    ['ana', 'ana.torres@upla.edu.pe'],
    ['carla', 'carla.rojas@upla.edu.pe'],
    ['mario', 'mario.huaman@upla.edu.pe'],
  ]) {
    const pagina = await nuevaPagina(navegador, 'escritorio')
    await iniciarSesion(pagina, correo)
    await pagina.waitForURL('**/dashboard')
    sesiones[rol] = await leerSesion(pagina)
    await pagina.context().close()
  }
  return sesiones
}

/** Llena «Nueva reserva» con el Laboratorio de Cómputo 2, de 14:00 a 16:00, en la fecha dada. */
export async function llenarReserva(pagina, fecha, motivo) {
  await pagina.getByRole('radio', { name: /Laboratorio de Cómputo 2/ }).click()
  await pagina.getByLabel('Fecha').fill('')
  await pagina.getByLabel('Fecha').pressSequentially(fecha.digitos)
  await pagina.getByLabel('Hora de inicio').selectOption('14:00')
  await pagina.getByLabel('Hora de fin').selectOption('16:00')
  await pagina.getByLabel('Motivo').fill(motivo)
}
