// Accesibilidad MEDIDA sobre el sistema real: axe-core, objetivos táctiles, orden de Tab y foco visible, zoom 200 %,
// prefers-reduced-motion y contraste de los tokens. Recorre todas las pantallas y estados (estados.mjs) a 1280 px y 375 px.
//
// Uso (desde tools/usabilidad):
//   PGPASSWORD="<clave de postgres>" CLAVE_PRUEBA="<clave de los usuarios de prueba>" ETAPA=antes node accesibilidad.mjs
// ETAPA=antes   → docs/evidencias/fase8-accesibilidad-antes.txt y capturas en docs/evidencias/fase8/antes/
// ETAPA=despues → docs/evidencias/fase8-accesibilidad.txt (informe final) y capturas en docs/evidencias/fase8/despues/
// Arranca la base, la API y el frontend por su cuenta (puertos 5263 y 5180 libres).
import { createRequire } from 'node:module'
import { mkdirSync, writeFileSync } from 'node:fs'
import { resolve } from 'node:path'
import { BASE, RAIZ, abrirNavegador, api, crearReservaApi, fechaRelativa, iniciarSesion, leerSesion, nuevaPagina, tokenDe } from '../e2e/lib.mjs'
import { detenerEntorno, iniciarEntorno, reiniciarBaseYApi } from '../e2e/entorno.mjs'
import { analizarContraste } from './contraste.mjs'
import { recorrer } from './estados.mjs'

const requerir = createRequire(import.meta.url)
const RUTA_AXE = requerir.resolve('axe-core/axe.min.js')
const ETAPA = process.env.ETAPA === 'despues' ? 'despues' : 'antes'
const CAPTURAS = resolve(RAIZ, 'docs', 'evidencias', 'fase8', ETAPA)
const INFORME = resolve(RAIZ, 'docs', 'evidencias', ETAPA === 'despues' ? 'fase8-accesibilidad.txt' : 'fase8-accesibilidad-antes.txt')
const ETIQUETAS_AXE = ['wcag2a', 'wcag2aa', 'wcag21a', 'wcag21aa', 'wcag22aa', 'best-practice']
const MINIMO_TACTIL = 44

mkdirSync(CAPTURAS, { recursive: true })

// ---------------------------------------------------------------- Medición de un estado
async function describirInteractivos(pagina) {
  return pagina.evaluate((minimo) => {
    const SELECTOR =
      'a[href], button, input:not([type=hidden]), select, textarea, [role=button], [role=switch], [role=link], [role=tab], [tabindex]:not([tabindex="-1"])'
    const visible = (el) => {
      const estilo = getComputedStyle(el)
      return estilo.visibility !== 'hidden' && estilo.display !== 'none' && el.getClientRects().length > 0
    }
    const nombre = (el) => {
      const etiqueta = el.id && document.querySelector(`label[for="${el.id}"]`)?.textContent
      return (el.getAttribute('aria-label') || etiqueta || el.textContent || el.getAttribute('placeholder') || el.getAttribute('name') || '')
        .replace(/\s+/g, ' ')
        .trim()
        .slice(0, 40)
    }
    const descripcion = (el) => `${el.tagName.toLowerCase()}${el.getAttribute('role') ? `[${el.getAttribute('role')}]` : ''}${el.type && el.tagName === 'INPUT' ? `(${el.type})` : ''} «${nombre(el)}»`
    const pequenos = []
    for (const el of document.querySelectorAll(SELECTOR)) {
      if (!visible(el) || el.disabled) continue
      let caja = el.getBoundingClientRect()
      let via = ''
      // Un control nativo oculto visualmente (interruptor): el objetivo táctil real es su etiqueta.
      if ((caja.width < 2 || caja.height < 2) && el.labels?.[0]) {
        caja = el.labels[0].getBoundingClientRect()
        via = ' (medido en su etiqueta)'
      }
      if (caja.width < minimo || caja.height < minimo) {
        pequenos.push({ el: descripcion(el) + via, ancho: Math.round(caja.width), alto: Math.round(caja.height) })
      }
    }
    return pequenos
  }, MINIMO_TACTIL)
}

async function recorrerConTab(pagina) {
  await pagina.evaluate(() => {
    document.activeElement?.blur?.()
    window.scrollTo(0, 0)
  })
  const pasos = []
  let primero = null
  for (let i = 0; i < 60; i++) {
    await pagina.keyboard.press('Tab')
    const dato = await pagina.evaluate(() => {
      const el = document.activeElement
      if (!el || el === document.body) return null
      // El anillo puede dibujarlo el propio control o su contenedor (CampoFormulario usa :focus-within): se miran 3 niveles.
      let contorno = false
      let sombra = false
      for (let nodo = el, nivel = 0; nodo && nivel < 3; nodo = nodo.parentElement, nivel++) {
        const e = getComputedStyle(nodo)
        contorno ||= e.outlineStyle !== 'none' && parseFloat(e.outlineWidth) >= 2
        sombra ||= e.boxShadow !== 'none'
      }
      const etiqueta = el.id && document.querySelector(`label[for="${el.id}"]`)?.textContent
      const nombre = (el.getAttribute('aria-label') || etiqueta || el.textContent || el.getAttribute('name') || '').replace(/\s+/g, ' ').trim().slice(0, 40)
      const caja = el.getBoundingClientRect()
      return {
        texto: `${el.tagName.toLowerCase()} «${nombre}»`,
        foco: contorno || sombra,
        dentro: !!el.closest('[role=dialog]'),
        enPantalla: caja.bottom > 0 && caja.top < window.innerHeight,
      }
    })
    if (!dato) break
    if (primero === null) primero = dato.texto
    else if (dato.texto === primero) break
    pasos.push(dato)
  }
  await pagina.evaluate(() => document.activeElement?.blur?.())
  return pasos
}

const resultados = [] // { id, descripcion, ancho, axe, pequenos, tab }

async function medir(pagina, id, descripcion) {
  const ancho = pagina.viewportSize().width <= 400 ? 'movil' : 'escritorio'
  await pagina.waitForTimeout(250)
  await pagina.screenshot({ path: resolve(CAPTURAS, `${id}-${ancho}.png`), fullPage: true })
  await pagina.addScriptTag({ path: RUTA_AXE })
  const axe = await pagina.evaluate(async (etiquetas) => {
    const r = await window.axe.run(document, { runOnly: { type: 'tag', values: etiquetas } })
    return r.violations.map((v) => ({ id: v.id, impacto: v.impact, ayuda: v.help, nodos: v.nodes.length, ejemplo: v.nodes[0]?.target?.join(' ') ?? '' }))
  }, ETIQUETAS_AXE)
  const pequenos = await describirInteractivos(pagina)
  const tab = await recorrerConTab(pagina)
  resultados.push({ id, descripcion, ancho, axe, pequenos, tab })
  console.log(`   ${id} (${ancho}): axe ${axe.length} regla(s) · táctiles <${MINIMO_TACTIL}px: ${pequenos.length} · Tab: ${tab.length} paradas`)
}

// ---------------------------------------------------------------- Zoom 200 % y movimiento reducido
const RUTAS_ZOOM = [
  ['/login', null],
  ['/reservas/nueva', 'ana'],
  ['/reservas/{id}', 'carla'],
  ['/ambientes', 'carla'],
  ['/ambientes/nuevo', 'carla'],
  ['/usuarios', 'carla'],
  ['/usuarios/nuevo', 'carla'],
]

async function controlDeAxe(navegador) {
  const pagina = await navegador.newPage()
  await pagina.setContent('<html lang="es"><body><img src="x.png"><button></button><p style="color:#ccc;background:#fff">texto claro</p><input></body></html>')
  await pagina.addScriptTag({ path: RUTA_AXE })
  const reglas = await pagina.evaluate(async (etiquetas) => (await window.axe.run(document, { runOnly: { type: 'tag', values: etiquetas } })).violations.map((v) => v.id), ETIQUETAS_AXE)
  await pagina.close()
  return reglas
}

async function extras(navegador) {
  const control = await controlDeAxe(navegador)
  await reiniciarBaseYApi()
  const sesiones = {}
  for (const [rol, correo] of [['ana', 'ana.torres@upla.edu.pe'], ['carla', 'carla.rojas@upla.edu.pe']]) {
    const pagina = await nuevaPagina(navegador, 'escritorio')
    await iniciarSesion(pagina, correo)
    await pagina.waitForURL(/\/(reservas\/nueva|ambientes)$/)
    sesiones[rol] = await leerSesion(pagina)
    await pagina.context().close()
  }
  const token = tokenDe(sesiones.ana)
  const lab = (await api('/api/ambientes', { token })).data.find((a) => a.nombre === 'Laboratorio de Cómputo 2').id
  const idReserva = await crearReservaApi(token, lab, fechaRelativa(10).iso, '10:00', '12:00', 'Reserva para el zoom')

  // Zoom 200 %: una ventana de 1280 px a 200 % ofrece 640 px de ancho CSS, y una de 375 px a 200 %, 188 px.
  // 320 px es el ancho de reflujo de WCAG 1.4.10 (equivale a 400 % en 1280 px).
  const zoom = []
  for (const [anchoCss, nombre] of [[640, '200 % en escritorio (640 px)'], [320, 'reflujo WCAG 1.4.10 (320 px)'], [188, '200 % en móvil (188 px)']]) {
    for (const [ruta, rol] of RUTAS_ZOOM) {
      const contexto = await navegador.newContext({ locale: 'es-PE', viewport: { width: anchoCss, height: 700 } })
      if (rol) await contexto.addInitScript((t) => sessionStorage.setItem('reservaupla.sesion', t), sesiones[rol])
      const pagina = await contexto.newPage()
      const url = ruta.replace('{id}', idReserva)
      await pagina.goto(`${BASE}${url}`)
      await pagina.waitForLoadState('networkidle')
      const medida = await pagina.evaluate(() => ({ ancho: document.documentElement.scrollWidth, visible: document.documentElement.clientWidth }))
      zoom.push({ nombre, ruta: url, ...medida, desborda: medida.ancho > medida.visible })
      await contexto.close()
    }
  }

  // Movimiento reducido: animaciones en marcha con y sin la preferencia, en los estados que se mueven.
  const movimiento = []
  for (const reducir of [false, true]) {
    const contexto = await navegador.newContext({ locale: 'es-PE', viewport: { width: 1280, height: 800 }, reducedMotion: reducir ? 'reduce' : 'no-preference' })
    const pagina = await contexto.newPage()
    await pagina.goto(`${BASE}/login`)
    await pagina.route('**/api/auth/login', async (r) => {
      await new Promise((res) => setTimeout(res, 4000))
      await r.fulfill({ status: 401, contentType: 'application/json', body: '{"mensaje":"x"}' }).catch(() => {})
    })
    await pagina.getByLabel('Correo institucional').fill('ana.torres@upla.edu.pe')
    await pagina.getByLabel('Contraseña', { exact: true }).fill('clave-cualquiera')
    await pagina.getByRole('button', { name: 'Ingresar' }).click()
    await pagina.getByRole('button', { name: 'Verificando credenciales…' }).waitFor()
    await pagina.waitForTimeout(300)
    const animaciones = await pagina.evaluate(() =>
      document.getAnimations().map((a) => {
        const t = a.effect?.getComputedTiming?.() ?? {}
        return { nombre: a.animationName ?? a.transitionProperty ?? '(transición)', duracionMs: t.duration, iteraciones: t.iterations === Infinity ? 'infinitas' : t.iterations, estado: a.playState }
      }),
    )
    movimiento.push({ estado: 'Login verificando credenciales (spinner)', reducido: reducir, animaciones })
    await contexto.close()
  }
  return { zoom, movimiento, control }
}

// ---------------------------------------------------------------- Informe
const unicos = (lista) => [...new Set(lista)]

function informe(contraste, extra) {
  const L = []
  const rayas = '='.repeat(110)
  L.push(`ACCESIBILIDAD MEDIDA DEL SISTEMA REAL (${ETAPA.toUpperCase()}) — ${new Date().toISOString().slice(0, 10)}`)
  L.push(`Herramientas: axe-core ${requerir('axe-core/package.json').version} (etiquetas ${ETIQUETAS_AXE.join(', ')}), Playwright con Edge sin ventana, 1280 px y 375 px.`)
  L.push(`Estados recorridos: ${unicos(resultados.map((r) => r.id)).length} por ancho (${resultados.length} mediciones). Capturas en docs/evidencias/fase8/${ETAPA}/.`, '')

  // ---- A) axe
  L.push(rayas, 'A) AXE-CORE: violaciones por regla', rayas)
  const porRegla = new Map()
  for (const r of resultados) {
    for (const v of r.axe) {
      const entrada = porRegla.get(v.id) ?? { ...v, estados: [] }
      entrada.estados.push(`${r.id} (${r.ancho})`)
      porRegla.set(v.id, entrada)
    }
  }
  L.push(`Control de la herramienta: sobre una página de prueba con defectos conocidos (imagen sin alt, botón sin nombre, texto claro, campo sin etiqueta) axe detecta ${extra.control.length} regla(s): ${extra.control.join(', ')}.`)
  if (porRegla.size === 0) L.push('Ninguna violación en ninguna pantalla ni estado.')
  for (const v of [...porRegla.values()].sort((a, b) => b.estados.length - a.estados.length)) {
    L.push(`- ${v.id} [${v.impacto}] ${v.ayuda}`, `    en ${v.estados.length} medición(es); ejemplo: ${v.ejemplo}`, `    estados: ${unicos(v.estados).join(', ')}`)
  }
  L.push('', 'Por estado (número de reglas violadas):')
  for (const r of resultados) L.push(`  ${r.id.padEnd(40)} ${r.ancho.padEnd(10)} ${r.axe.length === 0 ? 'sin violaciones' : r.axe.map((v) => `${v.id}×${v.nodos}`).join(', ')}`)
  L.push('', `TOTAL: ${resultados.filter((r) => r.axe.length > 0).length} de ${resultados.length} mediciones con al menos una violación; ${porRegla.size} regla(s) distintas.`, '')

  // ---- B) contraste
  L.push(rayas, 'B) CONTRASTE WCAG (tokens y hojas de estilo)', rayas, ...contraste.lineas, '', `TOTAL: ${contraste.fallos.length} par(es) por debajo del umbral.`, '')

  // ---- C) táctiles
  L.push(rayas, `C) OBJETIVOS TÁCTILES a 375 px: interactivos menores de ${MINIMO_TACTIL}×${MINIMO_TACTIL} px`, rayas)
  const moviles = resultados.filter((r) => r.ancho === 'movil')
  const porElemento = new Map()
  for (const r of moviles) for (const p of r.pequenos) {
    const clave = `${p.el} ${p.ancho}×${p.alto}`
    porElemento.set(clave, [...(porElemento.get(clave) ?? []), r.id])
  }
  if (porElemento.size === 0) L.push('Ningún elemento interactivo es menor de 44 px en ningún estado.')
  for (const [clave, estados] of porElemento) L.push(`- ${clave}  → en ${estados.length} estado(s): ${unicos(estados).slice(0, 6).join(', ')}${estados.length > 6 ? ', …' : ''}`)
  const totalInteractivos = moviles.length
  L.push('', `TOTAL: ${porElemento.size} elemento(s) distinto(s) por debajo de 44 px en ${unicos([...porElemento.values()].flat()).length} de ${totalInteractivos} estados móviles.`)
  L.push('Nota: WCAG 2.2 exige 24 px como mínimo (AA, 2.5.8) y recomienda 44 px (AAA, 2.5.5); la regla del proyecto es 44 px.', '')

  // ---- D) teclado
  L.push(rayas, 'D) TECLADO: recorrido con Tab (primeras paradas) y foco visible', rayas)
  let sinFoco = 0
  let fueraDeModal = 0
  for (const r of resultados) {
    const sin = r.tab.filter((p) => !p.foco)
    sinFoco += sin.length
    const esModal = /modal/.test(r.id)
    const escapan = esModal ? r.tab.filter((p) => !p.dentro) : []
    fueraDeModal += escapan.length
    L.push(`  ${r.id} (${r.ancho}): ${r.tab.length} parada(s)${sin.length ? ` · SIN foco visible: ${sin.map((p) => p.texto).join('; ')}` : ' · todas con foco visible'}${esModal ? (escapan.length ? ` · el foco SALE del modal en: ${escapan.map((p) => p.texto).join('; ')}` : ' · el foco queda dentro del modal') : ''}`)
    if (r.ancho === 'escritorio') L.push(`      orden: ${r.tab.map((p) => p.texto).join(' → ')}`)
  }
  L.push('', `TOTAL: ${sinFoco} parada(s) sin foco visible; ${fueraDeModal} parada(s) fuera del modal con el modal abierto.`, '')

  // ---- E) zoom
  L.push(rayas, 'E) ZOOM 200 % y reflujo: ¿hay scroll horizontal?', rayas)
  for (const z of extra.zoom) L.push(`  ${z.desborda ? 'FALLA' : 'OK   '} ${z.nombre.padEnd(34)} ${z.ruta.padEnd(20)} contenido ${z.ancho}px en ${z.visible}px visibles`)
  L.push('', `TOTAL: ${extra.zoom.filter((z) => z.desborda).length} de ${extra.zoom.length} combinaciones con scroll horizontal.`, '')

  // ---- F) movimiento
  L.push(rayas, 'F) PREFERS-REDUCED-MOTION: animaciones activas', rayas)
  for (const m of extra.movimiento) {
    L.push(`  ${m.estado} — preferencia ${m.reducido ? 'REDUCIR' : 'sin preferencia'}: ${m.animaciones.length} animación(es)`)
    for (const a of m.animaciones) L.push(`      ${a.nombre}: duración ${a.duracionMs} ms, iteraciones ${a.iteraciones}, ${a.estado}`)
  }
  const aunMueve = extra.movimiento.find((m) => m.reducido).animaciones.filter((a) => a.iteraciones === 'infinitas' && a.estado === 'running')
  L.push('', `TOTAL: con la preferencia activada quedan ${aunMueve.length} animación(es) infinita(s) en marcha.`)
  return L.join('\n')
}

// ---------------------------------------------------------------- Ejecución
let navegador
try {
  await iniciarEntorno()
  navegador = await abrirNavegador()
  for (const ancho of ['escritorio', 'movil']) {
    console.log(`\n== Recorrido a ${ancho === 'movil' ? '375' : '1280'} px`)
    await reiniciarBaseYApi()
    await recorrer(navegador, ancho, medir)
  }
  console.log('\n== Zoom y movimiento reducido')
  const extra = await extras(navegador)
  const texto = informe(analizarContraste(), extra)
  writeFileSync(INFORME, texto + '\n', 'utf8')
  console.log(`\nInforme escrito en ${INFORME}`)
  console.log(texto.split('\n').filter((l) => l.startsWith('TOTAL')).join('\n'))
} catch (error) {
  console.error('\nFALLO:', error.stack ?? error.message)
  process.exitCode = 1
} finally {
  await navegador?.close()
  detenerEntorno()
}
