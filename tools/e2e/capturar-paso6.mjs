import { existsSync, mkdirSync, readFileSync } from 'node:fs'
import { createServer } from 'node:http'
import { extname, join, resolve } from 'node:path'
import { fileURLToPath } from 'node:url'
import { chromium } from 'playwright-core'

const aqui = resolve(fileURLToPath(import.meta.url), '..')
const RAIZ = resolve(aqui, '../..')
const DIST = resolve(RAIZ, 'frontend/dist')
const DESTINO = resolve(RAIZ, 'docs/evidencias/experiencia')
mkdirSync(DESTINO, { recursive: true })

const NAVEGADORES = [
  'C:\\Program Files (x86)\\Microsoft\\Edge\\Application\\msedge.exe',
  'C:\\Program Files\\Microsoft\\Edge\\Application\\msedge.exe',
  'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe',
  '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome',
  '/Applications/Microsoft Edge.app/Contents/MacOS/Microsoft Edge',
  '/usr/bin/google-chrome',
  '/usr/bin/chromium',
]

const ejecutable = NAVEGADORES.find((p) => existsSync(p))
if (!ejecutable) {
  console.error('No se encontró Chrome ni Edge')
  process.exit(1)
}

const MIME_TYPES = {
  '.html': 'text/html',
  '.js': 'application/javascript',
  '.css': 'text/css',
  '.json': 'application/json',
  '.webp': 'image/webp',
  '.png': 'image/png',
  '.woff': 'font/woff',
  '.woff2': 'font/woff2',
}

const servidor = createServer((req, res) => {
  let ruta = join(DIST, req.url.split('?')[0])
  if (!existsSync(ruta) || ruta.endsWith('/') || !extname(ruta)) {
    ruta = join(DIST, 'index.html')
  }
  const ext = extname(ruta)
  const mime = MIME_TYPES[ext] || 'application/octet-stream'
  try {
    const contenido = readFileSync(ruta)
    res.writeHead(200, { 'Content-Type': mime })
    res.end(contenido)
  } catch {
    res.writeHead(404)
    res.end()
  }
})

await new Promise((resolver) => servidor.listen(5190, '127.0.0.1', resolver))
console.log('Servidor estático corriendo en http://127.0.0.1:5190')

const navegador = await chromium.launch({ executablePath: ejecutable, headless: true })

const SESION_SOLICITANTE = JSON.stringify({
  token: 'mock-token',
  usuarioId: 2,
  nombreCompleto: 'Ana Valdivia',
  rol: 'Solicitante',
  correo: 'ana.valdivia@upla.edu.pe',
  expiraEn: '2030-01-01T00:00:00Z',
})

async function configurarRutas(contexto) {
  await contexto.route('**/api/**', async (route) => {
    const url = route.request().url()
    const method = route.request().method()
    if (url.includes('/api/auth/login') && method === 'POST') {
      const postData = route.request().postDataJSON()
      if (postData?.contrasena === 'incorrecta') {
        return route.fulfill({
          status: 401,
          contentType: 'application/json',
          body: JSON.stringify({ mensaje: 'No autorizado' }),
        })
      }
      return route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: SESION_SOLICITANTE,
      })
    }
    return route.fulfill({
      status: 200,
      contentType: 'application/json',
      body: JSON.stringify([]),
    })
  })
}

async function verificarSinScrollHorizontal(pagina, etiqueta) {
  const scrollWidth = await pagina.evaluate(() => document.documentElement.scrollWidth)
  const clientWidth = await pagina.evaluate(() => document.documentElement.clientWidth)
  if (scrollWidth > clientWidth) {
    console.error(`DESBORDAMIENTO HORIZONTAL en ${etiqueta}: ${scrollWidth} > ${clientWidth}`)
  } else {
    console.log(`OK: sin scroll horizontal en ${etiqueta} (${scrollWidth} <= ${clientWidth})`)
  }
}

try {
  // 1. Login inicial escritorio 1280px
  {
    const ctx = await navegador.newContext({ viewport: { width: 1280, height: 800 } })
    await configurarRutas(ctx)
    const page = await ctx.newPage()
    await page.goto('http://127.0.0.1:5190/login', { waitUntil: 'networkidle' })
    await verificarSinScrollHorizontal(page, 'Login 1280px')
    await page.screenshot({ path: join(DESTINO, 'L-01-login-escritorio.png'), fullPage: true })
    await ctx.close()
  }

  // 2. Login móvil 375px
  {
    const ctx = await navegador.newContext({ viewport: { width: 375, height: 667 } })
    await configurarRutas(ctx)
    const page = await ctx.newPage()
    await page.goto('http://127.0.0.1:5190/login', { waitUntil: 'networkidle' })
    await verificarSinScrollHorizontal(page, 'Login 375px')
    await page.screenshot({ path: join(DESTINO, 'L-02-login-movil.png'), fullPage: true })
    await ctx.close()
  }

  // 3. Login con contraseña mostrada
  {
    const ctx = await navegador.newContext({ viewport: { width: 1280, height: 800 } })
    await configurarRutas(ctx)
    const page = await ctx.newPage()
    await page.goto('http://127.0.0.1:5190/login', { waitUntil: 'networkidle' })
    await page.fill('input[type="email"]', 'ana.valdivia@upla.edu.pe')
    await page.fill('input[type="password"]', 'ClaveSecreta123')
    const btnMostrar = page.locator('button:has-text("Mostrar")')
    await btnMostrar.click()
    await page.waitForTimeout(200)
    await page.screenshot({
      path: join(DESTINO, 'L-03-login-mostrar-contrasena.png'),
      fullPage: true,
    })
    await ctx.close()
  }

  // 4. Login con error de credenciales
  {
    const ctx = await navegador.newContext({ viewport: { width: 1280, height: 800 } })
    await configurarRutas(ctx)
    const page = await ctx.newPage()
    await page.goto('http://127.0.0.1:5190/login', { waitUntil: 'networkidle' })
    await page.fill('input[type="email"]', 'ana.valdivia@upla.edu.pe')
    await page.fill('input[type="password"]', 'incorrecta')
    await page.click('button[type="submit"]')
    await page.waitForSelector('[role="alert"]')
    await page.screenshot({
      path: join(DESTINO, 'L-04-login-error-credenciales.png'),
      fullPage: true,
    })
    await ctx.close()
  }

  // 5. Login con ayuda de soporte expandida
  {
    const ctx = await navegador.newContext({ viewport: { width: 1280, height: 800 } })
    await configurarRutas(ctx)
    const page = await ctx.newPage()
    await page.goto('http://127.0.0.1:5190/login', { waitUntil: 'networkidle' })
    await page.click('button:has-text("¿Olvidaste tu contraseña?")')
    await page.waitForSelector('#ayuda-soporte')
    await page.screenshot({ path: join(DESTINO, 'L-05-login-ayuda-soporte.png'), fullPage: true })
    await ctx.close()
  }

  // 6. 403 Sin permiso escritorio 1280px
  {
    const ctx = await navegador.newContext({ viewport: { width: 1280, height: 800 } })
    await configurarRutas(ctx)
    await ctx.addInitScript((sesion) => {
      window.sessionStorage.setItem('reservaupla.sesion', sesion)
    }, SESION_SOLICITANTE)
    const page = await ctx.newPage()
    await page.goto('http://127.0.0.1:5190/usuarios', { waitUntil: 'networkidle' })
    await page.waitForSelector('text=Sin permiso')
    await verificarSinScrollHorizontal(page, '403 1280px')
    await page.screenshot({
      path: join(DESTINO, 'L-06-403-sin-permiso-escritorio.png'),
      fullPage: true,
    })
    await ctx.close()
  }

  // 7. 403 Sin permiso móvil 375px
  {
    const ctx = await navegador.newContext({ viewport: { width: 375, height: 667 } })
    await configurarRutas(ctx)
    await ctx.addInitScript((sesion) => {
      window.sessionStorage.setItem('reservaupla.sesion', sesion)
    }, SESION_SOLICITANTE)
    const page = await ctx.newPage()
    await page.goto('http://127.0.0.1:5190/usuarios', { waitUntil: 'networkidle' })
    await page.waitForSelector('text=Sin permiso')
    await verificarSinScrollHorizontal(page, '403 375px')
    await page.screenshot({ path: join(DESTINO, 'L-07-403-sin-permiso-movil.png'), fullPage: true })
    await ctx.close()
  }

  // 8. 404 No encontrada escritorio 1280px
  {
    const ctx = await navegador.newContext({ viewport: { width: 1280, height: 800 } })
    await configurarRutas(ctx)
    await ctx.addInitScript((sesion) => {
      window.sessionStorage.setItem('reservaupla.sesion', sesion)
    }, SESION_SOLICITANTE)
    const page = await ctx.newPage()
    await page.goto('http://127.0.0.1:5190/seccion-inexistente', { waitUntil: 'networkidle' })
    await page.waitForSelector('text=No encontramos esa página')
    await verificarSinScrollHorizontal(page, '404 1280px')
    await page.screenshot({
      path: join(DESTINO, 'L-08-404-no-encontrada-escritorio.png'),
      fullPage: true,
    })
    await ctx.close()
  }

  // 9. 404 No encontrada móvil 375px
  {
    const ctx = await navegador.newContext({ viewport: { width: 375, height: 667 } })
    await configurarRutas(ctx)
    await ctx.addInitScript((sesion) => {
      window.sessionStorage.setItem('reservaupla.sesion', sesion)
    }, SESION_SOLICITANTE)
    const page = await ctx.newPage()
    await page.goto('http://127.0.0.1:5190/seccion-inexistente', { waitUntil: 'networkidle' })
    await page.waitForSelector('text=No encontramos esa página')
    await verificarSinScrollHorizontal(page, '404 375px')
    await page.screenshot({
      path: join(DESTINO, 'L-09-404-no-encontrada-movil.png'),
      fullPage: true,
    })
    await ctx.close()
  }

  console.log('Capturas del PASO 6 completadas exitosamente.')
} finally {
  await navegador.close()
  servidor.close()
}
