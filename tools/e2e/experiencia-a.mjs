// Capturas y comprobaciones de la sub-fase A del rediseño de experiencia: menú colapsable, barra superior, menú de usuario,
// contador de pendientes, avisos (toasts) y menú móvil. Escribe en docs/evidencias/experiencia/.
// Requiere la API (5263) y el frontend (5180) en marcha y CLAVE_PRUEBA.
import { BASE, abrirNavegador, capturar, carpeta, iniciarSesion, leerSesion, nuevaPagina, ok, paso } from './lib.mjs'

const destino = carpeta('docs', 'evidencias', 'experiencia')
const navegador = await abrirNavegador()
let fallo = false
const exigir = (condicion, mensaje) => {
  if (!condicion) throw new Error(mensaje)
  ok(mensaje)
}

try {
  const admin = await nuevaPagina(navegador, 'escritorio')
  await iniciarSesion(admin, 'carla.rojas@upla.edu.pe')
  await admin.waitForURL('**/dashboard')
  const sesion = await leerSesion(admin)

  paso('Escritorio: menú con iconos, barra superior, fecha y contador de pendientes')
  await admin.getByRole('heading', { name: 'Inicio', level: 1 }).waitFor()
  await admin.getByText(/^Mostrando/).waitFor() // espera a que lleguen los datos y el contador
  const enlaceReservas = admin.getByRole('navigation', { name: 'Principal' }).getByRole('link', { name: /^Reservas/ })
  const nombreReservas = (await enlaceReservas.textContent()).trim()
  console.log(`   enlace Reservas: «${nombreReservas}»`)
  await capturar(admin, destino, 'A1-inicio-menu-expandido', 'escritorio')

  paso('Escritorio: menú contraído (se recuerda al recargar)')
  await admin.getByRole('button', { name: 'Contraer menú' }).click()
  await admin.waitForTimeout(300)
  await capturar(admin, destino, 'A2-menu-contraido', 'escritorio')
  await admin.reload()
  await admin.getByRole('button', { name: 'Expandir menú' }).waitFor()
  exigir(true, 'la preferencia de menú contraído sobrevive a recargar la página')
  await admin.getByRole('button', { name: 'Expandir menú' }).click()

  paso('Escritorio: menú de usuario abierto')
  await admin.getByRole('button', { name: /Carla Rojas/ }).click()
  await admin.getByRole('button', { name: 'Cerrar sesión' }).waitFor()
  await capturar(admin, destino, 'A3-menu-de-usuario', 'escritorio')
  await admin.keyboard.press('Escape')

  paso('Escritorio: foco por teclado en el menú lateral')
  await admin.getByRole('link', { name: 'Inicio' }).focus()
  await admin.keyboard.press('Tab')
  await capturar(admin, destino, 'A4-foco-menu', 'escritorio')

  paso('Escritorio: el detalle muestra las migas y el contador se actualiza al decidir')
  await admin.getByRole('button', { name: /^Ver detalle/ }).first().click()
  await admin.waitForURL('**/reservas/*')
  await admin.getByRole('navigation', { name: 'Migas de pan' }).waitFor()
  await capturar(admin, destino, 'A5-detalle-migas', 'escritorio')
  await admin.getByRole('button', { name: 'Rechazar', exact: true }).click()
  await admin.getByRole('dialog').getByRole('button', { name: /^Sí, rechazar/ }).click()
  await admin.getByText('Reserva rechazada.').waitFor()
  await capturar(admin, destino, 'A6-aviso-exito', 'escritorio')
  const despues = (await enlaceReservas.textContent()).trim()
  console.log(`   enlace Reservas tras rechazar: «${despues}»`)
  exigir(despues !== nombreReservas || !/\d/.test(despues), 'el contador de pendientes cambió tras rechazar')

  paso('375 px: barra superior, panel deslizante y menú de usuario')
  const movil = await nuevaPagina(navegador, 'movil', sesion)
  await movil.goto(`${BASE}/dashboard`)
  await movil.getByRole('button', { name: 'Menú', exact: true }).waitFor()
  await movil.getByText(/^Mostrando/).waitFor()
  await capturar(movil, destino, 'A7-inicio-barra', 'movil')
  await movil.getByRole('button', { name: 'Menú', exact: true }).click()
  await movil.getByRole('button', { name: 'Cerrar menú' }).waitFor({ state: 'visible' })
  await movil.waitForTimeout(300)
  await movil.screenshot({ path: `${destino}/A8-panel-abierto-movil.png` }) // solo la ventana: el panel es fijo y la página completa lo dejaría a medias
  await movil.keyboard.press('Escape')
  exigir((await movil.getByRole('button', { name: 'Menú', exact: true }).getAttribute('aria-expanded')) === 'false', 'Escape cierra el panel móvil')
  await movil.getByRole('button', { name: /Carla Rojas/ }).click()
  await movil.getByRole('button', { name: 'Cerrar sesión' }).waitFor()
  await movil.screenshot({ path: `${destino}/A9-menu-de-usuario-movil.png` })
} catch (error) {
  fallo = true
  console.error('FALLO:', error.message)
} finally {
  await navegador.close()
}
process.exit(fallo ? 1 : 0)
