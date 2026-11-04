// Comprobación del Layout tras usar el componente Button: botón del menú en móvil (cerrado y abierto) y "Cerrar sesión".
import { BASE, abrirNavegador, capturar, carpeta, iniciarSesion, leerSesion, nuevaPagina, ok, paso } from './lib.mjs'

const destino = carpeta('docs', 'evidencias', 'fase7')
const navegador = await abrirNavegador()
let fallo = false
try {
  const admin = await nuevaPagina(navegador, 'escritorio')
  await iniciarSesion(admin, 'carla.rojas@upla.edu.pe')
  await admin.waitForURL('**/dashboard')
  await admin.goto(`${BASE}/ambientes`)
  const sesion = await leerSesion(admin)

  paso('Escritorio: el botón del menú no se ve y "Cerrar sesión" sí')
  if (await admin.getByRole('button', { name: 'Menú' }).isVisible()) throw new Error('el botón Menú se ve en escritorio')
  ok('botón Menú oculto en 1280 px')
  await admin.getByRole('button', { name: 'Cerrar sesión' }).waitFor()
  await capturar(admin, destino, '10-layout', 'escritorio')

  paso('375 px: Menú abre y cierra el panel; Cerrar sesión funciona')
  const movil = await nuevaPagina(navegador, 'movil', sesion)
  await movil.goto(`${BASE}/ambientes`)
  const menu = movil.getByRole('button', { name: 'Menú' })
  await menu.waitFor()
  if ((await menu.getAttribute('aria-expanded')) !== 'false') throw new Error('aria-expanded debería ser false')
  if (await movil.getByRole('button', { name: 'Cerrar sesión' }).isVisible()) throw new Error('el panel debería estar cerrado')
  await capturar(movil, destino, '10-layout-menu-cerrado', 'movil')
  await menu.click()
  if ((await menu.getAttribute('aria-expanded')) !== 'true') throw new Error('aria-expanded debería ser true')
  await movil.getByRole('button', { name: 'Cerrar sesión' }).waitFor({ state: 'visible' })
  ok('el panel se abre con aria-expanded=true')
  await capturar(movil, destino, '11-layout-menu-abierto', 'movil')
  await movil.getByRole('button', { name: 'Cerrar sesión' }).click()
  await movil.waitForURL('**/login')
  ok('Cerrar sesión lleva al login')
} catch (error) {
  fallo = true
  console.error('FALLO:', error.message)
} finally {
  await navegador.close()
}
console.log(fallo ? 'Resultado: CON FALLOS' : 'Resultado: todo correcto')
process.exit(fallo ? 1 : 0)
