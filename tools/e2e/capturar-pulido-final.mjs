import { mkdirSync, readdirSync, statSync } from 'node:fs'
import { join, resolve } from 'node:path'
import { BASE, CLAVE, abrirNavegador, aprobarReservaApi, crearReservaApi, iniciarSesion, leerSesion, nuevaPagina, RAIZ } from './lib.mjs'
import { detenerEntorno, iniciarEntorno, reiniciarBaseYApi } from './entorno.mjs'
import { comprobarSinRecorteDisponibilidad } from './recorte-helper.mjs'

const DESTINO_FINAL = resolve(RAIZ, 'docs/evidencias/pulido/final')
const DESTINO_PULIDO = resolve(RAIZ, 'docs/evidencias/pulido')
mkdirSync(DESTINO_FINAL, { recursive: true })
mkdirSync(DESTINO_PULIDO, { recursive: true })

const RESOLUCIONES = [[1280, 900], [375, 812]]

function obtenerMaxMtime(dir) {
  let max = 0
  for (const entrada of readdirSync(dir, { withFileTypes: true })) {
    const ruta = join(dir, entrada.name)
    if (entrada.isDirectory()) max = Math.max(max, obtenerMaxMtime(ruta))
    else if (entrada.isFile()) max = Math.max(max, statSync(ruta).mtimeMs)
  }
  return max
}

async function esperarCargaCompleta(pagina) {
  await pagina.waitForSelector('h1', { state: 'visible', timeout: 15000 })
  await pagina.waitForFunction(() => {
    const esqueletos = document.querySelectorAll('[class*="esqueleto"], [class*="cargando"], [role="status"]:has-text("Cargando")')
    return esqueletos.length === 0
  }, { timeout: 15000 }).catch(() => {})
  await pagina.waitForTimeout(400)
}

function validarCaptura(rutaArchivo, nombre, maxMtimeSrc) {
  const stats = statSync(rutaArchivo)
  if (stats.size < 10240) throw new Error(`Defecto: captura ${nombre} pesa solo ${stats.size} B (<10 KB).`)
  if (stats.mtimeMs < maxMtimeSrc) throw new Error(`Defecto: captura ${nombre} es anterior a modificación en frontend/src.`)
}

async function capturarPantallaReal(
  navegador,
  nombre,
  ruta,
  sesion,
  resoluciones,
  accion = null,
  destino = DESTINO_FINAL,
  maxMtimeSrc = 0,
) {
  for (const [ancho, alto] of resoluciones) {
    const sufijo = String(ancho)
    const nombreArchivo = `${nombre}-${sufijo}.png`
    const rutaArchivo = resolve(destino, nombreArchivo)

    const contexto = await navegador.newContext({
      viewport: { width: ancho, height: alto },
      locale: 'es-PE',
    })

    if (sesion) {
      await contexto.addInitScript(
        (texto) => sessionStorage.setItem('reservaupla.sesion', texto),
        sesion,
      )
    }

    const pagina = await contexto.newPage()
    await pagina.goto(`${BASE}${ruta}`, { waitUntil: 'domcontentloaded' })

    if (accion) {
      await accion(pagina, ancho)
    }

    await esperarCargaCompleta(pagina)
    await pagina.screenshot({ path: rutaArchivo, fullPage: true })
    validarCaptura(rutaArchivo, nombreArchivo, maxMtimeSrc)
    console.log(`  OK  ${nombreArchivo} (${statSync(rutaArchivo).size} bytes)`)

    await contexto.close()
  }
}

async function ejecutar() {
  console.log('== Iniciando entorno real para capturas de pulido ==')
  await iniciarEntorno()
  await reiniciarBaseYApi()

  const maxMtimeSrc = obtenerMaxMtime(resolve(RAIZ, 'frontend/src'))
  console.log(`Referencia mtime frontend/src: ${new Date(maxMtimeSrc).toISOString()}`)

  const navegador = await abrirNavegador()

  try {
    console.log('== Autenticando usuarios de prueba ==')
    const obtenerSesionUsuario = async (correo) => {
      const contexto = await navegador.newContext({ locale: 'es-PE' })
      const pag = await contexto.newPage()
      await iniciarSesion(pag, correo, CLAVE)
      await pag.waitForURL('**/dashboard')
      const sesion = await leerSesion(pag)
      await contexto.close()
      return sesion
    }

    const sesionAdmin = await obtenerSesionUsuario('carla.rojas@upla.edu.pe')
    const sesionSolicitante = await obtenerSesionUsuario('ana.torres@upla.edu.pe')
    const sesionResponsable = await obtenerSesionUsuario('mario.huaman@upla.edu.pe')

    console.log('\n== Generando las 36 capturas finales del sistema real (18 pantallas x 2 res) ==')

    const cap = (nom, rut, ses, res = RESOLUCIONES, acc = null, dest = DESTINO_FINAL) =>
      capturarPantallaReal(navegador, nom, rut, ses, res, acc, dest, maxMtimeSrc)

    // 01 a 15
    await cap('01-login', '/login', null)
    await cap('02-inicio-admin', '/dashboard', sesionAdmin)
    await cap('03-inicio-solicitante', '/dashboard', sesionSolicitante)
    await cap('04-inicio-responsable', '/dashboard', sesionResponsable)
    await cap('05-nueva-reserva', '/reservas/nueva', sesionAdmin)
    await cap('06-nueva-reserva-cierre', '/reservas/nueva', sesionAdmin, RESOLUCIONES, async (pag) => {
      await pag.waitForSelector('[role="radio"]:has-text("Auditorio Principal")', { timeout: 10000 })
      await pag.click('[role="radio"]:has-text("Auditorio Principal")')
      await pag.waitForTimeout(300)
    })
    await cap('07-detalle-reserva', '/reservas/1', sesionAdmin)
    await cap('08-detalle-conflicto', '/reservas/2', sesionAdmin)
    await cap('09-reservas-admin', '/reservas', sesionAdmin)
    await cap('10-ambientes', '/ambientes', sesionAdmin)
    await cap('11-ambiente-nuevo', '/ambientes/nuevo', sesionAdmin)
    await cap('12-usuarios', '/usuarios', sesionAdmin)
    await cap('13-usuario-nuevo', '/usuarios/nuevo', sesionAdmin)
    await cap('14-403-sin-permiso', '/usuarios', sesionSolicitante)
    await cap('15-404-no-encontrada', '/ruta-inexistente-404', sesionAdmin)

    // Crear reservas en fecha futura (2026-11-24) para que en 16-disponibilidad
    // convivan en una sola pantalla interactiva: Libre («+» habilitado), Aprobada (verde),
    // Pendiente (ámbar) y Mantenimiento (gris).
    const tokenCarla = JSON.parse(sesionAdmin).token
    const tokenAna = JSON.parse(sesionSolicitante).token

    const idAprobada = await crearReservaApi(
      tokenAna,
      1,
      '2026-11-24',
      '10:00',
      '12:00',
      'Taller de redes y servidores',
    )
    await aprobarReservaApi(tokenCarla, idAprobada)

    await crearReservaApi(
      tokenAna,
      1,
      '2026-11-24',
      '14:00',
      '16:00',
      'Capacitación docente',
    )

    // 16-disponibilidad (fecha futura 2026-11-24 interactiva con Aprobada, Pendiente, Libre y Mantenimiento)
    await cap(
      '16-disponibilidad',
      '/disponibilidad?fecha=2026-11-24',
      sesionAdmin,
      RESOLUCIONES,
      async (pag, ancho) => {
        await pag.waitForSelector('#fechaDisponibilidad', { timeout: 10000 })
        const valorFecha = await pag.inputValue('#fechaDisponibilidad')
        if (valorFecha !== '24/11/2026') {
          throw new Error(`Defecto: se esperaba fecha 24/11/2026 pero el campo tiene ${valorFecha}`)
        }
        await pag.waitForSelector('[class*="aprobada"]', { timeout: 10000 })
        await pag.waitForSelector('[class*="pendiente"]', { timeout: 10000 })
        await pag.waitForSelector('[class*="mantenimiento"]', { timeout: 10000 })
        await pag.waitForSelector('[class*="libre"]:not(:disabled)', { timeout: 10000 })

        // Comprobación real de no recorte en el navegador (scrollWidth <= clientWidth)
        await comprobarSinRecorteDisponibilidad(pag, ancho)

        // Comprobación dirigida a 188 px (zoom 200 % móvil)
        if (ancho === 1280) {
          const ctx188 = await pag.context().browser().newContext({
            viewport: { width: 188, height: 600 },
            locale: 'es-PE',
          })
          await ctx188.addInitScript(
            (t) => sessionStorage.setItem('reservaupla.sesion', t),
            sesionAdmin,
          )
          const pag188 = await ctx188.newPage()
          await pag188.goto(pag.url(), { waitUntil: 'domcontentloaded' })
          await esperarCargaCompleta(pag188)
          await comprobarSinRecorteDisponibilidad(pag188, 188)
          await ctx188.close()
        }
      },
    )

    // 17-disponibilidad-dia-libre (fecha futura 2026-11-25 sin reservas, mostrando aviso de día libre y tramos disponibles)
    await cap(
      '17-disponibilidad-dia-libre',
      '/disponibilidad?fecha=2026-11-25',
      sesionAdmin,
      RESOLUCIONES,
      async (pag, ancho) => {
        await pag.waitForSelector('#fechaDisponibilidad', { timeout: 10000 })
        const valorFecha = await pag.inputValue('#fechaDisponibilidad')
        if (valorFecha !== '25/11/2026') {
          throw new Error(`Defecto: se esperaba fecha 25/11/2026 pero el campo tiene ${valorFecha}`)
        }
        await pag.waitForSelector('text=Día libre en todos los ambientes', { timeout: 10000 })
        await comprobarSinRecorteDisponibilidad(pag, ancho)
      },
    )

    // 18-disponibilidad-dia-pasado (fecha 2026-11-05 en el pasado, con reservas atenuadas y de solo lectura)
    await cap(
      '18-disponibilidad-dia-pasado',
      '/disponibilidad?fecha=2026-11-05',
      sesionAdmin,
      RESOLUCIONES,
      async (pag, ancho) => {
        await pag.waitForSelector('#fechaDisponibilidad', { timeout: 10000 })
        const valorFecha = await pag.inputValue('#fechaDisponibilidad')
        if (valorFecha !== '05/11/2026') {
          throw new Error(`Defecto: se esperaba fecha 05/11/2026 pero el campo tiene ${valorFecha}`)
        }
        await pag.waitForSelector('[class*="pendiente"]', { timeout: 10000 })
        await pag.waitForSelector('[class*="mantenimiento"]', { timeout: 10000 })
        await comprobarSinRecorteDisponibilidad(pag, ancho)
      },
    )

    console.log('\n== Regenerando capturas intermedias P1 a P5 con el sistema real ==')
    // P1
    await cap('P1-resumen-vivo-vacio', '/reservas/nueva', sesionAdmin, RESOLUCIONES, null, DESTINO_PULIDO)
    const prepararReserva = async (pag, conHoras = false, conMotivo = false) => {
      await pag.waitForSelector('[role="radio"]:has-text("Auditorio Principal")', { timeout: 10000 })
      await pag.click('[role="radio"]:has-text("Auditorio Principal")')
      if (conHoras) {
        await pag.fill('input[name="fecha"]', '20/11/2026')
        await pag.selectOption('select[name="horaInicio"]', '09:00')
        await pag.waitForTimeout(200)
        await pag.click('button:has-text("2 h")')
      }
      if (conMotivo) await pag.fill('textarea[name="motivo"]', 'Conferencia académica de sistemas')
      await pag.waitForTimeout(300)
    }
    await cap('P1-tarjeta-ambiente-seleccionada', '/reservas/nueva', sesionAdmin, RESOLUCIONES, (p) => prepararReserva(p), DESTINO_PULIDO)
    await cap('P1-atajos-duracion', '/reservas/nueva', sesionAdmin, RESOLUCIONES, (p) => prepararReserva(p, true), DESTINO_PULIDO)
    await cap('P1-resumen-vivo-elegido', '/reservas/nueva', sesionAdmin, RESOLUCIONES, (p) => prepararReserva(p, true, true), DESTINO_PULIDO)

    // P2
    await cap('P2-columna-ambientes', '/disponibilidad?fecha=2026-11-05', sesionAdmin, RESOLUCIONES, null, DESTINO_PULIDO)
    await cap('P2-tramos-libres-y-pasados', '/disponibilidad?fecha=2026-11-05', sesionAdmin, RESOLUCIONES, null, DESTINO_PULIDO)
    await cap('P2-eje-tiempo-etiqueta-ahora', '/disponibilidad?fecha=2026-11-05', sesionAdmin, RESOLUCIONES, null, DESTINO_PULIDO)

    // P3
    await cap('P3-indicadores-admin', '/dashboard', sesionAdmin, RESOLUCIONES, null, DESTINO_PULIDO)
    await cap('P3-indicadores-solicitante-responsable', '/dashboard', sesionSolicitante, [[1280, 900]], null, DESTINO_PULIDO)
    await cap('P3-ambiente-mas-usado-empate', '/dashboard', sesionAdmin, RESOLUCIONES, null, DESTINO_PULIDO)

    // P4
    await cap('P4-topbar-miga', '/reservas/nueva', sesionAdmin, [[1280, 900], [375, 812], [188, 600]], null, DESTINO_PULIDO)
    await cap('P4-menu-secciones', '/dashboard', sesionAdmin, [[1280, 900]], null, DESTINO_PULIDO)
    await cap('P4-microinteracciones-hover', '/ambientes', sesionAdmin, [[1280, 900]], null, DESTINO_PULIDO)

    // P5
    await cap('P5-vacio-reservas', '/reservas?estado=Cancelada&ambienteId=1', sesionAdmin, RESOLUCIONES, null, DESTINO_PULIDO)
    await cap('P5-vacio-usuarios', '/usuarios?buscar=inexistente', sesionAdmin, [[1280, 900]], null, DESTINO_PULIDO)
    await cap('P5-vacio-mi-ambiente', '/mi-ambiente', sesionResponsable, [[1280, 900]], null, DESTINO_PULIDO)

    console.log('\n== Verificación final de capturas completada con éxito ==')
  } finally {
    await navegador.close()
    detenerEntorno()
  }
}

ejecutar().catch((err) => {
  console.error('\nFALLO AL GENERAR CAPTURAS:', err)
  detenerEntorno()
  process.exit(1)
})
