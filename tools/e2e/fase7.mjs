// Fase 7: las dos correcciones de usuario (ayuda del ambiente y RN-07) por la interfaz real y la API, con la base real,
// y capturas de las pantallas a escritorio (1280 px) y móvil (375 px).
// Requisitos: base recién creada (tools/e2e/recrear-bd.sh), API en :5263 y frontend en :5180.
// Uso: CLAVE_PRUEBA="<clave de prueba>" npm run fase7   (desde tools/e2e)
import {
  BASE,
  abrirNavegador,
  api,
  capturar,
  capturasConDesbordamiento,
  carpeta,
  iniciarSesion,
  leerSesion,
  nuevaPagina,
  esperar,
  ok,
  paso,
  tokenDe,
} from './lib.mjs'

const destino = carpeta('docs', 'evidencias', 'fase7')
const navegador = await abrirNavegador()
const FECHA_PASADA = 'No puedes reservar para una fecha anterior a hoy.'
const DETALLE_LABORATORIO = '30 personas · Pabellón A, piso 2'
let falloGeneral = false

const fechaDeHoy = () => {
  const ahora = new Date()
  const dos = (n) => String(n).padStart(2, '0')
  return { texto: `${dos(ahora.getDate())}/${dos(ahora.getMonth() + 1)}/${ahora.getFullYear()}`, iso: `${ahora.getFullYear()}-${dos(ahora.getMonth() + 1)}-${dos(ahora.getDate())}` }
}

try {
  paso('Inicio de sesión de Ana (Solicitante) y Carla (Administrador)')
  const ana = await nuevaPagina(navegador, 'escritorio')
  await iniciarSesion(ana, 'ana.torres@upla.edu.pe')
  await ana.waitForURL('**/dashboard')
  const sesionAna = await leerSesion(ana)
  const carla = await nuevaPagina(navegador, 'escritorio')
  await iniciarSesion(carla, 'carla.rojas@upla.edu.pe')
  await carla.waitForURL('**/dashboard')
  const sesionCarla = await leerSesion(carla)
  const tokenAna = tokenDe(sesionAna)
  ok('dos sesiones iniciadas')

  for (const ancho of ['escritorio', 'movil']) {
    const sufijo = ancho === 'movil' ? ' (375 px)' : ' (1280 px)'
    const pagina = ancho === 'movil' ? await nuevaPagina(navegador, 'movil', sesionAna) : ana

    paso(`Nueva reserva · elección del ambiente con tarjetas seleccionables${sufijo}`)
    await pagina.goto(`${BASE}/reservas/nueva`)
    const radioLab = pagina.getByRole('radio', { name: /Laboratorio de Cómputo 2/ })
    await radioLab.waitFor({ state: 'attached' })
    await capturar(pagina, destino, '01-nueva-reserva-vacia', ancho)
    await radioLab.click()
    await pagina.getByText(DETALLE_LABORATORIO).first().waitFor()
    ok(`al elegir el laboratorio aparece el detalle «${DETALLE_LABORATORIO}»`)
    await capturar(pagina, destino, '02-ambiente-elegido-con-ayuda', ancho)

    // ------------------------------------------------------------ Corrección (b): RN-07
    paso(`Nueva reserva · RN-07: una fecha anterior a hoy se avisa junto al campo${sufijo}`)
    await pagina.getByLabel('Fecha').fill('')
    await pagina.getByLabel('Fecha').pressSequentially('01012020')
    await pagina.getByLabel('Hora de inicio').selectOption('10:00')
    await pagina.getByLabel('Hora de fin').selectOption('12:00')
    await pagina.getByLabel('Motivo').fill('Prueba de fecha pasada')
    const antes = (await api('/api/reservas', { token: tokenAna })).data.length
    await pagina.getByRole('button', { name: 'Registrar solicitud' }).click()
    await pagina.getByText(FECHA_PASADA).waitFor()
    ok(`aparece «${FECHA_PASADA}» bajo el campo Fecha`)
    const despues = (await api('/api/reservas', { token: tokenAna })).data.length
    esperar(antes === despues, `no se registró ninguna reserva (${antes} antes, ${despues} después)`)
    await capturar(pagina, destino, '03-fecha-pasada-con-aviso', ancho)

    const hoy = fechaDeHoy()
    await pagina.getByLabel('Fecha').fill('')
    await pagina.getByLabel('Fecha').pressSequentially(hoy.texto.replaceAll('/', ''))
    await pagina.getByLabel('Fecha').blur()
    esperar((await pagina.getByText(FECHA_PASADA).count()) === 0, `con la fecha de hoy (${hoy.texto}) el aviso desaparece`)
  }

  paso('API · RN-07 con el mismo mensaje que la interfaz')
  const hoy = fechaDeHoy()
  const laboratorio = (await api('/api/ambientes', { token: tokenAna })).data.find((a) => a.nombre === 'Laboratorio de Cómputo 2')
  const pasada = await api('/api/reservas', {
    metodo: 'POST',
    token: tokenAna,
    cuerpo: { ambienteId: laboratorio.id, fecha: '2020-01-01', horaInicio: '10:00', horaFin: '12:00', motivo: 'Prueba' },
  })
  esperar(pasada.status === 400, `POST con fecha 2020-01-01 → HTTP ${pasada.status}`)
  esperar(pasada.data.errors.fecha[0] === FECHA_PASADA, `mensaje de la API idéntico: «${pasada.data.errors.fecha[0]}»`)
  const deHoy = await api('/api/reservas', {
    metodo: 'POST',
    token: tokenAna,
    cuerpo: { ambienteId: laboratorio.id, fecha: hoy.iso, horaInicio: '20:00', horaFin: '21:00', motivo: 'Reserva de hoy (RN-07)' },
  })
  esperar(deHoy.status === 201, `POST con la fecha de hoy (${hoy.iso}) → HTTP ${deHoy.status}`)

  paso('Capturas de las demás pantallas a 1280 px y 375 px')
  for (const ancho of ['escritorio', 'movil']) {
    const comoAdmin = await nuevaPagina(navegador, ancho, sesionCarla)
    for (const [ruta, nombre, espera] of [
      ['/ambientes', '04-ambientes', 'Ambientes'],
      ['/ambientes/nuevo', '05-registrar-ambiente', 'Registrar ambiente'],
      ['/usuarios', '06-usuarios', 'Usuarios'],
      ['/usuarios/nuevo', '07-registrar-usuario', 'Registrar usuario'],
    ]) {
      await comoAdmin.goto(`${BASE}${ruta}`)
      await comoAdmin.getByRole('heading', { name: espera }).first().waitFor()
      await capturar(comoAdmin, destino, nombre, ancho)
    }
    const sinSesion = await nuevaPagina(navegador, ancho)
    await sinSesion.goto(`${BASE}/login`)
    await sinSesion.getByRole('button', { name: 'Ingresar' }).waitFor()
    await capturar(sinSesion, destino, '08-login', ancho)
    const rutaInexistente = await nuevaPagina(navegador, ancho, sesionCarla)
    await rutaInexistente.goto(`${BASE}/no-existe`)
    await rutaInexistente.getByRole('link', { name: 'Volver al inicio' }).waitFor()
    await capturar(rutaInexistente, destino, '09-pagina-no-encontrada', ancho)
  }

  const conScroll = capturasConDesbordamiento()
  if (conScroll.length > 0) {
    falloGeneral = true
    console.log(`\nFALLO: ${conScroll.length} captura(s) con scroll horizontal: ${conScroll.map((c) => c.nombre).join(', ')}`)
  }
} catch (error) {
  falloGeneral = true
  console.error('\nFALLO:', error.message)
} finally {
  await navegador.close()
}

console.log(falloGeneral ? '\nResultado: CON FALLOS' : '\nResultado: todo correcto')
process.exit(falloGeneral ? 1 : 0)
