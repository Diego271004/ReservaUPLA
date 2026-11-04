// Fase 9: el flujo completo de la salida de datos por la interfaz real y la base real, a escritorio (1280 px) y a 375 px:
//   la Solicitante registra una reserva → el Administrador la ve en el Dashboard → la aprueba desde el modal →
//   aparece Aprobada en Reservas con el filtro Estado → «Volver a Reservas» conserva el filtro →
//   la Responsable la ve en Mi ambiente (solo lectura). Los indicadores de la pantalla se comparan con la API.
// Requisitos: base recién creada (tools/e2e/recrear-bd.sh), API en :5263 y frontend en :5180.
// Uso: CLAVE_PRUEBA="<clave de prueba>" npm run fase9   (desde tools/e2e)
import {
  BASE,
  abrirNavegador,
  api,
  capturar,
  capturasConDesbordamiento,
  carpeta,
  crearReservaApi,
  fechaRelativa,
  abrirFiltros,
  iniciarSesion,
  leerSesion,
  nuevaPagina,
  ok,
  paso,
  tokenDe,
} from './lib.mjs'

const destino = carpeta('docs', 'evidencias', 'fase9')
const navegador = await abrirNavegador()
let falloGeneral = false

const esperar = (condicion, mensaje) => {
  if (!condicion) throw new Error(`No se cumplió: ${mensaje}`)
  ok(mensaje)
}

/** El número de una tarjeta del Dashboard o de Mi ambiente, por su descripción («Reservas pendientes»). */
async function indicador(pagina, descripcion) {
  const texto = await pagina.getByRole('region', { name: 'Indicadores' }).getByRole('article').filter({ hasText: new RegExp(String.raw`^\d+\s*${descripcion}`) }).innerText()
  return Number.parseInt(texto, 10)
}

async function registrarComoSolicitante(pagina, fecha) {
  await pagina.goto(`${BASE}/reservas/nueva`)
  await pagina.getByRole('option', { name: 'Laboratorio de Cómputo 2', exact: true }).waitFor({ state: 'attached' })
  await pagina.getByLabel('Ambiente').selectOption({ label: 'Laboratorio de Cómputo 2' })
  await pagina.getByLabel('Fecha').fill('')
  await pagina.getByLabel('Fecha').pressSequentially(fecha.digitos)
  await pagina.getByLabel('Hora de inicio').selectOption('14:00')
  await pagina.getByLabel('Hora de fin').selectOption('16:00')
  await pagina.getByLabel('Motivo').fill(`Práctica del ${fecha.texto}`)
  await pagina.getByRole('button', { name: 'Registrar solicitud' }).click()
  await pagina.getByText('Solicitud registrada. Quedó Pendiente de aprobación.').waitFor()
}

async function flujo(ancho, diasAdelante, sesiones, tokenCarla) {
  const fecha = fechaRelativa(diasAdelante)
  const sufijo = ancho === 'movil' ? ' (375 px)' : ' (1280 px)'

  paso(`La Solicitante registra una reserva para el ${fecha.texto}${sufijo}`)
  const ana = await nuevaPagina(navegador, ancho, sesiones.ana)
  await registrarComoSolicitante(ana, fecha)
  ok('reserva registrada: queda Pendiente')

  paso(`El Administrador la ve en el Dashboard${sufijo}`)
  const carla = await nuevaPagina(navegador, ancho, sesiones.carla)
  await carla.goto(`${BASE}/dashboard`)
  await carla.getByRole('region', { name: 'Indicadores' }).waitFor()
  const fila = carla.locator('tr', { hasText: fecha.texto }).filter({ hasText: 'Ana Torres' })
  await fila.waitFor()
  const pendientesAntes = await indicador(carla, 'Reservas pendientes')
  const aprobadasAntes = await indicador(carla, 'Reservas aprobadas')
  const dashboardApi = (await api('/api/dashboard', { token: tokenCarla })).data
  esperar(pendientesAntes === dashboardApi.indicadores.pendientes, `el indicador «Reservas pendientes» (${pendientesAntes}) coincide con la API`)
  esperar(aprobadasAntes === dashboardApi.indicadores.aprobadas, `el indicador «Reservas aprobadas» (${aprobadasAntes}) coincide con la API`)
  await capturar(carla, destino, '01-dashboard-con-la-solicitud', ancho)

  paso(`La aprueba desde el modal${sufijo}`)
  await fila.getByRole('button', { name: /^Aprobar:/ }).click()
  const modal = carla.getByRole('dialog')
  await modal.waitFor()
  await modal.getByText(`Horario: ${fecha.texto}, 14:00 – 16:00`).waitFor()
  await capturar(carla, destino, '02-dashboard-modal-aprobar', ancho)
  await modal.getByRole('button', { name: 'Sí, aprobar' }).click()
  await carla.getByText('Reserva aprobada.').waitFor()
  await fila.waitFor({ state: 'detached' })
  esperar((await indicador(carla, 'Reservas pendientes')) === pendientesAntes - 1, 'el indicador de pendientes bajó en 1')
  esperar((await indicador(carla, 'Reservas aprobadas')) === aprobadasAntes + 1, 'el indicador de aprobadas subió en 1')
  await capturar(carla, destino, '03-dashboard-tras-aprobar', ancho)

  paso(`Aparece Aprobada en Reservas con el filtro Estado${sufijo}`)
  await carla.goto(`${BASE}/reservas`)
  await carla.getByRole('table').waitFor()
  await abrirFiltros(carla)
  await carla.getByLabel('Estado', { exact: true }).selectOption('Aprobada')
  await carla.getByRole('button', { name: 'Aplicar filtros' }).click()
  await carla.waitForURL('**/reservas?estado=Aprobada')
  const aprobada = carla.locator('tr', { hasText: fecha.texto }).filter({ hasText: 'Aprobada' })
  await aprobada.waitFor()
  esperar((await carla.locator('tbody tr').filter({ hasText: 'Pendiente' }).count()) === 0, 'con el filtro Aprobada no aparece ninguna Pendiente')
  await capturar(carla, destino, '04-reservas-filtro-aprobada', ancho)

  paso(`«Volver a Reservas» conserva el filtro${sufijo}`)
  await aprobada.getByRole('button', { name: /Ver detalle/ }).click()
  await carla.getByRole('heading', { name: 'Detalle de la reserva' }).waitFor()
  await carla.getByRole('link', { name: 'Volver a Reservas' }).click()
  await carla.waitForURL('**/reservas?estado=Aprobada')
  esperar((await carla.getByLabel('Estado', { exact: true }).inputValue()) === 'Aprobada', 'al volver, el filtro Estado sigue en Aprobada')
  await aprobada.waitFor()

  paso(`La Responsable la ve en Mi ambiente${sufijo}`)
  const mario = await nuevaPagina(navegador, ancho, sesiones.mario)
  await mario.goto(`${BASE}/mi-ambiente`)
  await mario.getByRole('table').waitFor()
  // Mario está a cargo de varios ambientes: Mi ambiente abre el primero por nombre y él elige el Laboratorio.
  await mario.getByLabel('Ambiente').selectOption({ label: 'Laboratorio de Cómputo 2' })
  await mario.getByRole('heading', { name: 'Laboratorio de Cómputo 2' }).waitFor()
  await mario.locator('tr', { hasText: fecha.texto }).filter({ hasText: 'Aprobada' }).waitFor()
  esperar((await mario.getByRole('main').getByRole('button').filter({ hasNotText: /^Ver detalle/ }).count()) === 0, 'Mi ambiente es de solo lectura: solo hay «Ver detalle», ningún botón de decidir')
  const idLaboratorio = (await api('/api/ambientes', { token: tokenCarla })).data.find((x) => x.nombre === 'Laboratorio de Cómputo 2').id
  const miAmbienteApi = (await api(`/api/mi-ambiente?ambienteId=${idLaboratorio}`, { token: tokenDe(sesiones.mario) })).data
  esperar((await indicador(mario, 'Total de reservas')) === miAmbienteApi.indicadores.total, 'el total de Mi ambiente coincide con la API')
  await capturar(mario, destino, '05-mi-ambiente', ancho)
}

try {
  paso('Inicio de sesión de Ana, Carla y Mario (una vez; las páginas móviles reutilizan la sesión)')
  const sesiones = {}
  for (const [rol, correo, destinoUrl] of [
    ['ana', 'ana.torres@upla.edu.pe', '**/reservas/nueva'],
    ['carla', 'carla.rojas@upla.edu.pe', '**/dashboard'],
    ['mario', 'mario.huaman@upla.edu.pe', '**/mi-ambiente'],
  ]) {
    const pagina = await nuevaPagina(navegador, 'escritorio')
    await iniciarSesion(pagina, correo)
    await pagina.waitForURL(destinoUrl)
    sesiones[rol] = await leerSesion(pagina)
    await pagina.context().close()
  }
  ok('el Administrador aterriza en el Dashboard, la Solicitante en Nueva reserva y la Responsable en Mi ambiente')
  const tokenCarla = tokenDe(sesiones.carla)
  const tokenAna = tokenDe(sesiones.ana)

  await flujo('escritorio', 30, sesiones, tokenCarla)
  await flujo('movil', 31, sesiones, tokenCarla)

  // Con los dos flujos ya hechos, seis pendientes más (por la API) para ver «Mostrando 5 de N» y «Ver todas».
  const laboratorio = (await api('/api/ambientes', { token: tokenAna })).data.find((a) => a.nombre === 'Laboratorio de Cómputo 2').id
  for (let i = 0; i < 6; i++) {
    await crearReservaApi(tokenAna, laboratorio, fechaRelativa(40 + i).iso, '09:00', '10:00', `Reserva de relleno ${i + 1}`)
  }


  paso('«Mostrando 5 de N» y «Ver todas» llevan a Reservas con el filtro Pendiente')
  const carla = await nuevaPagina(navegador, 'escritorio', sesiones.carla)
  await carla.goto(`${BASE}/dashboard`)
  await carla.getByRole('table').waitFor()
  const total = (await api('/api/dashboard', { token: tokenCarla })).data.indicadores.pendientes
  await carla.getByText(`Mostrando 5 de ${total}`).waitFor()
  ok(`el pie dice «Mostrando 5 de ${total}»`)
  await capturar(carla, destino, '06-dashboard-mostrando-5-de-n', 'escritorio')
  await carla.getByRole('link', { name: 'Ver todas las pendientes' }).click()
  await carla.waitForURL('**/reservas?estado=Pendiente')
  await carla.getByRole('table').waitFor()
  esperar((await carla.getByLabel('Estado', { exact: true }).inputValue()) === 'Pendiente', '«Ver todas» abre Reservas con el filtro Pendiente aplicado')
  await carla.getByText(`Mostrando ${Math.min(total, 10)} de ${total}`).waitFor()
  await capturar(carla, destino, '07-reservas-ver-todas-pendientes', 'escritorio')

  paso('Paginación: con más de 10 reservas hay páginas y «Anterior» está deshabilitado en la primera')
  for (let i = 0; i < 8; i++) {
    await crearReservaApi(tokenAna, laboratorio, fechaRelativa(60 + i).iso, '09:00', '10:00', `Reserva de paginación ${i + 1}`)
  }
  await carla.goto(`${BASE}/reservas`)
  await carla.getByRole('navigation', { name: 'Paginación' }).waitFor()
  esperar(await carla.getByRole('button', { name: 'Anterior' }).isDisabled(), '«Anterior» está deshabilitado en la primera página')
  await capturar(carla, destino, '08-reservas-paginacion', 'escritorio')
  await carla.getByRole('button', { name: 'Siguiente' }).click()
  await carla.waitForURL('**/reservas?pagina=2')
  esperar(await carla.getByRole('button', { name: 'Siguiente' }).isDisabled() || (await carla.getByRole('button', { name: 'Anterior' }).isEnabled()), 'la página 2 permite volver con «Anterior»')

  const desbordadas = capturasConDesbordamiento()
  if (desbordadas.length > 0) {
    falloGeneral = true
    console.log(`\nFALLO: scroll horizontal en ${desbordadas.map((d) => d.nombre).join(', ')}`)
  }
} catch (error) {
  falloGeneral = true
  console.error('\nFALLO:', error.message.split('\n').slice(0, 4).join(' / '))
} finally {
  await navegador.close()
}

console.log(falloGeneral ? '\nResultado: CON FALLOS' : '\nResultado: todo correcto')
process.exit(falloGeneral ? 1 : 0)
