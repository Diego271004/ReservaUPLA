// Fase 5: prueba de extremo a extremo por la interfaz real y capturas de cada pantalla construida,
// a escritorio (1280 px) y a 375 px, comprobando que no hay scroll horizontal.
// Requisitos: base recién creada (tools/e2e/recrear-bd.sh), API en :5263 y frontend en :5180.
// Uso: CLAVE_PRUEBA="<clave de prueba>" npm run fase5   (desde tools/e2e)
import {
  BASE,
  abrirNavegador,
  capturar,
  capturasConDesbordamiento,
  carpeta,
  iniciarSesion,
  leerSesion,
  nuevaPagina,
  fechaRelativa,
  ok,
  paso,
} from './lib.mjs'
import { separacionUniforme, sinPalabrasPartidas } from './comprobaciones.mjs'

const destino = carpeta('docs', 'evidencias', 'fase5')
const navegador = await abrirNavegador()

const menu = (pagina) => pagina.getByRole('navigation', { name: 'Principal' }).getByRole('link').allTextContents()

// Login lento y sin gastar intentos del límite: se responde un 401 después de una pausa, solo para ver el estado de carga.
async function capturarCarga(pagina, ancho) {
  await pagina.route('**/api/auth/login', async (ruta) => {
    await new Promise((resolver) => setTimeout(resolver, 4000))
    // Si la página ya siguió su camino, la ruta puede estar resuelta: no es un fallo de la prueba.
    await ruta.fulfill({ status: 401, contentType: 'application/json', body: JSON.stringify({ mensaje: 'x' }) }).catch(() => {})
  })
  await pagina.getByLabel('Correo institucional').fill('ana.torres@upla.edu.pe')
  await pagina.getByLabel('Contraseña', { exact: true }).fill('clave-cualquiera')
  await pagina.getByRole('button', { name: 'Ingresar' }).click()
  await pagina.getByRole('button', { name: 'Verificando credenciales…' }).waitFor()
  await capturar(pagina, destino, '03-login-carga', ancho)
  await pagina.unroute('**/api/auth/login')
}

async function capturarLogin(pagina, ancho) {
  await pagina.goto(`${BASE}/login`)
  await capturar(pagina, destino, '01-login-normal', ancho)
  await pagina.getByRole('button', { name: 'Ingresar' }).click()
  await pagina.getByText('Ingresa tu correo institucional.').waitFor()
  await capturar(pagina, destino, '02-login-errores', ancho)
  await pagina.reload()
  await capturarCarga(pagina, ancho)
}

let sesionAdmin
let sesionAna
let falloGeneral = false

try {
  // ============================ ESCRITORIO: flujo funcional + capturas ============================
  paso('Escritorio · login (normal, errores, carga)')
  const anonima = await nuevaPagina(navegador, 'escritorio')
  await capturarLogin(anonima, 'escritorio')

  paso('Escritorio · Carla Rojas (Administrador)')
  const admin = await nuevaPagina(navegador, 'escritorio')
  await iniciarSesion(admin, 'carla.rojas@upla.edu.pe')
  await admin.waitForURL('**/ambientes')
  await admin.getByRole('cell', { name: 'Laboratorio de Cómputo 2' }).waitFor()
  sesionAdmin = await leerSesion(admin)
  ok(`aterrizó en ${new URL(admin.url()).pathname}; menú: ${(await menu(admin)).join(', ')}`)
  await capturar(admin, destino, '06-ambientes', 'escritorio')
  await sinPalabrasPartidas(admin, 'ambientes (escritorio)')

  await admin.getByRole('button', { name: 'Nuevo ambiente' }).click()
  await admin.getByRole('heading', { name: 'Registrar ambiente' }).waitFor()
  await capturar(admin, destino, '07-ambiente-formulario', 'escritorio')
  await admin.getByRole('button', { name: 'Guardar ambiente' }).click()
  await admin.getByText('Ingresa el nombre del ambiente.').waitFor()
  await capturar(admin, destino, '07-ambiente-formulario-errores', 'escritorio')
  await admin.getByLabel('Nombre').fill('Laboratorio de Física')
  await admin.getByLabel('Tipo').selectOption('Laboratorio')
  await admin.getByLabel('Capacidad').fill('24')
  await admin.getByLabel('Ubicación').fill('Pabellón C, piso 1')
  await admin.getByLabel('Estado').selectOption('Disponible')
  await admin.getByLabel('Responsable').selectOption({ label: 'Mario Huamán' })
  await admin.getByRole('button', { name: 'Guardar ambiente' }).click()
  await admin.getByText('Ambiente registrado.').waitFor()
  await admin.getByRole('cell', { name: 'Laboratorio de Física' }).waitFor()
  ok('ambiente creado: "Ambiente registrado." y la fila aparece')

  await admin.getByRole('button', { name: 'Nuevo ambiente' }).click()
  await admin.getByLabel('Nombre').fill('laboratorio de física')
  await admin.getByLabel('Tipo').selectOption('Laboratorio')
  await admin.getByLabel('Capacidad').fill('24')
  await admin.getByLabel('Ubicación').fill('x')
  await admin.getByLabel('Estado').selectOption('Disponible')
  await admin.getByRole('button', { name: 'Guardar ambiente' }).click()
  await admin.getByText('Ya existe un ambiente con ese nombre.').waitFor()
  ok('nombre repetido: "Ya existe un ambiente con ese nombre."')

  await admin.getByRole('link', { name: 'Usuarios' }).click()
  await admin.getByRole('cell', { name: 'carla.rojas@upla.edu.pe' }).waitFor()
  await capturar(admin, destino, '08-usuarios', 'escritorio')
  await sinPalabrasPartidas(admin, 'usuarios (escritorio)')
  await admin.getByRole('button', { name: 'Nuevo usuario' }).click()
  await admin.getByRole('heading', { name: 'Registrar usuario' }).waitFor()
  await capturar(admin, destino, '09-usuario-formulario', 'escritorio')
  await admin.getByRole('button', { name: 'Guardar usuario' }).click()
  await admin.getByText('Ingresa el nombre completo.').waitFor()
  await capturar(admin, destino, '09-usuario-formulario-errores', 'escritorio')
  await admin.getByLabel('Nombre completo').fill('Luis Quispe')
  await admin.getByLabel('Correo institucional').fill('Luis.Quispe@UPLA.edu.pe')
  await admin.getByLabel('Rol').selectOption('Solicitante')
  await admin.getByRole('switch', { name: 'Activo' }).uncheck()
  await admin.getByLabel('Contraseña inicial', { exact: true }).fill(process.env.CLAVE_PRUEBA)
  await admin.getByRole('button', { name: 'Guardar usuario' }).click()
  await admin.getByText('Usuario registrado.').waitFor()
  await admin.getByRole('cell', { name: 'luis.quispe@upla.edu.pe' }).waitFor()
  ok('usuario inactivo creado; correo normalizado en la tabla')

  await admin.getByRole('button', { name: 'Nuevo usuario' }).click()
  await admin.getByLabel('Nombre completo').fill('Otra Ana')
  await admin.getByLabel('Correo institucional').fill('ana.torres@upla.edu.pe')
  await admin.getByLabel('Rol').selectOption('Solicitante')
  await admin.getByLabel('Contraseña inicial', { exact: true }).fill(process.env.CLAVE_PRUEBA)
  await admin.getByRole('button', { name: 'Guardar usuario' }).click()
  await admin.getByText('Ese correo ya está registrado.').waitFor()
  ok('correo repetido: "Ese correo ya está registrado."')
  await admin.getByRole('button', { name: 'Cerrar sesión' }).click()
  await admin.waitForURL('**/login')

  paso('Escritorio · Ana Torres (Solicitante)')
  const ana = await nuevaPagina(navegador, 'escritorio')
  await iniciarSesion(ana, 'ana.torres@upla.edu.pe')
  await ana.waitForURL('**/reservas/nueva')
  sesionAna = await leerSesion(ana)
  ok(`aterrizó en ${new URL(ana.url()).pathname}; menú: ${(await menu(ana)).join(', ')}`)
  await ana.getByRole('option', { name: /Laboratorio de Física/ }).waitFor({ state: 'attached' })
  await capturar(ana, destino, '04-nueva-reserva', 'escritorio')
  await ana.getByRole('button', { name: 'Registrar solicitud' }).click()
  await ana.getByText('Ingresa el motivo de la reserva.').waitFor()
  await capturar(ana, destino, '05-nueva-reserva-errores', 'escritorio')
  await ana.getByLabel('Ambiente').selectOption({ label: 'Laboratorio de Física' })
  await ana.getByLabel('Fecha').fill('')
  await ana.getByLabel('Fecha').pressSequentially(fechaRelativa(14).digitos)
  await ana.getByLabel('Hora de inicio').selectOption('14:00')
  const opcionesFin = await ana.getByLabel('Hora de fin').locator('option').allTextContents()
  ok(`hora de fin con inicio 14:00: ${opcionesFin[1]} a ${opcionesFin.at(-1)} (${opcionesFin.length - 1} opciones)`)
  await ana.getByLabel('Hora de fin').selectOption('16:00')
  await ana.getByLabel('Motivo').fill('Práctica de laboratorio de física')
  await ana.getByRole('button', { name: 'Registrar solicitud' }).click()
  await ana.getByText('Solicitud registrada. Quedó Pendiente de aprobación.').waitFor()
  await capturar(ana, destino, '10-nueva-reserva-cierre', 'escritorio')
  ok('reserva registrada: ' + (await ana.locator('dl').innerText()).replace(/\n+/g, ' | '))

  await ana.goto(`${BASE}/usuarios`)
  await ana.getByRole('heading', { name: 'Sin permiso' }).waitFor()
  ok('la Solicitante en /usuarios ve "Sin permiso"')
  await ana.getByRole('button', { name: 'Cerrar sesión' }).click()
  await ana.waitForURL('**/login')

  // ============================ 375 px: las mismas pantallas ============================
  paso('375 px · login (normal, errores, carga)')
  await capturarLogin(await nuevaPagina(navegador, 'movil'), 'movil')

  paso('375 px · Administrador')
  const adminMovil = await nuevaPagina(navegador, 'movil', sesionAdmin)
  await adminMovil.goto(`${BASE}/ambientes`)
  await adminMovil.getByRole('cell', { name: 'Laboratorio de Física' }).waitFor()
  await capturar(adminMovil, destino, '06-ambientes', 'movil')
  await adminMovil.getByRole('button', { name: 'Menú' }).click()
  await capturar(adminMovil, destino, '06-ambientes-menu-abierto', 'movil')
  await adminMovil.getByRole('link', { name: 'Ambientes' }).click()
  await adminMovil.getByRole('button', { name: 'Nuevo ambiente' }).click()
  await adminMovil.getByRole('heading', { name: 'Registrar ambiente' }).waitFor()
  await capturar(adminMovil, destino, '07-ambiente-formulario', 'movil')
  await adminMovil.getByRole('button', { name: 'Guardar ambiente' }).click()
  await adminMovil.getByText('Ingresa el nombre del ambiente.').waitFor()
  await capturar(adminMovil, destino, '07-ambiente-formulario-errores', 'movil')
  await adminMovil.goto(`${BASE}/usuarios`)
  await adminMovil.getByRole('cell', { name: 'luis.quispe@upla.edu.pe' }).waitFor()
  await capturar(adminMovil, destino, '08-usuarios', 'movil')
  await adminMovil.getByRole('button', { name: 'Nuevo usuario' }).click()
  await adminMovil.getByRole('heading', { name: 'Registrar usuario' }).waitFor()
  await capturar(adminMovil, destino, '09-usuario-formulario', 'movil')
  await adminMovil.getByRole('button', { name: 'Guardar usuario' }).click()
  await adminMovil.getByText('Ingresa el nombre completo.').waitFor()
  await capturar(adminMovil, destino, '09-usuario-formulario-errores', 'movil')

  paso('375 px · Solicitante')
  const anaMovil = await nuevaPagina(navegador, 'movil', sesionAna)
  await anaMovil.goto(`${BASE}/reservas/nueva`)
  await anaMovil.getByRole('option', { name: /Laboratorio de Física/ }).waitFor({ state: 'attached' })
  await capturar(anaMovil, destino, '04-nueva-reserva', 'movil')
  await separacionUniforme(anaMovil, ['ambienteId', 'fecha', 'horaInicio', 'horaFin'], 'nueva reserva (375 px)')
  await anaMovil.getByRole('button', { name: 'Registrar solicitud' }).click()
  await anaMovil.getByText('Ingresa el motivo de la reserva.').waitFor()
  await capturar(anaMovil, destino, '05-nueva-reserva-errores', 'movil')
  await anaMovil.getByLabel('Ambiente').selectOption({ label: 'Laboratorio de Física' })
  await anaMovil.getByLabel('Fecha').fill('')
  await anaMovil.getByLabel('Fecha').pressSequentially(fechaRelativa(16).digitos)
  await anaMovil.getByLabel('Hora de inicio').selectOption('08:00')
  await anaMovil.getByLabel('Hora de fin').selectOption('10:00')
  await anaMovil.getByLabel('Motivo').fill('Práctica de laboratorio de física')
  await anaMovil.getByRole('button', { name: 'Registrar solicitud' }).click()
  await anaMovil.getByText('Solicitud registrada. Quedó Pendiente de aprobación.').waitFor()
  await capturar(anaMovil, destino, '10-nueva-reserva-cierre', 'movil')
} catch (error) {
  console.log('\nFALLO:', error.message.split('\n').slice(0, 3).join(' / '))
  falloGeneral = true
} finally {
  await navegador.close()
}

const desbordadas = capturasConDesbordamiento()
console.log(`\nResumen: ${desbordadas.length === 0 ? 'ninguna pantalla con scroll horizontal' : 'CON scroll horizontal: ' + desbordadas.map((d) => d.nombre).join(', ')}`)
process.exitCode = falloGeneral || desbordadas.length > 0 ? 1 : 0
