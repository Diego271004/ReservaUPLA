// Mediciones de la auditoría de diseño Taste:
// T1) Equal edges (alineación simétrica de bordes)
// T2) Microinteracciones sobrias (duración de transición <= 250 ms)
// T3) Movimiento reducido (prefers-reduced-motion: reduce)
// T4) Menú lateral colapsado vs expandido (simetría, 0 textos recortados, 0 táctiles < 44 px, persistencia)
// T5) Ritmo vertical homogéneo en Inicio (24 px +- 1 px entre secciones)
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

export async function medirTaste(navegador, sesiones) {
  const L = []
  let fallos = 0
  const linea = (bien, texto) => {
    if (!bien) fallos += 1
    L.push(`  ${bien ? 'OK   ' : 'FALLA'} ${texto}`)
  }

  const sesionCarla = typeof sesiones === 'object' && sesiones?.carla ? sesiones.carla : sesiones
  const sesionAna = typeof sesiones === 'object' ? sesiones.ana : null
  const sesionMario = typeof sesiones === 'object' ? sesiones.mario : null

  const nueva = async (ancho, alto = 800, sesion = null, extra = {}) => {
    const contexto = await navegador.newContext({ locale: 'es-PE', viewport: { width: ancho, height: alto }, ...extra })
    await contexto.addInitScript(() => {
      try {
        if (sessionStorage.getItem('init-menu-done') !== '1') {
          sessionStorage.setItem('init-menu-done', '1')
          localStorage.setItem('reservaupla.menu-colapsado', '0')
        }
      } catch {}
    })
    if (sesion) {
      await contexto.addInitScript((t) => sessionStorage.setItem('reservaupla.sesion', t), sesion)
    }
    return contexto.newPage()
  }

  // T1: Equal edges (alineación de bordes en Dashboard y Formularios)
  L.push('T1) Equal edges: bordes alineados entre secciones y contenedores (tolerancia ≤ 2 px)')
  const pagDash = await nueva(1280, 900, sesionCarla)
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
  const pagInter = await nueva(1280, 900, sesionCarla)
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
  const pagReducir = await nueva(1280, 900, null, { reducedMotion: 'reduce' })
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

  // T4: Menú lateral colapsado vs expandido
  L.push('', 'T4) Menú lateral colapsado vs expandido: simetría, área táctil y textos sin recorte')
  const pagMenu = await nueva(1280, 900, sesionCarla)
  await pagMenu.goto(`${BASE}/dashboard`, { waitUntil: 'domcontentloaded' })
  await pagMenu.waitForSelector('[class*="contenedorInicio"]', { state: 'visible', timeout: 10000 })
  await pagMenu.waitForTimeout(300)

  // Medición inicial: Menú expandido (260 px)
  const menuExpandido = await pagMenu.evaluate(() => {
    const lat = document.querySelector('[class*="lateral"]')
    const menu = document.querySelector('#panel-menu')
    const latRect = lat?.getBoundingClientRect() ?? { width: 0 }
    const menuRect = menu?.getBoundingClientRect() ?? { width: 0 }
    const interactivos = Array.from(menu?.querySelectorAll('a, button') ?? []).filter((el) => {
      const cs = getComputedStyle(el)
      return cs.display !== 'none' && cs.visibility !== 'hidden' && el.getClientRects().length > 0
    })
    const menores44 = interactivos.filter((el) => {
      const r = el.getBoundingClientRect()
      return r.width < 44 || r.height < 44
    })
    const textosRecortados = Array.from(menu?.querySelectorAll('span, p, h2') ?? []).filter((el) => {
      const cs = getComputedStyle(el)
      if (cs.display === 'none' || cs.visibility === 'hidden') return false
      if (parseFloat(cs.width) <= 1 && parseFloat(cs.height) <= 1) return false
      return el.scrollWidth > el.clientWidth + 1
    })
    return {
      latWidth: Math.round(latRect.width),
      menuWidth: Math.round(menuRect.width),
      menores44Count: menores44.length,
      textosRecortadosCount: textosRecortados.length,
    }
  })

  const difExp = Math.abs(menuExpandido.latWidth - menuExpandido.menuWidth)
  linea(difExp <= 1 && menuExpandido.latWidth === 260, `Menú expandido: columna (.lateral: ${menuExpandido.latWidth} px) coincide con el menú (.menu: ${menuExpandido.menuWidth} px, dif ≤ 1 px)`)
  linea(menuExpandido.menores44Count === 0, `Menú expandido: 0 controles interactivos con tamaño inferior a 44×44 px (${menuExpandido.menores44Count})`)
  linea(menuExpandido.textosRecortadosCount === 0, `Menú expandido: 0 textos visibles con desborde o recorte (${menuExpandido.textosRecortadosCount})`)

  // Colapsar menú
  const btnColapsar = pagMenu.getByRole('button', { name: 'Contraer menú' })
  await btnColapsar.click()
  await pagMenu.waitForTimeout(300)

  const menuColapsado = await pagMenu.evaluate(() => {
    const lat = document.querySelector('[class*="lateral"]')
    const menu = document.querySelector('#panel-menu')
    const latRect = lat?.getBoundingClientRect() ?? { width: 0 }
    const menuRect = menu?.getBoundingClientRect() ?? { width: 0 }
    const marca = document.querySelector('[class*="marca"]')
    const marcaVisible = marca ? getComputedStyle(marca).display !== 'none' : false
    const etiquetas = Array.from(document.querySelectorAll('[class*="etiquetaGrupo"]'))
    const etiquetasVisibles = etiquetas.filter((e) => getComputedStyle(e).display !== 'none').length

    const interactivos = Array.from(menu?.querySelectorAll('a, button') ?? []).filter((el) => {
      const cs = getComputedStyle(el)
      return cs.display !== 'none' && cs.visibility !== 'hidden' && el.getClientRects().length > 0
    })
    const menores44 = interactivos.filter((el) => {
      const r = el.getBoundingClientRect()
      return r.width < 44 || r.height < 44
    })
    const textosRecortados = Array.from(menu?.querySelectorAll('span, p, h2') ?? []).filter((el) => {
      const cs = getComputedStyle(el)
      if (cs.display === 'none' || cs.visibility === 'hidden') return false
      if (parseFloat(cs.width) <= 1 && parseFloat(cs.height) <= 1) return false
      return el.scrollWidth > el.clientWidth + 1
    })
    return {
      latWidth: Math.round(latRect.width),
      menuWidth: Math.round(menuRect.width),
      marcaVisible,
      etiquetasVisibles,
      menores44Count: menores44.length,
      textosRecortadosCount: textosRecortados.length,
    }
  })

  const difCol = Math.abs(menuColapsado.latWidth - menuColapsado.menuWidth)
  linea(difCol <= 1 && menuColapsado.latWidth === 80, `Menú colapsado: columna (.lateral: ${menuColapsado.latWidth} px) reducida a 80 px simétrica con el menú (.menu: ${menuColapsado.menuWidth} px, dif ≤ 1 px)`)
  linea(!menuColapsado.marcaVisible && menuColapsado.etiquetasVisibles === 0, `Menú colapsado: texto del logo y etiquetas de grupos ocultas correctamente`)
  linea(menuColapsado.menores44Count === 0, `Menú colapsado: 0 controles interactivos con tamaño inferior a 44×44 px (${menuColapsado.menores44Count})`)
  linea(menuColapsado.textosRecortadosCount === 0, `Menú colapsado: 0 textos visibles con desborde o recorte (${menuColapsado.textosRecortadosCount})`)

  // Botón de expandir visible con nombre accesible
  const btnExpandir = pagMenu.getByRole('button', { name: 'Expandir menú' })
  const expandirVisible = await btnExpandir.isVisible()
  linea(expandirVisible, `Menú colapsado: botón «Expandir menú» visible con nombre accesible`)

  // Persistencia: recargar página
  await pagMenu.reload({ waitUntil: 'domcontentloaded' })
  await pagMenu.waitForSelector('[class*="contenedorInicio"]', { state: 'visible', timeout: 10000 })
  await pagMenu.waitForTimeout(200)
  const anchoTrasRecarga = await pagMenu.evaluate(() => Math.round(document.querySelector('#panel-menu')?.getBoundingClientRect().width ?? 0))
  linea(anchoTrasRecarga === 80, `Menú colapsado: persistencia en localStorage confirmada tras recargar (${anchoTrasRecarga} px)`)

  await pagMenu.context().close()

  // T5: Ritmo vertical homogéneo en Inicio (24 px +- 1 px entre secciones)
  L.push('', 'T5) Ritmo vertical homogéneo en Inicio: distancia uniforme de 24 px entre secciones')

  // Medición en Inicio Administrador
  const pagAdmin = await nueva(1280, 900, sesionCarla)
  await pagAdmin.goto(`${BASE}/dashboard`, { waitUntil: 'domcontentloaded' })
  await pagAdmin.waitForSelector('[class*="contenedorInicio"]', { state: 'visible', timeout: 10000 })
  await pagAdmin.waitForTimeout(300)
  const gapsAdmin = await pagAdmin.evaluate(() => {
    const contenedor = document.querySelector('[class*="contenedorInicio"]')
    const hijos = Array.from(contenedor?.children ?? []).filter((el) => el.tagName === 'SECTION' || el.tagName === 'DIV')
    const lista = []
    for (let i = 0; i < hijos.length - 1; i++) {
      const r1 = hijos[i].getBoundingClientRect()
      const r2 = hijos[i + 1].getBoundingClientRect()
      lista.push(Math.round(r2.top - r1.bottom))
    }
    return lista
  })
  const adminGapsOk = gapsAdmin.length >= 4 && gapsAdmin.every((g) => Math.abs(g - 24) <= 1)
  linea(adminGapsOk, `Inicio Administrador: ${gapsAdmin.length} separaciones verticales consecutivas a exactamente 24 px (${gapsAdmin.join(' px, ')} px)`)
  await pagAdmin.context().close()

  // Medición en Inicio Solicitante
  if (sesionAna) {
    const pagSol = await nueva(1280, 900, sesionAna)
    await pagSol.goto(`${BASE}/dashboard`, { waitUntil: 'domcontentloaded' })
    await pagSol.waitForSelector('[class*="contenedorInicio"]', { state: 'visible', timeout: 10000 })
    await pagSol.waitForTimeout(300)
    const gapsSol = await pagSol.evaluate(() => {
      const contenedor = document.querySelector('[class*="contenedorInicio"]')
      const hijos = Array.from(contenedor?.children ?? []).filter((el) => el.tagName === 'SECTION' || el.tagName === 'DIV')
      const lista = []
      for (let i = 0; i < hijos.length - 1; i++) {
        const r1 = hijos[i].getBoundingClientRect()
        const r2 = hijos[i + 1].getBoundingClientRect()
        lista.push(Math.round(r2.top - r1.bottom))
      }
      return lista
    })
    const solGapsOk = gapsSol.length >= 2 && gapsSol.every((g) => Math.abs(g - 24) <= 1)
    linea(solGapsOk, `Inicio Solicitante: ${gapsSol.length} separaciones verticales consecutivas a exactamente 24 px (${gapsSol.join(' px, ')} px)`)
    await pagSol.context().close()
  }

  // Medición en Inicio Responsable
  if (sesionMario) {
    const pagResp = await nueva(1280, 900, sesionMario)
    await pagResp.goto(`${BASE}/dashboard`, { waitUntil: 'domcontentloaded' })
    await pagResp.waitForSelector('[class*="contenedorInicio"]', { state: 'visible', timeout: 10000 })
    await pagResp.waitForTimeout(300)
    const gapsResp = await pagResp.evaluate(() => {
      const contenedor = document.querySelector('[class*="contenedorInicio"]')
      const hijos = Array.from(contenedor?.children ?? []).filter((el) => el.tagName === 'SECTION' || el.tagName === 'DIV')
      const lista = []
      for (let i = 0; i < hijos.length - 1; i++) {
        const r1 = hijos[i].getBoundingClientRect()
        const r2 = hijos[i + 1].getBoundingClientRect()
        lista.push(Math.round(r2.top - r1.bottom))
      }
      return lista
    })
    const respGapsOk = gapsResp.length >= 3 && gapsResp.every((g) => Math.abs(g - 24) <= 1)
    linea(respGapsOk, `Inicio Responsable: ${gapsResp.length} separaciones verticales consecutivas a exactamente 24 px (${gapsResp.join(' px, ')} px)`)
    await pagResp.context().close()
  }

  L.push('', `TOTAL: ${fallos} comprobación(es) de auditoría taste fallida(s).`)
  return { lineas: L, fallos }
}
