// Peso y tiempo de carga de la pantalla de login, ANTES y DESPUÉS del pase de identidad visual, con la caché vacía en cada carga.
// Pide cada recurso por el protocolo del navegador (bytes transferidos reales) y repite la carga N veces: se informa la mediana.
// Se mide contra la versión COMPILADA (`vite build` + `vite preview`), no contra el servidor de desarrollo, que no es representativo.
// Uso (desde tools/usabilidad):
//   node peso-login.mjs --antes http://localhost:4181 --despues http://localhost:4180 [--veces 7] [--salida ruta.txt]
import { writeFileSync } from 'node:fs'

process.env.CLAVE_PRUEBA ??= 'no-se-usa'
const { abrirNavegador } = await import('../e2e/lib.mjs')

const argumento = (nombre, porDefecto) => {
  const i = process.argv.indexOf(nombre)
  return i > 0 ? process.argv[i + 1] : porDefecto
}
const ANTES = argumento('--antes')
const DESPUES = argumento('--despues')
const VECES = Number.parseInt(argumento('--veces', '7'), 10)
const SALIDA = argumento('--salida')
if (!ANTES || !DESPUES) {
  console.error('Uso: node peso-login.mjs --antes <url> --despues <url> [--veces N] [--salida archivo]')
  process.exit(2)
}

const ESCENARIOS = [
  { nombre: 'Escritorio 1280 px', viewport: { width: 1280, height: 900 } },
  { nombre: 'Móvil 375 px', viewport: { width: 375, height: 812 } },
]
// «4G lento»: 1,6 Mbps de bajada y 150 ms de latencia (perfil «Slow 4G» de las herramientas de desarrollo).
const REDES = [
  { nombre: 'sin límite (localhost)', condiciones: null },
  { nombre: '4G lento (1,6 Mbps, 150 ms)', condiciones: { offline: false, latency: 150, downloadThroughput: (1.6 * 1024 * 1024) / 8, uploadThroughput: (750 * 1024) / 8 } },
]

const mediana = (valores) => {
  const orden = [...valores].sort((a, b) => a - b)
  return orden[Math.floor(orden.length / 2)]
}
const kb = (bytes) => `${(bytes / 1024).toFixed(1)} KB`
const tipoDe = (url, mime) => {
  if (/image\//.test(mime) || /\.(webp|png|jpe?g|svg)(\?|$)/.test(url)) return 'imágenes'
  if (/font|woff/.test(mime) || /\.woff2?(\?|$)/.test(url)) return 'fuentes'
  if (/css/.test(mime)) return 'css'
  if (/javascript/.test(mime)) return 'js'
  return 'html y otros'
}

async function cargarUnaVez(navegador, base, escenario, red) {
  const contexto = await navegador.newContext({ viewport: escenario.viewport })
  const pagina = await contexto.newPage()
  const cdp = await contexto.newCDPSession(pagina)
  await cdp.send('Network.enable')
  await cdp.send('Network.setCacheDisabled', { cacheDisabled: true })
  if (red.condiciones) await cdp.send('Network.emulateNetworkConditions', red.condiciones)
  const recursos = new Map()
  cdp.on('Network.responseReceived', (e) => recursos.set(e.requestId, { url: e.response.url, mime: e.response.mimeType, bytes: 0 }))
  cdp.on('Network.loadingFinished', (e) => {
    const r = recursos.get(e.requestId)
    if (r) r.bytes = e.encodedDataLength
  })
  await pagina.addInitScript(() => {
    window.__lcp = 0
    new PerformanceObserver((lista) => {
      for (const entrada of lista.getEntries()) window.__lcp = entrada.startTime
    }).observe({ type: 'largest-contentful-paint', buffered: true })
  })
  await pagina.goto(`${base}/login`, { waitUntil: 'load' })
  await pagina.getByRole('button', { name: 'Ingresar' }).waitFor()
  await pagina.waitForTimeout(800)
  const tiempos = await pagina.evaluate(() => {
    const n = performance.getEntriesByType('navigation')[0]
    const fcp = performance.getEntriesByName('first-contentful-paint')[0]
    return { carga: n.loadEventEnd, dcl: n.domContentLoadedEventEnd, fcp: fcp?.startTime ?? 0, lcp: window.__lcp }
  })
  await contexto.close()
  return { tiempos, recursos: [...recursos.values()] }
}

async function medir(navegador, base, escenario, red) {
  const corridas = []
  for (let i = 0; i < VECES; i++) corridas.push(await cargarUnaVez(navegador, base, escenario, red))
  const porTipo = {}
  for (const r of corridas[0].recursos) {
    const tipo = tipoDe(r.url, r.mime)
    porTipo[tipo] = (porTipo[tipo] ?? 0) + r.bytes
  }
  return {
    detalle: corridas[0].recursos.map((r) => ({ nombre: r.url.replace(base, '').replace(/^https?:\/\//, ''), tipo: tipoDe(r.url, r.mime), bytes: r.bytes })),
    porTipo,
    total: corridas[0].recursos.reduce((suma, r) => suma + r.bytes, 0),
    carga: mediana(corridas.map((c) => c.tiempos.carga)),
    fcp: mediana(corridas.map((c) => c.tiempos.fcp)),
    lcp: mediana(corridas.map((c) => c.tiempos.lcp)),
  }
}

const L = []
L.push(`PESO Y TIEMPO DE CARGA DEL LOGIN — ${new Date().toISOString().slice(0, 10)}`)
L.push(`Versión compilada (vite build + preview), caché vacía en cada carga, mediana de ${VECES} cargas. Antes: ${ANTES}. Después: ${DESPUES}.`, '')
const navegador = await abrirNavegador()
try {
  for (const escenario of ESCENARIOS) {
    for (const red of REDES) {
      L.push('='.repeat(100), `${escenario.nombre} · red ${red.nombre}`, '='.repeat(100))
      const antes = await medir(navegador, ANTES, escenario, red)
      const despues = await medir(navegador, DESPUES, escenario, red)
      L.push('  Tiempos (mediana)                  antes      después')
      L.push(`    evento load                    ${antes.carga.toFixed(0).padStart(6)} ms   ${despues.carga.toFixed(0).padStart(6)} ms`)
      L.push(`    primer contenido (FCP)         ${antes.fcp.toFixed(0).padStart(6)} ms   ${despues.fcp.toFixed(0).padStart(6)} ms`)
      L.push(`    contenido más grande (LCP)     ${antes.lcp.toFixed(0).padStart(6)} ms   ${despues.lcp.toFixed(0).padStart(6)} ms`)
      L.push('  Bytes transferidos por tipo        antes      después')
      for (const tipo of ['html y otros', 'css', 'js', 'fuentes', 'imágenes']) {
        L.push(`    ${tipo.padEnd(28)} ${kb(antes.porTipo[tipo] ?? 0).padStart(9)}  ${kb(despues.porTipo[tipo] ?? 0).padStart(9)}`)
      }
      L.push(`    ${'TOTAL'.padEnd(28)} ${kb(antes.total).padStart(9)}  ${kb(despues.total).padStart(9)}`, '')
      if (red.condiciones === null) {
        L.push('  Recursos DESPUÉS:')
        for (const r of despues.detalle) L.push(`    ${kb(r.bytes).padStart(9)}  ${r.tipo.padEnd(12)} ${r.nombre.slice(0, 90)}`)
        L.push('  Recursos ANTES:')
        for (const r of antes.detalle) L.push(`    ${kb(r.bytes).padStart(9)}  ${r.tipo.padEnd(12)} ${r.nombre.slice(0, 90)}`)
        L.push('')
      }
    }
  }
} finally {
  await navegador.close()
}
const texto = L.join('\n')
console.log(texto)
if (SALIDA) writeFileSync(SALIDA, texto + '\n', 'utf8')
