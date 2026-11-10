// Capturas de código con el aspecto de VS Code (tema Dark+): pestaña con el archivo, ruta de migas, números de línea reales
// y barra de estado. Los fragmentos salen de lib/codigos.js, del repositorio real. Uso: node capturas-codigo.mjs
import { existsSync, mkdirSync, readFileSync, writeFileSync } from 'node:fs'
import path from 'node:path'
import { fileURLToPath } from 'node:url'
import { createRequire } from 'node:module'
import { createHighlighter } from 'shiki'
import { CODIGOS, rangoDe } from './lib/codigos.js'

const aqui = path.dirname(fileURLToPath(import.meta.url))
const RAIZ = path.resolve(aqui, '..', '..')
const SALIDA = path.join(RAIZ, 'docs', 'evidencias', 'informe', 'codigo')
mkdirSync(SALIDA, { recursive: true })
const { chromium } = createRequire(path.join(RAIZ, 'tools', 'e2e') + path.sep)('playwright-core')

const NAVEGADORES = [
  'C:/Program Files (x86)/Microsoft/Edge/Application/msedge.exe',
  'C:/Program Files/Microsoft/Edge/Application/msedge.exe',
  'C:/Program Files/Google/Chrome/Application/chrome.exe',
]
const ejecutable = NAVEGADORES.find((r) => existsSync(r))
if (!ejecutable) throw new Error('No se encontró Edge ni Chrome')

const LENGUAJES = {
  '.cs': ['csharp', 'C#'],
  '.sql': ['sql', 'SQL'],
  '.js': ['javascript', 'JavaScript'],
  '.jsx': ['jsx', 'JavaScript React'],
  '.css': ['css', 'CSS'],
}
const TEMA = 'dark-plus'
const resaltador = await createHighlighter({ themes: [TEMA], langs: [...new Set(Object.values(LENGUAJES).map((l) => l[0]))] })
const escapar = (t) => t.replace(/[&<>]/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;' })[c])

function pagina(codigo, ini, fin, tokens) {
  const [, nombreLenguaje] = LENGUAJES[path.extname(codigo.ruta)]
  const partes = codigo.ruta.split('/')
  const archivo = partes.at(-1)
  const migas = partes.map((p, i) => `<span class="${i === partes.length - 1 ? 'ultima' : ''}">${escapar(p)}</span>`).join('<i>›</i>')
  const filas = []
  for (let n = ini; n <= fin; n++) {
    const html = (tokens[n - 1] ?? [])
      .map((t) => `<span style="color:${t.color}${t.fontStyle & 1 ? ';font-style:italic' : ''}">${escapar(t.content)}</span>`)
      .join('')
    filas.push(`<tr><td class="n">${n}</td><td class="c">${html || ' '}</td></tr>`)
  }
  return `<!doctype html><html><head><meta charset="utf-8"><style>
  body{margin:0;background:#1e1e1e;font-family:'Segoe UI',Arial,sans-serif}
  .ventana{width:1000px;background:#1e1e1e;border:1px solid #3c3c3c}
  .pestanas{display:flex;background:#252526;height:35px}
  .pestana{display:flex;align-items:center;gap:8px;padding:0 14px;background:#1e1e1e;color:#fff;font-size:13px;border-top:1px solid #007acc}
  .pestana b{width:9px;height:9px;border-radius:2px;background:#519aba;display:inline-block}
  .migas{display:flex;align-items:center;gap:4px;height:22px;padding:0 14px;color:#a9a9a9;font-size:12px;background:#1e1e1e}
  .migas i{font-style:normal;color:#777;margin:0 2px}.migas .ultima{color:#d4d4d4}
  table{border-collapse:collapse;width:100%;font:15px/1.55 Consolas,'Cascadia Mono',monospace;margin:6px 0 8px}
  td.n{width:1%;padding:0 18px 0 16px;text-align:right;color:#858585;user-select:none;white-space:nowrap;vertical-align:top}
  td.c{padding:0 16px 0 0;white-space:pre;color:#d4d4d4}
  .estado{display:flex;justify-content:space-between;background:#007acc;color:#fff;font-size:12px;height:22px;align-items:center;padding:0 12px}
  </style></head><body><div class="ventana" id="v">
  <div class="pestanas"><div class="pestana"><b></b>${escapar(archivo)}</div></div>
  <div class="migas">${migas}</div>
  <table>${filas.join('')}</table>
  <div class="estado"><span>reservaupla · feature/diseno-final</span><span>Ln ${ini}, Col 1 &nbsp; UTF-8 &nbsp; ${nombreLenguaje}</span></div>
  </div></body></html>`
}

const navegador = await chromium.launch({ executablePath: ejecutable, headless: true })
const contexto = await navegador.newContext({ viewport: { width: 1040, height: 600 }, deviceScaleFactor: 2 })
let n = 0
for (const codigo of CODIGOS) {
  n += 1
  const texto = readFileSync(path.join(RAIZ, codigo.ruta), 'utf8').replace(/\r\n/g, '\n')
  const lineas = texto.split('\n')
  const { ini, fin } = rangoDe(codigo, lineas)
  const { tokens } = resaltador.codeToTokens(texto, { lang: LENGUAJES[path.extname(codigo.ruta)][0], theme: TEMA })
  const page = await contexto.newPage()
  await page.setContent(pagina(codigo, ini, fin, tokens))
  await page.locator('#v').screenshot({ path: path.join(SALIDA, `${codigo.clave}.png`) })
  await page.close()
  console.log(`ok ${codigo.clave}  ${codigo.ruta}:${ini}-${fin}`)
}
await navegador.close()
console.log(`Capturas de código: ${n} en ${path.relative(RAIZ, SALIDA)}`)
