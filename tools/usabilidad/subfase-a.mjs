// Mediciones propias de la sub-fase A del rediseño de experiencia (layout): contador sobre fondo marino, menú contraído,
// menú de usuario con teclado, panel móvil, zoom 200 % y movimiento reducido. Devuelve las líneas de la sección H del informe.
// Se llama desde accesibilidad.mjs con ETAPA=experiencia (que ya dejó la base, la API y las sesiones listas).
import { createRequire } from 'node:module'
import { BASE } from '../e2e/lib.mjs'
import { razon } from './contraste.mjs'

const requerir = createRequire(import.meta.url)
const RUTA_AXE = requerir.resolve('axe-core/axe.min.js')
const ETIQUETAS = ['wcag2a', 'wcag2aa', 'wcag21a', 'wcag21aa', 'wcag22aa', 'best-practice']
const hex = ([r, g, b]) => `#${[r, g, b].map((c) => Number(c).toString(16).padStart(2, '0')).join('')}`

/** Colores calculados por el navegador: texto y primer fondo opaco hacia arriba. */
const colores = (pagina, selector) =>
  pagina.evaluate((s) => {
    const el = document.querySelector(s)
    if (!el) return null
    const nums = (c) => c.match(/[\d.]+/g).map(Number)
    let fondo = null
    for (let n = el; n && !fondo; n = n.parentElement) {
      const c = nums(getComputedStyle(n).backgroundColor)
      if (c.length === 3 || c[3] === 1) fondo = c.slice(0, 3)
    }
    return { texto: nums(getComputedStyle(el).color).slice(0, 3), fondo }
  }, selector)

async function axeYTactiles(pagina) {
  await pagina.addScriptTag({ path: RUTA_AXE })
  const axe = await pagina.evaluate(
    async (etiquetas) => (await window.axe.run(document, { runOnly: { type: 'tag', values: etiquetas } })).violations.map((v) => `${v.id}×${v.nodes.length}`),
    ETIQUETAS,
  )
  const pequenos = await pagina.evaluate(() => {
    const visible = (el) => getComputedStyle(el).visibility !== 'hidden' && el.getClientRects().length > 0
    return [...document.querySelectorAll('a[href], button, input, select, textarea')]
      .filter((el) => visible(el) && !el.disabled)
      .map((el) => ({ el: `${el.tagName.toLowerCase()} «${(el.getAttribute('aria-label') || el.textContent).trim().slice(0, 30)}»`, r: el.getBoundingClientRect() }))
      .filter(({ r }) => r.width < 44 || r.height < 44)
      .map(({ el, r }) => `${el} ${Math.round(r.width)}×${Math.round(r.height)}`)
  })
  return { axe, pequenos }
}

const desborde = (pagina) => pagina.evaluate(() => ({ ancho: document.documentElement.scrollWidth, visible: document.documentElement.clientWidth }))

export async function medirSubfaseA(navegador, sesionCarla) {
  const L = []
  let fallos = 0
  const linea = (bien, texto) => {
    if (!bien) fallos += 1
    L.push(`  ${bien ? 'OK   ' : 'FALLA'} ${texto}`)
  }
  const nueva = async (ancho, alto = 800, extra = {}) => {
    const contexto = await navegador.newContext({ locale: 'es-PE', viewport: { width: ancho, height: alto }, ...extra })
    await contexto.addInitScript((t) => sessionStorage.setItem('reservaupla.sesion', t), sesionCarla)
    return contexto.newPage()
  }
  const abrir = async (pagina, ruta = '/dashboard') => {
    await pagina.goto(`${BASE}${ruta}`)
    await pagina.getByRole('heading', { level: 1 }).waitFor()
    await pagina.locator('#menu-principal a').first().waitFor({ state: 'attached' })
    await pagina.waitForTimeout(400) // el contador llega con su propia petición
  }

  // ---- H1: contraste de lo nuevo, con los colores que calcula el navegador
  L.push('H1) Contraste de los elementos nuevos del layout (colores calculados por el navegador)')
  const pagina = await nueva(1280)
  await abrir(pagina)
  const pares = [
    ['contador de pendientes (número marino sobre blanco)', '[class*="contador"]', 4.5],
    ['avatar (iniciales blancas sobre marino)', '[class*="avatar"]', 4.5],
    ['nombre de la persona en la barra superior', '[class*="MenuDeUsuario"][class*="nombre"], [class*="_nombre_"]', 4.5],
    ['rol bajo el nombre', '[class*="_rol_"]', 4.5],
    ['fecha de hoy', 'header time', 4.5],
    ['miga actual', '[aria-current="page"]', 4.5],
    ['opción del menú (texto blanco sobre marino)', 'nav[aria-label="Principal"] a:not([aria-current])', 4.5],
    ['opción activa (blanco sobre azul)', 'nav[aria-label="Principal"] a[aria-current="page"]', 4.5],
  ]
  for (const [nombre, selector, minimo] of pares) {
    const c = await colores(pagina, selector)
    if (!c) {
      linea(false, `${nombre}: no se encontró el elemento (${selector})`)
      continue
    }
    const r = razon(hex(c.texto), hex(c.fondo))
    linea(r >= minimo, `${r.toFixed(2)}:1  ${nombre}  (${hex(c.texto)} sobre ${hex(c.fondo)})`)
  }
  // ---- H2: estados del menú
  L.push('', 'H2) Estados del layout a 1280 px: axe y objetivos de 44 px')
  await abrir(pagina)
  const estadosEscritorio = [
    ['menú expandido', async () => {}],
    ['menú contraído', async () => pagina.getByRole('button', { name: 'Contraer menú' }).click()],
    ['menú de usuario abierto', async () => {
      await pagina.getByRole('button', { name: 'Expandir menú' }).click()
      await pagina.getByRole('button', { name: /, Administrador$/ }).click()
    }],
  ]
  for (const [nombre, preparar] of estadosEscritorio) {
    await preparar()
    await pagina.waitForTimeout(300)
    const { axe, pequenos } = await axeYTactiles(pagina)
    linea(axe.length === 0 && pequenos.length === 0, `${nombre}: axe ${axe.length ? axe.join(', ') : '0 violaciones'} · menores de 44 px: ${pequenos.length ? pequenos.join('; ') : 'ninguno'}`)
  }
  await pagina.keyboard.press('Escape')
  await pagina.evaluate(() => localStorage.clear())

  // ---- H3: teclado del menú de usuario
  L.push('', 'H3) Teclado del menú de usuario (navegador real)')
  await abrir(pagina)
  const disparador = pagina.getByRole('button', { name: /, Administrador$/ })
  for (const [tecla, nombre] of [['Enter', 'Enter'], ['Space', 'Espacio']]) {
    await disparador.focus()
    await pagina.keyboard.press(tecla)
    linea((await disparador.getAttribute('aria-expanded')) === 'true', `${nombre} abre el menú`)
    await pagina.keyboard.press('Escape')
    const cerrado = (await disparador.getAttribute('aria-expanded')) === 'false'
    const foco = await disparador.evaluate((el) => document.activeElement === el)
    linea(cerrado && foco, `Escape (tras ${nombre}) lo cierra y el foco vuelve al botón`)
  }
  await disparador.focus()
  await pagina.keyboard.press('Enter')
  await pagina.keyboard.press('Tab')
  linea(await pagina.getByRole('button', { name: 'Cerrar sesión', exact: true }).evaluate((el) => document.activeElement === el), 'Tab llega a «Cerrar sesión» (nombre accesible: «Cerrar sesión»)')
  const foco = await pagina.evaluate(() => {
    const e = getComputedStyle(document.activeElement)
    return { ancho: parseFloat(e.outlineWidth), estilo: e.outlineStyle, color: e.outlineColor }
  })
  linea(foco.estilo !== 'none' && foco.ancho >= 3, `«Cerrar sesión» con foco visible (${foco.ancho} px, ${foco.color})`)
  await pagina.keyboard.press('Tab')
  linea((await disparador.getAttribute('aria-expanded')) === 'false', 'Tab fuera del panel lo cierra (comportamiento documentado)')
  await pagina.context().close()

  // ---- H4: móvil
  L.push('', 'H4) 375 px: barra superior, panel deslizante y menú de usuario')
  const movil = await nueva(375, 812)
  await abrir(movil)
  const menu = movil.getByRole('button', { name: 'Menú', exact: true })
  let m = await axeYTactiles(movil)
  linea(m.axe.length === 0 && m.pequenos.length === 0, `barra superior: axe ${m.axe.length ? m.axe.join(', ') : '0 violaciones'} · menores de 44 px: ${m.pequenos.length ? m.pequenos.join('; ') : 'ninguno'}`)
  await menu.click()
  await movil.getByRole('button', { name: 'Cerrar menú' }).waitFor({ state: 'visible' })
  await movil.waitForTimeout(300)
  const dentro = await movil.evaluate(() => document.querySelector('#panel-menu').contains(document.activeElement))
  linea(dentro, 'al abrir el panel el foco entra al panel')
  m = await axeYTactiles(movil)
  linea(m.axe.length === 0 && m.pequenos.length === 0, `panel abierto: axe ${m.axe.length ? m.axe.join(', ') : '0 violaciones'} · menores de 44 px: ${m.pequenos.length ? m.pequenos.join('; ') : 'ninguno'}`)
  const conteo = await movil.getByRole('navigation', { name: 'Principal' }).getByRole('link', { name: /Reservas.*pendiente/ }).count()
  linea(conteo === 1, 'el contador «N pendientes» está en el nombre accesible del enlace Reservas')
  await movil.keyboard.press('Escape')
  linea((await menu.getAttribute('aria-expanded')) === 'false' && (await menu.evaluate((el) => document.activeElement === el)), 'Escape cierra el panel y el foco vuelve a la hamburguesa')
  await menu.click()
  await movil.mouse.click(350, 400) // fuera del panel (fondo)
  linea((await menu.getAttribute('aria-expanded')) === 'false', 'un clic fuera del panel lo cierra')
  await movil.getByRole('button', { name: /, Administrador$/ }).click()
  await movil.waitForTimeout(400) // termina la animación de apertura: axe mide el color final, no uno a medio aparecer
  m = await axeYTactiles(movil)
  linea(m.axe.length === 0 && m.pequenos.length === 0, `menú de usuario abierto: axe ${m.axe.length ? m.axe.join(', ') : '0 violaciones'} · menores de 44 px: ${m.pequenos.length ? m.pequenos.join('; ') : 'ninguno'}`)
  let d = await desborde(movil)
  linea(d.ancho <= d.visible, `menú de usuario abierto sin scroll horizontal (${d.ancho} px en ${d.visible} px)`)
  await movil.context().close()

  // ---- H5: zoom 200 % en móvil (188 px) y 320 px
  L.push('', 'H5) Menú de usuario abierto con zoom 200 % en móvil (188 px) y reflujo (320 px)')
  for (const ancho of [320, 188]) {
    const p = await nueva(ancho, 700)
    await abrir(p)
    await p.getByRole('button', { name: /, Administrador$/ }).click()
    await p.waitForTimeout(250)
    d = await desborde(p)
    const panel = await p.evaluate(() => {
      const r = document.querySelector('[class*="_panel_"]')?.getBoundingClientRect()
      return r ? { izquierda: Math.round(r.left), derecha: Math.round(r.right) } : null
    })
    linea(d.ancho <= d.visible && panel && panel.izquierda >= 0 && panel.derecha <= ancho, `${ancho} px: sin scroll horizontal y el panel cabe en la pantalla (${panel ? `${panel.izquierda}–${panel.derecha} px` : 'sin panel'}, contenido ${d.ancho} px)`)
    await p.context().close()
  }

  // ---- H6: movimiento reducido
  L.push('', 'H6) prefers-reduced-motion: transiciones y animaciones del layout')
  for (const reducir of [false, true]) {
    const p = await nueva(375, 812, { reducedMotion: reducir ? 'reduce' : 'no-preference' })
    await abrir(p)
    await p.getByRole('button', { name: 'Menú', exact: true }).click()
    await p.waitForTimeout(40)
    const activas = await p.evaluate(() => document.getAnimations().map((a) => `${a.animationName ?? a.transitionProperty}`))
    if (reducir) linea(activas.length === 0, `con la preferencia REDUCIR no hay animaciones ni transiciones al abrir el panel (${activas.length})`)
    else L.push(`       sin preferencia: ${activas.length} animación(es)/transición(es) al abrir el panel (${[...new Set(activas)].join(', ') || 'ninguna'})`)
    await p.context().close()
  }

  L.push('', `TOTAL: ${fallos} comprobación(es) de la sub-fase A fallida(s).`)
  return { lineas: L, fallos }
}
