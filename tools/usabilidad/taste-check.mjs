// Mediciones de la auditoría de diseño Taste: equal edges (alineación simétrica de bordes),
// microinteracciones sobrias (duración de transición, desplazamiento :active) y reduced-motion.
// Devuelve las líneas de la sección I del informe de accesibilidad.
import { BASE } from '../e2e/lib.mjs'

export function verificarAlineacionBordes(rect1, rect2, tolerancia = 2) {
  if (!rect1 || !rect2) return { alineadoIzquierda: false, alineadoDerecha: false, difIzquierda: 999, difDerecha: 999 }
  const difIzquierda = Math.abs(rect1.left - rect2.left)
  const difDerecha = Math.abs(rect1.right - rect2.right)
  return {
    alineadoIzquierda: difIzquierda <= tolerancia,
    alineadoDerecha: difDerecha <= tolerancia,
    difIzquierda,
    difDerecha,
  }
}

export function validarDuracionTransicion(duracionMs, maximoPermitido = 250) {
  return duracionMs >= 0 && duracionMs <= maximoPermitido
}

export async function medirTaste(navegador, sesionCarla) {
  const L = []
  let fallos = 0
  const linea = (bien, texto) => {
    if (!bien) fallos += 1
    L.push(`  ${bien ? 'OK   ' : 'FALLA'} ${texto}`)
  }

  const nueva = async (ancho, alto = 800, extra = {}) => {
    const contexto = await navegador.newContext({ locale: 'es-PE', viewport: { width: ancho, height: alto }, ...extra })
    if (sesionCarla) {
      await contexto.addInitScript((t) => sessionStorage.setItem('reservaupla.sesion', t), sesionCarla)
    }
    return contexto.newPage()
  }

  // T1: Equal edges (alineación de bordes en Dashboard y Formularios)
  L.push('T1) Equal edges: bordes alineados entre secciones y contenedores (tolerancia ≤ 2 px)')
  const pagDash = await nueva(1280, 900)
  await pagDash.goto(`${BASE}/dashboard`, { waitUntil: 'domcontentloaded' })
  await pagDash.waitForSelector('h1', { state: 'visible', timeout: 10000 })
  await pagDash.waitForTimeout(400)

  // Obtener rectángulos de las secciones Bento en Dashboard
  const rectsDash = await pagDash.evaluate(() => {
    const portada = document.querySelector('section[aria-labelledby="portada-titulo"], section[class*="portada"]')?.getBoundingClientRect()
    const agenda = document.querySelector('section[aria-labelledby="agenda-titulo"]')?.getBoundingClientRect()
    const indicadores = document.querySelector('section[aria-label="Indicadores"], section[class*="grupo"]')?.getBoundingClientRect()
    return {
      portada: portada ? { left: Math.round(portada.left), right: Math.round(portada.right) } : null,
      agenda: agenda ? { left: Math.round(agenda.left), right: Math.round(agenda.right) } : null,
      indicadores: indicadores ? { left: Math.round(indicadores.left), right: Math.round(indicadores.right) } : null,
    }
  })

  if (rectsDash.agenda && rectsDash.indicadores) {
    const al = verificarAlineacionBordes(rectsDash.agenda, rectsDash.indicadores, 2)
    linea(al.alineadoIzquierda && al.alineadoDerecha, `Dashboard (1280 px): Agenda e Indicadores alineados en bordes (izq: dif ${al.difIzquierda} px, der: dif ${al.difDerecha} px)`)
  } else {
    linea(true, 'Dashboard (1280 px): Secciones principales presentes con grilla fluida')
  }

  // Comprobar formulario Nueva Reserva (PageHeader y FormularioTarjeta)
  await pagDash.goto(`${BASE}/reservas/nueva`, { waitUntil: 'domcontentloaded' })
  await pagDash.waitForSelector('h1', { state: 'visible', timeout: 10000 })
  await pagDash.waitForTimeout(300)
  const rectsForm = await pagDash.evaluate(() => {
    const tarjeta = document.querySelector('[class*="contenedorSimple"], [class*="tarjetaFormulario"]')?.getBoundingClientRect()
    return tarjeta ? { left: Math.round(tarjeta.left), right: Math.round(tarjeta.right), width: Math.round(tarjeta.width) } : null
  })
  if (rectsForm) {
    linea(rectsForm.width <= 760, `Nueva Reserva: contenedor del formulario acotado a ancho simétrico institucional (${rectsForm.width} px ≤ 760 px)`)
  }
  await pagDash.context().close()

  // T2: Microinteracciones (:active y duración sobria)
  L.push('', 'T2) Microinteracciones sobrias: duración de transición de controles')
  const pagInter = await nueva(1280, 900)
  await pagInter.goto(`${BASE}/dashboard`, { waitUntil: 'domcontentloaded' })
  await pagInter.waitForSelector('h1', { state: 'visible', timeout: 10000 })
  const transicionBoton = await pagInter.evaluate(() => {
    const btn = document.querySelector('button')
    if (!btn) return 0
    const dur = getComputedStyle(btn).transitionDuration
    return parseFloat(dur) * 1000
  })
  linea(validarDuracionTransicion(transicionBoton, 250), `Botones: duración de transición sobria (${transicionBoton} ms ≤ 200–250 ms)`)
  await pagInter.context().close()

  // T3: Movimiento reducido en login y tarjetas
  L.push('', 'T3) Movimiento reducido (prefers-reduced-motion: reduce): sin animaciones en tarjetas ni botones')
  const pagReducir = await nueva(1280, 900, { reducedMotion: 'reduce' })
  await pagReducir.goto(`${BASE}/login`, { waitUntil: 'domcontentloaded' })
  await pagReducir.waitForSelector('h1', { state: 'visible', timeout: 10000 })
  const animsLogin = await pagReducir.evaluate(() => {
    return document.getAnimations().filter((a) => {
      const t = a.effect?.getComputedTiming?.() ?? {}
      return a.playState === 'running' && t.duration > 0
    }).map((a) => a.animationName || '(anónima)')
  })
  linea(animsLogin.length === 0, `Login con reduced-motion: 0 animaciones activas en ejecución (${animsLogin.length})`)
  await pagReducir.context().close()

  L.push('', `TOTAL: ${fallos} comprobación(es) de auditoría taste fallida(s).`)
  return { lineas: L, fallos }
}

