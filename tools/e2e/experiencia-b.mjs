import { BASE, abrirNavegador, capturar, carpeta, iniciarSesion, leerSesion, nuevaPagina, ok, paso } from './lib.mjs'

const navegador = await abrirNavegador()
const destino = carpeta('docs', 'evidencias', 'experiencia')

async function login(pagina, correo) {
  await iniciarSesion(pagina, correo)
  await pagina.waitForURL('**/dashboard')
  return leerSesion(pagina)
}

try {
  paso('Sub-fase B: inicio de cada rol')
  const roles = [
    ['admin', 'carla.rojas@upla.edu.pe', 'Requieren tu decisión', 'B-admin-inicio-datos'],
    ['solicitante', 'ana.torres@upla.edu.pe', 'Tu próxima reserva', 'B-solicitante-inicio-datos'],
    ['responsable', 'mario.huaman@upla.edu.pe', 'Hoy en tu ambiente', 'B-responsable-inicio-datos'],
  ]
  const sesiones = {}
  for (const ancho of ['escritorio', 'movil']) {
    for (const [nombre, correo, titulo, prefijo] of roles) {
      const pagina = await nuevaPagina(navegador, ancho, sesiones[nombre])
      if (!sesiones[nombre]) {
        await login(pagina, correo)
        sesiones[nombre] = await leerSesion(pagina)
      } else {
        await pagina.goto(`${BASE}/dashboard`)
      }
      await pagina.getByRole('heading', { name: titulo }).waitFor()
      await capturar(pagina, destino, prefijo, ancho)
      ok(`${nombre}: inicio visible a ${ancho}`)
    }
  }
} finally {
  await navegador.close()
}
