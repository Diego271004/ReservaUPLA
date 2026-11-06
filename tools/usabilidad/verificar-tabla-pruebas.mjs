import { readFileSync, existsSync } from 'node:fs'
import { resolve, join } from 'node:path'
import { fileURLToPath } from 'node:url'

const RUTA_HERRAMIENTAS = fileURLToPath(new URL('.', import.meta.url))
const RUTA_RAIZ = resolve(RUTA_HERRAMIENTAS, '../..')
const RUTA_AVANCE = join(RUTA_RAIZ, 'docs/avance-experiencia.md')

function verificarTabla() {
  if (!existsSync(RUTA_AVANCE)) {
    console.error(`No existe el archivo de avance: ${RUTA_AVANCE}`)
    process.exit(1)
  }

  const contenido = readFileSync(RUTA_AVANCE, 'utf8')
  const seccionPaso11 = contenido.split(/## PASO 11\./i)[1]
  if (!seccionPaso11) {
    console.error('No se encontró la sección PASO 11 en docs/avance-experiencia.md')
    process.exit(1)
  }

  // Extraer las líneas de la tabla markdown
  const lineas = seccionPaso11.split('\n')
  const filasTabla = []
  let enTabla = false

  for (const linea of lineas) {
    const l = linea.trim()
    if (l.startsWith('|') && l.endsWith('|')) {
      if (l.includes('Control o Estado') || l.includes(':---')) {
        enTabla = true
        continue
      }
      if (enTabla) {
        filasTabla.push(l)
      }
    } else if (enTabla && l === '') {
      break
    }
  }

  console.log(`Verificando ${filasTabla.length} filas de la tabla Control → Prueba...\n`)
  let fallos = 0
  let exitos = 0

  for (const fila of filasTabla) {
    const celdas = fila
      .split('|')
      .slice(1, -1)
      .map((c) => c.trim())

    if (celdas.length < 3) continue

    const [control, archivoRaw, testNombre] = celdas
    const archivos = archivoRaw
      .split(/<br\s*\/?>/i)
      .map((s) => s.replace(/`/g, '').trim())
      .filter(Boolean)
    const tests = testNombre
      .split(/<br\s*\/?>/i)
      .map((s) => s.replace(/`/g, '').trim())
      .filter(Boolean)

    if (archivos.length === 0 || tests.length === 0) continue

    for (const testLimpio of tests) {
      let encontrado = false
      let archivoExito = ''
      for (const archivoLimpio of archivos) {
        let rutaArchivo = join(RUTA_RAIZ, archivoLimpio)
        if (!existsSync(rutaArchivo)) {
          rutaArchivo = join(RUTA_RAIZ, 'frontend', archivoLimpio)
        }
        if (!existsSync(rutaArchivo)) {
          continue
        }
        const contenidoArchivo = readFileSync(rutaArchivo, 'utf8')
        if (contenidoArchivo.includes(testLimpio)) {
          encontrado = true
          archivoExito = archivoLimpio
          break
        }
      }

      if (!encontrado) {
        console.error(`✖ TEST NO ENCONTRADO EN ${archivos.join(', ')}:`)
        console.error(`   Control: ${control}`)
        console.error(`   Buscado: "${testLimpio}"\n`)
        fallos++
      } else {
        console.log(`✔ OK: [${control.replace(/\*\*/g, '')}]`)
        console.log(`   Archivo: ${archivoExito}`)
        console.log(`   Test: "${testLimpio}"\n`)
        exitos++
      }
    }
  }

  console.log('----------------------------------------------------')
  console.log(`TOTAL: ${exitos} comprobados con éxito, ${fallos} fallos.`)
  if (fallos > 0) {
    process.exit(1)
  }
}

verificarTabla()
