// Recorrido de TODAS las pantallas y estados del sistema real, con datos de partida creados por la API.
// `medir(pagina, id, descripcion)` se llama en cada estado ya visible (captura, axe, objetivos táctiles, teclado).
// Los ids (01-…, 10-…) son los que usan docs/usabilidad/evaluacion-sistema.md y los nombres de las capturas.
import {
  BASE,
  aprobarReservaApi,
  api,
  crearReservaApi,
  fechaRelativa,
  iniciarSesion,
  leerSesion,
  nuevaPagina,
  tokenDe,
} from '../e2e/lib.mjs'

const CONFLICTO = 'Ese ambiente ya tiene una reserva aprobada de 10:00 a 12:00. Elige otro horario u otro ambiente.'
const D = (dias) => fechaRelativa(dias)

async function abrir(pagina, ruta, esperaRol, esperaNombre) {
  await pagina.goto(`${BASE}${ruta}`)
  await pagina.getByRole(esperaRol, { name: esperaNombre }).first().waitFor()
}

async function llenarReserva(pagina, { fecha, inicio, fin, motivo }) {
  await pagina.getByRole('radio', { name: /Laboratorio de Cómputo 2/ }).click()
  await pagina.getByLabel('Fecha').fill('')
  await pagina.getByLabel('Fecha').pressSequentially(fecha.digitos)
  await pagina.getByLabel('Hora de inicio').selectOption(inicio)
  await pagina.getByLabel('Hora de fin').selectOption(fin)
  if (motivo) await pagina.getByLabel('Motivo').fill(motivo)
}

/** Recorre todos los estados con el ancho indicado ('escritorio' o 'movil'). La base debe estar recién creada. */
export async function recorrer(navegador, ancho, medir) {
  const movil = ancho === 'movil'

  // ---------------------------------------------------------------- Login (sin sesión)
  const anonima = await nuevaPagina(navegador, ancho)
  await anonima.goto(`${BASE}/login`)
  await anonima.getByRole('button', { name: 'Ingresar' }).waitFor()
  await medir(anonima, '01-login-vacio', 'Login, estado inicial')
  await anonima.getByRole('button', { name: 'Ingresar' }).click()
  await anonima.getByText('Ingresa tu correo institucional.').waitFor()
  await medir(anonima, '02-login-errores-de-campo', 'Login, errores de campo al enviar vacío')
  await anonima.getByLabel('Correo institucional').fill('ana.torres@upla.edu.pe')
  await anonima.getByLabel('Contraseña', { exact: true }).fill('clave-incorrecta1')
  await anonima.getByRole('button', { name: 'Ingresar' }).click()
  await anonima.getByRole('alert').first().waitFor()
  await medir(anonima, '03-login-credenciales-incorrectas', 'Login, credenciales incorrectas (401 real)')
  await anonima.reload()
  await anonima.route('**/api/auth/login', async (ruta) => {
    await new Promise((resolver) => setTimeout(resolver, 5000))
    await ruta.fulfill({ status: 401, contentType: 'application/json', body: '{"mensaje":"x"}' }).catch(() => {})
  })
  await anonima.getByLabel('Correo institucional').fill('ana.torres@upla.edu.pe')
  await anonima.getByLabel('Contraseña', { exact: true }).fill('clave-cualquiera')
  await anonima.getByRole('button', { name: 'Ingresar' }).click()
  await anonima.getByRole('button', { name: 'Verificando credenciales…' }).waitFor()
  await medir(anonima, '04-login-verificando', 'Login, verificando credenciales (estado de carga)')
  await anonima.unroute('**/api/auth/login')

  // ---------------------------------------------------------------- Sesiones
  const sesiones = {}
  for (const [rol, correo] of [
    ['ana', 'ana.torres@upla.edu.pe'],
    ['carla', 'carla.rojas@upla.edu.pe'],
    ['mario', 'mario.huaman@upla.edu.pe'],
  ]) {
    const pagina = await nuevaPagina(navegador, 'escritorio')
    await iniciarSesion(pagina, correo)
    await pagina.waitForURL(/\/(reservas\/nueva|dashboard|mi-ambiente)$/)
    sesiones[rol] = await leerSesion(pagina)
    await pagina.context().close()
  }
  const tokenAna = tokenDe(sesiones.ana)
  const tokenCarla = tokenDe(sesiones.carla)

  // ---------------------------------------------------------------- Datos de partida (por la API)
  const ambientes = (await api('/api/ambientes', { token: tokenAna })).data
  const lab = ambientes.find((a) => a.nombre === 'Laboratorio de Cómputo 2').id
  const auditorio = ambientes.find((a) => a.nombre === 'Auditorio Principal').id
  const ocupada = await crearReservaApi(tokenAna, lab, D(10).iso, '10:00', '12:00', 'Clase de programación')
  await aprobarReservaApi(tokenCarla, ocupada)
  const idA = await crearReservaApi(tokenAna, lab, D(11).iso, '10:00', '12:00', 'Taller de bases de datos')
  const idB = await crearReservaApi(tokenAna, lab, D(11).iso, '11:00', '13:00', 'Práctica de redes')
  const idC = await crearReservaApi(tokenAna, auditorio, D(12).iso, '09:00', '10:00', 'Ensayo de la ceremonia')
  await api(`/api/reservas/${idC}/cancelar`, { metodo: 'POST', token: tokenAna })
  const idD = await crearReservaApi(tokenAna, auditorio, D(13).iso, '09:00', '10:00', 'Conferencia de ingeniería')
  await api(`/api/reservas/${idD}/rechazar`, { metodo: 'POST', token: tokenCarla })
  const idE = await crearReservaApi(tokenAna, auditorio, D(14).iso, '14:00', '16:00', 'Reunión de coordinación')

  // ---------------------------------------------------------------- Solicitante: Nueva reserva
  const ana = await nuevaPagina(navegador, ancho, sesiones.ana)
  await abrir(ana, '/reservas/nueva', 'heading', 'Nueva reserva')
  await ana.getByRole('radio', { name: /Laboratorio de Cómputo 2/ }).waitFor({ state: 'attached' })
  await medir(ana, '20-nueva-reserva-vacia', 'Nueva reserva, estado inicial')
  await ana.getByRole('radio', { name: /Laboratorio de Cómputo 2/ }).click()
  await medir(ana, '21-nueva-reserva-ambiente-elegido', 'Nueva reserva, ambiente elegido con su ayuda')
  await ana.getByRole('button', { name: 'Registrar solicitud' }).click()
  await ana.getByText('Ingresa el motivo de la reserva.').waitFor()
  await medir(ana, '22-nueva-reserva-errores', 'Nueva reserva, errores de campo al enviar incompleta')
  await llenarReserva(ana, { fecha: D(15), inicio: '14:00', fin: '16:00', motivo: 'Práctica de laboratorio' })
  await ana.getByText('Disponible: no hay reservas aprobadas en ese horario').waitFor()
  await medir(ana, '23-nueva-reserva-disponible', 'Nueva reserva, aviso verde de disponibilidad')
  await llenarReserva(ana, { fecha: D(10), inicio: '10:00', fin: '12:00' })
  await ana.getByText(CONFLICTO).first().waitFor()
  await medir(ana, '24-nueva-reserva-conflicto', 'Nueva reserva, aviso rojo de conflicto con una aprobada')
  await ana.getByLabel('Fecha').fill('')
  await ana.getByLabel('Fecha').pressSequentially('01012020')
  await ana.getByRole('button', { name: 'Registrar solicitud' }).click()
  await ana.getByText('No puedes reservar para una fecha anterior a hoy.').waitFor()
  await medir(ana, '25-nueva-reserva-fecha-pasada', 'Nueva reserva, fecha anterior a hoy (RN-07)')
  await llenarReserva(ana, { fecha: D(15), inicio: '14:00', fin: '16:00' })
  await ana.getByRole('button', { name: 'Registrar solicitud' }).click()
  await ana.getByText('Solicitud registrada. Quedó Pendiente de aprobación.').waitFor()
  await medir(ana, '26-nueva-reserva-cierre', 'Nueva reserva, cierre con el resumen de lo registrado')

  // ---------------------------------------------------------------- Solicitante: detalle
  await abrir(ana, `/reservas/${idE}`, 'heading', 'Detalle de la reserva')
  await medir(ana, '27-detalle-solicitante-pendiente', 'Detalle, Solicitante dueña con la reserva Pendiente')
  await ana.getByRole('button', { name: 'Cancelar solicitud' }).click()
  await ana.getByRole('dialog').waitFor()
  await medir(ana, '28-detalle-modal-cancelar', 'Detalle, modal de confirmación de cancelar')
  await ana.getByRole('button', { name: 'Volver' }).click()
  await abrir(ana, `/reservas/${idC}`, 'heading', 'Detalle de la reserva')
  await medir(ana, '29-detalle-cancelada', 'Detalle, reserva Cancelada (estado final)')

  // ---------------------------------------------------------------- Administrador: Dashboard y lista de Reservas
  const carla = await nuevaPagina(navegador, ancho, sesiones.carla)
  await abrir(carla, '/dashboard', 'heading', 'Inicio')
  await carla.getByRole('region', { name: 'Indicadores' }).waitFor()
  await carla.getByRole('table').waitFor()
  await medir(carla, '60-dashboard', 'Dashboard (Administrador): cinco indicadores y las pendientes más antiguas')
  await carla.getByRole('button', { name: /^Aprobar:/ }).first().click()
  await carla.getByRole('dialog').waitFor()
  await medir(carla, '61-dashboard-modal-aprobar', 'Dashboard, modal de confirmación de aprobar')
  await carla.getByRole('button', { name: 'Volver' }).click()
  await carla.getByRole('button', { name: /^Rechazar:/ }).first().click()
  await carla.getByRole('dialog').waitFor()
  await medir(carla, '62-dashboard-modal-rechazar', 'Dashboard, modal de confirmación de rechazar')
  await carla.getByRole('button', { name: 'Volver' }).click()
  await abrir(carla, '/reservas', 'heading', 'Reservas')
  await carla.getByRole('table').waitFor()
  await medir(carla, '63-reservas-administrador', 'Reservas (Administrador): filtros, tabla y pie')
  await abrir(carla, '/reservas?estado=Pendiente', 'heading', 'Reservas')
  await carla.getByRole('table').waitFor()
  await medir(carla, '64-reservas-filtro-pendiente', 'Reservas con el filtro Pendiente aplicado (como llega desde «Ver todas»)')
  await carla.getByRole('button', { name: /^Filtros/ }).isVisible().then(async (visible) => visible && (await carla.getByRole('button', { name: /^Filtros/ }).click()))
  await carla.getByLabel('Fecha desde').fill('0511')
  await carla.getByRole('button', { name: 'Aplicar filtros' }).click()
  await carla.getByText('Ingresa la fecha con el formato dd/mm/aaaa.').waitFor()
  await medir(carla, '65-reservas-fecha-invalida', 'Reservas, fecha de filtro mal escrita (error bajo el campo)')
  await abrir(carla, '/reservas?desde=2020-01-01&hasta=2020-01-02', 'heading', 'Reservas')
  await carla.getByText('No hay reservas con esos filtros.').waitFor()
  await medir(carla, '66-reservas-vacio-con-filtros', 'Reservas, sin resultados con filtros (estado vacío con «Limpiar filtros»)')
  await ana.goto(`${BASE}/reservas`)
  await ana.getByRole('heading', { name: 'Reservas' }).waitFor()
  await ana.getByRole('table').waitFor()
  await medir(ana, '67-reservas-solicitante', 'Reservas (Solicitante): solo las suyas, sin columna Solicitante')

  // ---------------------------------------------------------------- Administrador: detalle
  await abrir(carla, `/reservas/${idA}`, 'heading', 'Detalle de la reserva')
  await medir(carla, '30-detalle-admin-pendiente', 'Detalle, Administrador con una reserva Pendiente')
  await carla.getByRole('button', { name: 'Aprobar' }).click()
  await carla.getByRole('dialog').waitFor()
  await medir(carla, '31-detalle-modal-aprobar', 'Detalle, modal de confirmación de aprobar')
  await carla.getByRole('button', { name: 'Sí, aprobar' }).click()
  await carla.getByText('Reserva aprobada.').waitFor()
  await medir(carla, '32-detalle-aprobada', 'Detalle, tras aprobar (Aprobada, con historial)')
  await abrir(carla, `/reservas/${idB}`, 'heading', 'Detalle de la reserva')
  const botonAprobarB = carla.getByRole('button', { name: 'Aprobar' })
  if (await botonAprobarB.isDisabled()) {
    await carla.getByText(/Se cruza con la reserva/).waitFor()
  } else {
    await botonAprobarB.click()
    await carla.getByRole('button', { name: 'Sí, aprobar' }).click()
    await carla.getByText(CONFLICTO).waitFor()
  }
  await medir(carla, '33-detalle-conflicto-al-aprobar', 'Detalle, aprobar una reserva que se cruza (409)')
  await carla.getByRole('button', { name: 'Rechazar' }).click()
  await carla.getByRole('dialog').waitFor()
  await medir(carla, '34-detalle-modal-rechazar', 'Detalle, modal de confirmación de rechazar')
  await carla.getByRole('button', { name: 'Sí, rechazar' }).click()
  await carla.getByText('Reserva rechazada.').waitFor()
  await medir(carla, '35-detalle-rechazada', 'Detalle, tras rechazar (Rechazada, estado final)')

  // ---------------------------------------------------------------- Solicitante: detalle de una reserva ya Aprobada
  await abrir(ana, `/reservas/${idA}`, 'heading', 'Detalle de la reserva')
  await medir(ana, '36-detalle-solicitante-aprobada', 'Detalle, Solicitante dueña con la reserva Aprobada («Cancelar reserva»)')

  // ---------------------------------------------------------------- Responsable
  const mario = await nuevaPagina(navegador, ancho, sesiones.mario)
  await mario.goto(`${BASE}/mi-ambiente`)
  await mario.getByRole('heading', { name: 'Mi ambiente' }).waitFor()
  // Mario tiene tres ambientes y se abre el primero por nombre (el Auditorio): se elige el Laboratorio, que tiene reservas.
  await mario.getByLabel('Ambiente', { exact: true }).selectOption({ label: 'Laboratorio de Cómputo 2' })
  await mario.getByRole('button', { name: /^Ver detalle/ }).first().waitFor()
  await medir(mario, '41-mi-ambiente', 'Mi ambiente (Responsable): su ambiente, cuatro indicadores, sus reservas y «Ver detalle»')
  await mario.getByRole('button', { name: /^Ver detalle/ }).first().click()
  await mario.getByRole('heading', { name: 'Detalle de la reserva' }).waitFor()
  await medir(mario, '40-detalle-responsable', 'Detalle, Responsable (solo lectura; el menú marca Mi ambiente)')


  // ---------------------------------------------------------------- Administrador: ambientes y usuarios
  await abrir(carla, '/ambientes', 'heading', 'Ambientes')
  await carla.getByRole('cell', { name: 'Laboratorio de Cómputo 2 Laboratorio' }).waitFor()
  await medir(carla, '10-ambientes-listado', 'Ambientes, listado')
  if (movil) {
    await carla.getByRole('button', { name: 'Menú', exact: true }).click()
    await medir(carla, '11-ambientes-menu-movil-abierto', 'Menú lateral abierto en móvil')
    await carla.getByRole('button', { name: 'Cerrar menú' }).click()
  }
  await carla.getByRole('button', { name: 'Nuevo ambiente' }).click()
  await carla.getByRole('heading', { name: 'Registrar ambiente' }).waitFor()
  await medir(carla, '12-ambiente-formulario-vacio', 'Registrar ambiente, estado inicial')
  await carla.getByRole('button', { name: 'Registrar ambiente' }).click()
  await carla.getByText('Ingresa el nombre del ambiente.').waitFor()
  await medir(carla, '13-ambiente-formulario-errores', 'Registrar ambiente, errores de campo')
  await carla.getByLabel('Nombre').fill('Laboratorio de Física')
  await carla.getByLabel('Tipo').selectOption('Laboratorio')
  await carla.getByLabel('Capacidad').fill('24')
  await carla.getByLabel('Ubicación').fill('Pabellón C, piso 1')
  await carla.getByLabel('Estado').selectOption('Disponible')
  await carla.getByLabel('Responsable').selectOption({ label: 'Mario Huamán' })
  await carla.getByRole('button', { name: 'Registrar ambiente' }).click()
  await carla.getByText('Ambiente registrado.').waitFor()
  await medir(carla, '14-ambiente-guardado', 'Ambientes, tras registrar uno (mensaje de éxito)')

  await abrir(carla, '/usuarios', 'heading', 'Usuarios')
  await carla.getByRole('cell', { name: 'carla.rojas@upla.edu.pe' }).waitFor()
  await medir(carla, '15-usuarios-listado', 'Usuarios, listado')
  await carla.getByRole('button', { name: 'Nuevo usuario' }).click()
  await carla.getByRole('heading', { name: 'Registrar usuario' }).waitFor()
  await medir(carla, '16-usuario-formulario-vacio', 'Registrar usuario, estado inicial')
  await carla.getByRole('button', { name: 'Registrar usuario' }).click()
  await carla.getByText('Ingresa el nombre completo.').waitFor()
  await medir(carla, '17-usuario-formulario-errores', 'Registrar usuario, errores de campo')
  await carla.getByLabel('Contraseña inicial', { exact: true }).fill('abcdefgh')
  await carla.getByLabel('Contraseña inicial', { exact: true }).blur()
  await carla.getByText('La contraseña debe tener entre 8 y 72 caracteres', { exact: false }).waitFor()
  await medir(carla, '18-usuario-contrasena-requisitos', 'Registrar usuario, la contraseña no cumple la política')
  await carla.getByLabel('Nombre completo').fill('Luis Quispe')
  await carla.getByLabel('Correo institucional').fill('luis.quispe@upla.edu.pe')
  await carla.getByLabel('Rol').selectOption('Solicitante')
  await carla.getByLabel('Contraseña inicial', { exact: true }).fill(process.env.CLAVE_PRUEBA)
  await carla.getByRole('button', { name: 'Registrar usuario' }).click()
  await carla.getByText('Usuario registrado.').waitFor()
  await medir(carla, '19-usuario-guardado', 'Usuarios, tras registrar uno (mensaje de éxito)')

  // ---------------------------------------------------------------- Otras pantallas
  await carla.goto(`${BASE}/dashboard`)
  await carla.getByRole('region', { name: 'Indicadores' }).waitFor()
  await medir(carla, '50-dashboard-tras-decidir', 'Dashboard (Administrador) después de aprobar y rechazar')
  await ana.goto(`${BASE}/usuarios`)
  await ana.getByRole('heading', { name: 'Sin permiso' }).waitFor()
  await medir(ana, '51-sin-permiso', 'Sin permiso (Solicitante entra a Usuarios por la dirección)')
  await ana.goto(`${BASE}/no-existe`)
  await ana.getByRole('link', { name: 'Volver al inicio' }).waitFor()
  await medir(ana, '52-pagina-no-encontrada', 'Página no encontrada')

  return { idA, idB, idC, idD, idE, ocupada, sesiones }
}
