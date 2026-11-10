// Reabre docs/INFORME_ReservaUPLA.docx con mammoth (lector independiente de la librería docx) y comprueba que no está dañado,
// que tiene todas las secciones, que no quedaron marcas de formato sueltas y que no filtra secretos.
// Uso: npm run verificar            -> resumen
//      node verificar.js --texto F  -> además guarda el texto plano en F (para revisión)
import { writeFileSync } from 'node:fs'
import path from 'node:path'
import mammoth from 'mammoth'
import { RAIZ } from './lib/codigo.js'

const iArchivo = process.argv.indexOf('--archivo')
const ARCHIVO = iArchivo > 0 ? path.resolve(process.argv[iArchivo + 1]) : path.join(RAIZ, 'docs', 'INFORME_ReservaUPLA.docx')

const SECCIONES = [
  'Resumen',
  '1. Análisis del problema, actores y alcance (semana 01)',
  '2. Ciclo de vida del software (semana 02)',
  '3. Estándares de construcción (semana 03)',
  '4. Estructura inicial: backend, frontend y base de datos (semana 04)',
  '5. Formularios de entrada de datos (semana 05)',
  '6. Validaciones en frontend y backend (semana 06)',
  '7. Reutilización de componentes (semana 07)',
  '8. Refinamiento de código (semana 08)',
  '9. Módulos de salida de datos y dashboard (semana 09)',
  '10. Calidad: pruebas, accesibilidad, usabilidad y mantenibilidad',
  '11. Reflexión final y conclusiones',
  'Anexo A. Cómo ejecutar el sistema',
  'Anexo B. Índice de figuras',
]
const REQUISITOS = ['RF-01', 'RF-02', 'RF-03', 'RF-04', 'RF-05', 'RF-06', 'RF-07', 'RF-08', 'RN-01', 'RN-02', 'RN-03', 'RN-04', 'RN-05', 'RN-06']
const COMPONENTES = ['TextInput', 'SelectInput', 'DateInput', 'TimeInput', 'Button', 'AlertMessage', 'ModalConfirmacion', 'TableList', 'CardIndicador']
// Nada de esto puede aparecer: la contraseña de prueba (solo en el README), claves, tokens o cadenas de conexión reales.
const PROHIBIDO = [/Prueba#2026Upla/, /PGPASSWORD\s*=\s*'root'/, /eyJ[\w-]{10,}\.[\w-]{10,}\./, /Password=(?!<)[^;'"\s`]+/]
// Marcas de formato que no se interpretaron (texto que quedó con asteriscos o comillas invertidas sueltas) y valores rotos.
const SUELTO = [/\*\*[^*\n]/, /`/, /undefined/, /NaN/, /\[object Object\]/]

const { value: texto, messages } = await mammoth.extractRawText({ path: ARCHIVO })
const { value: html } = await mammoth.convertToHtml({ path: ARCHIVO })

const errores = []
for (const s of SECCIONES) if (!html.includes(`>${s}<`)) errores.push(`Falta el título de sección: ${s}`)
for (const r of [...REQUISITOS, ...COMPONENTES]) if (!texto.includes(r)) errores.push(`Falta mencionar ${r}`)
for (const r of PROHIBIDO) if (r.test(texto)) errores.push(`Contenido prohibido encontrado: ${r}`)
for (const r of SUELTO) {
  const m = texto.match(r)
  if (m) errores.push(`Marca suelta ${r}: ...${texto.slice(Math.max(0, m.index - 40), m.index + 60).replace(/\n/g, ' ')}...`)
}

const figuras = [...texto.matchAll(/^Figura (\d+)\. /gm)].map((m) => Number(m[1]))
const correlativas = figuras.every((n, i) => n === i + 1)
if (!correlativas) errores.push('La numeración de figuras no es correlativa')
const recuadros = (texto.match(/\[COMPLETAR POR EL ESTUDIANTE: pega aquí la captura y borra este recuadro\]/g) ?? []).length
const imagenes = (html.match(/<img /g) ?? []).length
if (recuadros + imagenes !== figuras.length) errores.push(`Recuadros (${recuadros}) + capturas insertadas (${imagenes}) ≠ figuras (${figuras.length})`)
if (recuadros > 0) errores.push(`Quedan ${recuadros} figuras sin captura`)
const completar = texto.match(/\[COMPLETAR[^\]]*\]/g) ?? []

console.log(`Archivo: ${path.relative(RAIZ, ARCHIVO)} — abierto sin errores por mammoth`)
console.log(`Advertencias del lector: ${messages.length}`)
console.log(`Secciones encontradas: ${SECCIONES.length - errores.filter((e) => e.startsWith('Falta el título')).length}/${SECCIONES.length}`)
console.log(`Figuras: ${figuras.length} (correlativas: ${correlativas ? 'sí' : 'no'}); capturas insertadas: ${imagenes}; sin captura: ${recuadros}`)
console.log(`Marcas [COMPLETAR] (lo que le toca a la estudiante): ${completar.length}`)
for (const c of completar) console.log(`   - ${c}`)
console.log(`Encabezados: h1=${(html.match(/<h1>/g) ?? []).length}, h2=${(html.match(/<h2>/g) ?? []).length}`)
console.log(`Palabras (aprox.): ${texto.split(/\s+/).filter(Boolean).length}`)

const iTexto = process.argv.indexOf('--texto')
if (iTexto > 0) {
  writeFileSync(process.argv[iTexto + 1], texto, 'utf8')
  console.log(`Texto plano guardado en ${process.argv[iTexto + 1]}`)
}

if (errores.length) {
  console.error('\nERRORES:\n- ' + errores.join('\n- '))
  process.exit(1)
}
console.log('\nVerificación correcta.')
