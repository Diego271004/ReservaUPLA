// Ampliación de arquitectura de información: las pantallas cuyos textos o navegación cambiaron, por la interfaz real, a 1280 px
// y a 375 px, con capturas en docs/evidencias/fase-ai/:
//   formulario y cierre de Nueva reserva («Limpiar formulario», «Registrar otra solicitud»), detalle de la Solicitante en
//   Pendiente («Cancelar solicitud») y Aprobada («Cancelar reserva»), Mi ambiente con «Ver detalle», detalle de la Responsable
//   (solo lectura, el menú marca Mi ambiente, «Volver a Mi ambiente» conserva ambiente y página), detalle desde el Dashboard
//   («Volver a Inicio», el menú marca Inicio) y formularios de Ambientes y Usuarios («Volver», «Registrar …»).
// Requisitos: base recién creada, API en :5263 y frontend en :5180 (o `npm run todo`, que los arranca).
// Uso: CLAVE_PRUEBA="<clave de prueba>" npm run faseai   (desde tools/e2e)
import {
  BASE,
  abrirNavegador,
  aprobarReservaApi,
  api,
  capturar,
  capturasConDesbordamiento,
  carpeta,
  crearReservaApi,
  fechaRelativa,
  iniciarSesion,
  leerSesion,
  nuevaPagina,
  ok,
  paso,
  tokenDe,
} from './lib.mjs'

const destino = carpeta('docs', 'evidencias', 'fase-ai')
const navegador = await abrirNavegador()
let falloGeneral = false

const esperar = (condicion, mensaje) => {
  if (!condicion) throw new Error(`No se cumplió: ${mensaje}`)
  ok(mensaje)
}

/** Las opciones del menú lateral marcadas como la sección actual (aria-current), aunque el panel esté plegado en móvil. */
const opcionesMarcadas = (pagina) =>
  pagina.evaluate(() =>
    [...document.querySelectorAll('nav[aria-label="Principal"] a[aria-current]')].map((a) => a.textContent.trim()),
  )
const botonesDe = (pagina) => pagina.locator('main').getByRole('button').allInnerTexts()

async function flujo(ancho, diasAdelante, sesiones, tokenCarla) {
  const sufijo = ancho === 'movil' ? ' (375 px)' : ' (1280 px)'
  const fecha = fechaRelativa(diasAdelante)
  const llenar = async (pagina) => {
    await pagina.getByRole('radio', { name: /Laboratorio de Cómputo 2/ }).click()
    await pagina.getByLabel('Fecha').fill('')
    await pagina.getByLabel('Fecha').pressSequentially(fecha.digitos)
    await pagina.getByLabel('Hora de inicio').selectOption('14:00')
    await pagina.getByLabel('Hora de fin').selectOption('16:00')
    await pagina.getByLabel('Motivo').fill('Clase de arquitectura de información')
  }

  paso(`Nueva reserva: formulario y cierre${sufijo}`)
  const ana = await nuevaPagina(navegador, ancho, sesiones.ana)
  await ana.goto(`${BASE}/reservas/nueva`)
  await ana.getByRole('radio', { name: /Laboratorio de Cómputo 2/ }).waitFor({ state: 'attached' })
  await ana.getByRole('radio', { name: /Laboratorio de Cómputo 2/ }).click()
  const botonesForm = await botonesDe(ana)
  esperar(botonesForm.includes('Limpiar formulario') && botonesForm.includes('Registrar solicitud'), 'el formulario ofrece «Limpiar formulario» y «Registrar solicitud»')
  esperar(!botonesForm.includes('Cancelar'), 'ningún botón del formulario dice «Cancelar»')
  await capturar(ana, destino, '01-nueva-reserva-formulario', ancho)
  await llenar(ana)
  await ana.getByRole('button', { name: 'Limpiar formulario' }).click()
  esperar((await ana.getByLabel('Motivo').inputValue()) === '', '«Limpiar formulario» vacía el motivo sin salir de la pantalla')
  await llenar(ana)
  await ana.getByRole('button', { name: 'Registrar solicitud' }).click()
  await ana.getByText('Solicitud registrada. Quedó Pendiente de aprobación.').waitFor()
  esperar(await ana.getByRole('button', { name: 'Registrar otra solicitud' }).isVisible(), 'el cierre ofrece «Registrar otra solicitud»')
  await capturar(ana, destino, '02-nueva-reserva-cierre', ancho)

  paso(`Detalle de la Solicitante: Pendiente y Aprobada${sufijo}`)
  await ana.getByRole('button', { name: 'Ver detalle' }).click()
  await ana.getByRole('heading', { name: 'Detalle de la reserva' }).waitFor()
  const id = ana.url().split('/').pop()
  esperar(await ana.getByRole('button', { name: 'Cancelar solicitud' }).isEnabled(), 'Pendiente: el botón dice «Cancelar solicitud»')
  esperar((await opcionesMarcadas(ana)).join() === 'Reservas', 'el menú marca «Reservas» en el detalle')
  await capturar(ana, destino, '03-detalle-solicitante-pendiente', ancho)
  await aprobarReservaApi(tokenCarla, id)
  await ana.reload()
  await ana.getByRole('heading', { name: 'Detalle de la reserva' }).waitFor()
  esperar(await ana.getByRole('button', { name: 'Cancelar reserva' }).isEnabled(), 'Aprobada: el botón dice «Cancelar reserva»')
  esperar((await ana.getByRole('button', { name: 'Cancelar solicitud' }).count()) === 0, 'Aprobada: ya no aparece «Cancelar solicitud»')
  await capturar(ana, destino, '04-detalle-solicitante-aprobada', ancho)

  paso(`Mi ambiente con «Ver detalle» y el detalle de la Responsable${sufijo}`)
  const mario = await nuevaPagina(navegador, ancho, sesiones.mario)
  await mario.goto(`${BASE}/mi-ambiente`)
  await mario.getByRole('table').waitFor()
  await mario.getByLabel('Ambiente', { exact: true }).selectOption({ label: 'Laboratorio de Cómputo 2' })
  await mario.locator('tr', { hasText: fecha.texto }).waitFor()
  const botonesMi = new Set(await botonesDe(mario))
  esperar(botonesMi.size === 1 && botonesMi.has('Ver detalle'), 'Mi ambiente: el único botón de cada fila es «Ver detalle»')
  await capturar(mario, destino, '05-mi-ambiente', ancho)
  const origen = mario.url()
  await mario.locator('tr', { hasText: fecha.texto }).getByRole('button', { name: /^Ver detalle/ }).click()
  await mario.getByRole('heading', { name: 'Detalle de la reserva' }).waitFor()
  esperar((await mario.getByRole('main').getByRole('button').count()) === 0, 'el detalle de la Responsable es de solo lectura: sin acciones')
  esperar((await mario.getByRole('alert').count()) === 0 && (await mario.getByRole('status').count()) === 0, 'y sin aviso')
  esperar((await opcionesMarcadas(mario)).join() === 'Mi ambiente', 'el menú marca «Mi ambiente» en el detalle')
  await capturar(mario, destino, '06-detalle-responsable', ancho)
  await mario.getByRole('link', { name: 'Volver a Mi ambiente' }).click()
  await mario.getByRole('table').waitFor()
  esperar(mario.url() === origen, `«Volver a Mi ambiente» regresa a ${new URL(origen).search} (ambiente conservado)`)

  paso(`Detalle desde Inicio: «Volver a Inicio» y el menú marca Inicio${sufijo}`)
  const carla = await nuevaPagina(navegador, ancho, sesiones.carla)
  const ambientes = (await api('/api/ambientes', { token: tokenCarla })).data
  const laboratorio = ambientes.find((x) => x.nombre === 'Laboratorio de Cómputo 2').id
  await crearReservaApi(tokenDe(sesiones.ana), laboratorio, fechaRelativa(diasAdelante + 3).iso, '08:00', '09:00', 'Pendiente para el Dashboard')
  await carla.goto(`${BASE}/dashboard`)
  await carla.getByRole('region', { name: 'Indicadores' }).waitFor()
  await carla.getByRole('link', { name: 'Ver todas las pendientes' }).waitFor()
  ok('el pie del Dashboard ofrece «Ver todas las pendientes»')
  await capturar(carla, destino, '07-dashboard-pendientes', ancho)
  await carla.getByRole('button', { name: /^Ver detalle/ }).first().click()
  await carla.getByRole('heading', { name: 'Detalle de la reserva' }).waitFor()
  esperar(await carla.getByRole('link', { name: 'Volver a Inicio' }).isVisible(), 'el enlace de regreso dice «Volver a Inicio»')
  esperar((await opcionesMarcadas(carla)).join() === 'Inicio', 'el menú marca «Inicio»')
  await capturar(carla, destino, '08-detalle-desde-dashboard', ancho)

  paso(`Formularios de Ambientes y Usuarios: «Volver» y «Registrar …»${sufijo}`)
  for (const [lista, nuevo, registrar, captura] of [
    ['/ambientes', 'Nuevo ambiente', 'Registrar ambiente', '09-ambiente-formulario'],
    ['/usuarios', 'Nuevo usuario', 'Registrar usuario', '10-usuario-formulario'],
  ]) {
    await carla.goto(`${BASE}${lista}`)
    await carla.getByRole('button', { name: nuevo }).click()
    await carla.getByRole('heading', { name: registrar }).waitFor()
    const botones = await botonesDe(carla)
    esperar(botones.includes(registrar) && botones.includes('Volver') && !botones.includes('Cancelar'), `«${nuevo}» abre un formulario con «${registrar}» y «Volver» (sin «Cancelar» ni «Guardar»)`)
    await capturar(carla, destino, captura, ancho)
    await carla.getByRole('button', { name: 'Volver' }).click()
    await carla.waitForURL(`**${lista}`)
    ok(`«Volver» regresa a ${lista}`)
  }
}

try {
  paso('Inicio de sesión de Ana, Carla y Mario (una vez; las páginas móviles reutilizan la sesión)')
  const sesiones = {}
  for (const [rol, correo, destinoUrl] of [
    ['ana', 'ana.torres@upla.edu.pe', '**/dashboard'],
    ['carla', 'carla.rojas@upla.edu.pe', '**/dashboard'],
    ['mario', 'mario.huaman@upla.edu.pe', '**/dashboard'],
  ]) {
    const pagina = await nuevaPagina(navegador, 'escritorio')
    await iniciarSesion(pagina, correo)
    await pagina.waitForURL(destinoUrl)
    sesiones[rol] = await leerSesion(pagina)
    await pagina.context().close()
  }
  const tokenCarla = tokenDe(sesiones.carla)
  await flujo('escritorio', 14, sesiones, tokenCarla)
  await flujo('movil', 21, sesiones, tokenCarla)

  const desbordadas = capturasConDesbordamiento()
  if (desbordadas.length > 0) {
    falloGeneral = true
    console.log(`\nFALLO: scroll horizontal en ${desbordadas.map((d) => d.nombre).join(', ')}`)
  } else console.log('\nResumen: ninguna pantalla con scroll horizontal')
} catch (error) {
  falloGeneral = true
  console.error('\nFALLO:', error.message.split('\n').slice(0, 4).join(' / '))
} finally {
  await navegador.close()
}

console.log(falloGeneral ? '\nResultado: CON FALLOS' : '\nResultado: todo correcto')
process.exit(falloGeneral ? 1 : 0)
