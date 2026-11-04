// Fase 6: validaciones y cambios de estado por la interfaz real y la API, con la base real, y capturas a escritorio y 375 px.
// Requisitos: base recién creada (tools/e2e/recrear-bd.sh), API en :5263 y frontend en :5180.
// Uso: CLAVE_PRUEBA="<clave de prueba>" npm run fase6   (desde tools/e2e)
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
  ok,
  paso,
  tokenDe,
} from './lib.mjs'

const destino = carpeta('docs', 'evidencias', 'fase6')
const navegador = await abrirNavegador()
const LABORATORIO = 'Laboratorio de Cómputo 2 · 30 personas · Pabellón A, piso 2'
const CONFLICTO_10_12 = 'Ese ambiente ya tiene una reserva aprobada de 10:00 a 12:00. Elige otro horario u otro ambiente.'
let falloGeneral = false

const esperar = (condicion, mensaje) => {
  if (!condicion) throw new Error(`No se cumplió: ${mensaje}`)
  ok(mensaje)
}

async function elegirHorario(pagina, fecha, inicio, fin) {
  await pagina.getByLabel('Ambiente').selectOption({ label: LABORATORIO })
  await pagina.getByLabel('Fecha').fill('')
  await pagina.getByLabel('Fecha').pressSequentially(fecha.replaceAll('/', ''))
  await pagina.getByLabel('Hora de inicio').selectOption(inicio)
  await pagina.getByLabel('Hora de fin').selectOption(fin)
}

const modal = (pagina) => pagina.getByRole('dialog')

try {
  // ============================ Sesiones (una vez por rol; luego se reutilizan) ============================
  paso('Inicio de sesión de Ana (Solicitante), Carla (Administrador) y Mario (Responsable)')
  const ana = await nuevaPagina(navegador, 'escritorio')
  await iniciarSesion(ana, 'ana.torres@upla.edu.pe')
  await ana.waitForURL('**/reservas/nueva')
  const sesionAna = await leerSesion(ana)

  const carla = await nuevaPagina(navegador, 'escritorio')
  await iniciarSesion(carla, 'carla.rojas@upla.edu.pe')
  await carla.waitForURL('**/ambientes')
  const sesionCarla = await leerSesion(carla)

  const mario = await nuevaPagina(navegador, 'escritorio')
  await iniciarSesion(mario, 'mario.huaman@upla.edu.pe')
  await mario.waitForURL('**/mi-ambiente')
  const sesionMario = await leerSesion(mario)
  const tokenAna = tokenDe(sesionAna)
  const tokenCarla = tokenDe(sesionCarla)
  ok('tres sesiones iniciadas')

  const reservas = (await api('/api/reservas', { token: tokenCarla })).data
  const pendienteA = reservas.find((r) => r.fecha === '2026-11-05' && r.horaInicio === '10:00' && r.estado === 'Pendiente')
  const pendienteB = reservas.find((r) => r.fecha === '2026-11-05' && r.horaInicio === '11:00' && r.estado === 'Pendiente')
  ok(`reservas de partida: A = #${pendienteA.id} (05/11 10:00-12:00, Pendiente), B = #${pendienteB.id} (05/11 11:00-13:00, Pendiente)`)

  // ============================ Nueva reserva: disponibilidad (04, 04e, 04f) ============================
  paso('Escritorio · Ana: aviso de disponibilidad en Nueva reserva')
  await ana.getByRole('option', { name: /Laboratorio de Cómputo 2/ }).waitFor({ state: 'attached' })
  await elegirHorario(ana, '05/11/2026', '14:00', '16:00')
  await ana.getByText('Disponible: no hay reservas aprobadas en ese horario').waitFor()
  await capturar(ana, destino, '01-nueva-reserva-disponible', 'escritorio')
  ok('04: aviso verde "Disponible: no hay reservas aprobadas en ese horario"')

  await elegirHorario(ana, '03/11/2026', '10:00', '12:00')
  await ana.getByText(CONFLICTO_10_12).waitFor()
  await capturar(ana, destino, '02-nueva-reserva-conflicto', 'escritorio')
  ok('04e: aviso rojo con la hora ocupada: "' + CONFLICTO_10_12 + '"')

  await ana.getByLabel('Motivo').fill('Clase que choca con una aprobada')
  await ana.getByRole('button', { name: 'Registrar solicitud' }).click()
  await ana.getByText(CONFLICTO_10_12).first().waitFor()
  esperar((await ana.getByRole('button', { name: 'Registrar solicitud' }).getAttribute('aria-busy')) === null, 'al registrar con conflicto el servidor responde 409 y el formulario queda libre con sus datos')

  const enMantenimiento = await ana.getByRole('option', { name: /Sala de Reuniones A/ }).evaluate((o) => o.disabled)
  esperar(enMantenimiento, '04f: "Sala de Reuniones A · En mantenimiento (no disponible)" está deshabilitada en la lista')
  await ana.getByLabel('Ambiente').focus()
  await capturar(ana, destino, '03-nueva-reserva-mantenimiento', 'escritorio')

  paso('Escritorio · Ana registra una reserva libre y abre su detalle')
  await elegirHorario(ana, '05/11/2026', '14:00', '16:00')
  await ana.getByLabel('Motivo').fill('Práctica de laboratorio')
  await ana.getByRole('button', { name: 'Registrar solicitud' }).click()
  await ana.getByText('Solicitud registrada. Quedó Pendiente de aprobación.').waitFor()
  await capturar(ana, destino, '04-nueva-reserva-cierre', 'escritorio')
  await ana.getByRole('button', { name: 'Ver detalle' }).click()
  await ana.getByRole('heading', { name: 'Detalle de la reserva' }).waitFor()
  const idPropia = Number(new URL(ana.url()).pathname.split('/').pop())
  ok(`"Ver detalle" lleva a /reservas/${idPropia}`)
  esperar((await ana.getByRole('button', { name: /Aprobar|Rechazar/ }).count()) === 0, '05f RN-05: la Solicitante NO ve Aprobar ni Rechazar')
  await capturar(ana, destino, '05-detalle-solicitante', 'escritorio')

  paso('Escritorio · Ana cancela su propia reserva (modal)')
  await ana.getByRole('button', { name: 'Cancelar solicitud' }).click()
  await modal(ana).waitFor()
  await capturar(ana, destino, '06-modal-cancelar', 'escritorio')
  await ana.getByRole('button', { name: 'Sí, cancelar reserva' }).click()
  await ana.getByText('Reserva cancelada.').waitFor()
  await ana.getByText('Una reserva cancelada no se puede modificar.').waitFor()
  esperar(await ana.getByRole('button', { name: 'Cancelar solicitud' }).isDisabled(), 'RN-06: tras cancelar, la acción queda deshabilitada y con el aviso informativo')
  await capturar(ana, destino, '07-detalle-cancelada', 'escritorio')

  // ============================ Administrador: aprobar, conflicto, rechazar ============================
  paso('Escritorio · Carla aprueba la reserva A (no cruza con ninguna aprobada)')
  await carla.goto(`${BASE}/reservas/${pendienteA.id}`)
  await carla.getByRole('heading', { name: 'Detalle de la reserva' }).waitFor()
  await capturar(carla, destino, '08-detalle-admin-pendiente', 'escritorio')
  await carla.getByRole('button', { name: 'Aprobar' }).click()
  await modal(carla).waitFor()
  await capturar(carla, destino, '09-modal-aprobar', 'escritorio')
  await carla.getByRole('button', { name: 'Sí, aprobar' }).click()
  await carla.getByText('Reserva aprobada.').waitFor()
  await capturar(carla, destino, '10-detalle-aprobada', 'escritorio')
  ok('05g: "Reserva aprobada." y el historial muestra el evento: ' + (await carla.getByText(/Reserva aprobada por Carla Rojas/).innerText()))

  paso('Escritorio · Carla intenta aprobar la reserva B, que se cruza con la A (RN-01)')
  await carla.goto(`${BASE}/reservas/${pendienteB.id}`)
  await carla.getByRole('button', { name: 'Aprobar' }).click()
  await carla.getByRole('button', { name: 'Sí, aprobar' }).click()
  await carla.getByText(CONFLICTO_10_12).waitFor()
  esperar((await carla.getByText('Pendiente', { exact: true }).count()) > 0, 'la reserva B sigue Pendiente tras el conflicto')
  await capturar(carla, destino, '11-detalle-conflicto-al-aprobar', 'escritorio')

  paso('Escritorio · Carla rechaza la reserva B (modal rojo) y queda sin acciones (RN-06)')
  await carla.getByRole('button', { name: 'Rechazar' }).click()
  await modal(carla).waitFor()
  await capturar(carla, destino, '12-modal-rechazar', 'escritorio')
  await carla.getByRole('button', { name: 'Sí, rechazar' }).click()
  await carla.getByText('Reserva rechazada.').waitFor()
  await carla.getByText('Una reserva rechazada no se puede modificar.').waitFor()
  esperar(
    (await carla.getByRole('button', { name: 'Aprobar' }).isDisabled()) &&
      (await carla.getByRole('button', { name: 'Rechazar' }).isDisabled()) &&
      (await carla.getByRole('button', { name: 'Cancelar reserva' }).isDisabled()),
    '05c: Aprobar, Rechazar y Cancelar reserva quedan deshabilitados con el aviso informativo',
  )
  await capturar(carla, destino, '13-detalle-rechazada', 'escritorio')

  // ============================ Responsable: solo consulta ============================
  paso('Escritorio · Mario (Responsable) solo consulta')
  await mario.goto(`${BASE}/reservas/${pendienteA.id}`)
  await mario.getByRole('heading', { name: 'Detalle de la reserva' }).waitFor()
  esperar((await mario.getByRole('button', { name: /Aprobar|Rechazar|Cancelar/ }).count()) === 0, 'RN-05: la Responsable no ve ninguna acción')
  await capturar(mario, destino, '14-detalle-responsable', 'escritorio')

  // ============================ Contraseña inicial (U2, 07b) ============================
  paso('Escritorio · Carla: contraseña inicial con requisitos (U2)')
  await carla.goto(`${BASE}/usuarios/nuevo`)
  await carla.getByLabel('Nombre completo').fill('Rosa Chávez')
  await carla.getByLabel('Correo institucional').fill('rosa.chavez@upla.edu.pe')
  await carla.getByLabel('Rol').selectOption('Responsable')
  await carla.getByLabel('Contraseña inicial', { exact: true }).fill('abcdefgh')
  await carla.getByLabel('Contraseña inicial', { exact: true }).blur()
  await carla.getByText('La contraseña debe tener entre 8 y 72 caracteres, con al menos una letra y un número.').waitFor()
  await capturar(carla, destino, '15-usuario-contrasena-requisitos', 'escritorio')
  ok('U2: la ayuda "Entre 8 y 72 caracteres, con al menos una letra y un número." y el error si no cumple')

  // ============================ API directa: lo que la interfaz no deja hacer ============================
  paso('API directa: RN-05 y ambiente en mantenimiento')
  const aprobarComoAna = await api(`/api/reservas/${idPropia}/aprobar`, { metodo: 'POST', token: tokenAna })
  esperar(aprobarComoAna.status === 403, `la Solicitante intenta aprobar por la API → HTTP ${aprobarComoAna.status}`)
  const ambientes = (await api('/api/ambientes', { token: tokenAna })).data
  const sala = ambientes.find((a) => a.estado === 'En mantenimiento')
  const reservarEnMantenimiento = await api('/api/reservas', {
    metodo: 'POST',
    token: tokenAna,
    cuerpo: { ambienteId: sala.id, fecha: '2026-12-10', horaInicio: '10:00', horaFin: '11:00', motivo: 'Prueba' },
  })
  esperar(
    reservarEnMantenimiento.status === 400,
    `reservar en "${sala.nombre}" (en mantenimiento) por la API → HTTP ${reservarEnMantenimiento.status}: ${reservarEnMantenimiento.data.errors.ambienteId[0]}`,
  )
  const aprobarRechazada = await api(`/api/reservas/${pendienteB.id}/aprobar`, { metodo: 'POST', token: tokenCarla })
  esperar(aprobarRechazada.status === 409, `aprobar una reserva Rechazada por la API → HTTP ${aprobarRechazada.status}: ${aprobarRechazada.data.mensaje}`)
  const inexistente = await api('/api/reservas/99999/aprobar', { metodo: 'POST', token: tokenCarla })
  esperar(inexistente.status === 404, `aprobar una reserva que no existe → HTTP ${inexistente.status}`)

  // ============================ 375 px: las pantallas nuevas ============================
  paso('375 px · reservas de apoyo y capturas')
  const apoyoX = await api('/api/reservas', {
    metodo: 'POST',
    token: tokenAna,
    cuerpo: { ambienteId: ambientes.find((a) => a.nombre === 'Auditorio Principal').id, fecha: '2026-12-01', horaInicio: '09:00', horaFin: '10:00', motivo: 'Reserva de apoyo para las capturas móviles' },
  })
  const idX = apoyoX.data.id
  ok(`reserva de apoyo X = #${idX} (Pendiente)`)

  const anaMovil = await nuevaPagina(navegador, 'movil', sesionAna)
  await anaMovil.goto(`${BASE}/reservas/nueva`)
  await anaMovil.getByRole('option', { name: /Laboratorio de Cómputo 2/ }).waitFor({ state: 'attached' })
  await elegirHorario(anaMovil, '05/11/2026', '17:00', '18:00')
  await anaMovil.getByText('Disponible: no hay reservas aprobadas en ese horario').waitFor()
  await capturar(anaMovil, destino, '01-nueva-reserva-disponible', 'movil')
  await elegirHorario(anaMovil, '03/11/2026', '10:00', '12:00')
  await anaMovil.getByText(CONFLICTO_10_12).waitFor()
  await capturar(anaMovil, destino, '02-nueva-reserva-conflicto', 'movil')
  await anaMovil.goto(`${BASE}/reservas/${idX}`)
  await anaMovil.getByRole('heading', { name: 'Detalle de la reserva' }).waitFor()
  await capturar(anaMovil, destino, '05-detalle-solicitante', 'movil')
  await anaMovil.getByRole('button', { name: 'Cancelar solicitud' }).click()
  await modal(anaMovil).waitFor()
  await capturar(anaMovil, destino, '06-modal-cancelar', 'movil')

  const carlaMovil = await nuevaPagina(navegador, 'movil', sesionCarla)
  await carlaMovil.goto(`${BASE}/reservas/${idX}`)
  await carlaMovil.getByRole('heading', { name: 'Detalle de la reserva' }).waitFor()
  await capturar(carlaMovil, destino, '08-detalle-admin-pendiente', 'movil')
  await carlaMovil.getByRole('button', { name: 'Rechazar' }).click()
  await modal(carlaMovil).waitFor()
  await capturar(carlaMovil, destino, '12-modal-rechazar', 'movil')
  await carlaMovil.getByRole('button', { name: 'Volver' }).click()
  await carlaMovil.goto(`${BASE}/reservas/${pendienteA.id}`)
  await carlaMovil.getByText('Aprobada', { exact: true }).first().waitFor()
  await capturar(carlaMovil, destino, '10-detalle-aprobada', 'movil')
  await carlaMovil.goto(`${BASE}/reservas/${pendienteB.id}`)
  await carlaMovil.getByText('Una reserva rechazada no se puede modificar.').waitFor()
  await capturar(carlaMovil, destino, '13-detalle-rechazada', 'movil')
  await carlaMovil.goto(`${BASE}/usuarios/nuevo`)
  await carlaMovil.getByLabel('Contraseña inicial', { exact: true }).fill('1234')
  await carlaMovil.getByLabel('Contraseña inicial', { exact: true }).blur()
  await carlaMovil.getByText('La contraseña debe tener entre 8 y 72 caracteres', { exact: false }).waitFor()
  await capturar(carlaMovil, destino, '15-usuario-contrasena-requisitos', 'movil')

  console.log(`\nIdentificadores para comprobar en la base: A=#${pendienteA.id} (aprobada), B=#${pendienteB.id} (rechazada), propia de Ana=#${idPropia} (cancelada), apoyo X=#${idX} (pendiente)`)
} catch (error) {
  console.log('\nFALLO:', error.message.split('\n').slice(0, 3).join(' / '))
  falloGeneral = true
} finally {
  await navegador.close()
}

const desbordadas = capturasConDesbordamiento()
console.log(`\nResumen: ${desbordadas.length === 0 ? 'ninguna pantalla con scroll horizontal' : 'CON scroll horizontal: ' + desbordadas.map((d) => d.nombre).join(', ')}`)
process.exitCode = falloGeneral || desbordadas.length > 0 ? 1 : 0
