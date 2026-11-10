// Bloques de Word reutilizables: estilos reales (Título 1-3, Normal, Descripción), párrafos con
// marcado mínimo, tablas con encabezado sombreado y recuadros de captura numerados.
import { existsSync, readFileSync } from 'node:fs'
import path from 'node:path'
import {
  AlignmentType,
  BorderStyle,
  HeadingLevel,
  ImageRun,
  LevelFormat,
  Paragraph,
  ShadingType,
  Table,
  TableCell,
  TableLayoutType,
  TableRow,
  TextRun,
  WidthType,
  convertMillimetersToTwip,
} from 'docx'
import { RAIZ } from './codigo.js'

/** Carpeta de las capturas del informe (las genera tools/generar-informe/capturas.mjs con el sistema en marcha). */
export const CARPETA_CAPTURAS = path.join(RAIZ, 'docs', 'evidencias', 'informe')

export const FUENTE = 'Calibri'
export const MARGEN = convertMillimetersToTwip(25)
export const ANCHO_UTIL = convertMillimetersToTwip(210 - 50) // A4 menos márgenes
const AZUL = '1F3864'
const GRIS_RECUADRO = 'F2F2F2'
const SOMBRA_ENCABEZADO = 'D9E2F3'

export const estilos = {
  default: {
    document: { run: { font: FUENTE, size: 22 }, paragraph: { spacing: { after: 120, line: 276 } } },
    heading1: {
      run: { font: FUENTE, size: 32, bold: true, color: AZUL },
      paragraph: { spacing: { before: 360, after: 160 }, keepNext: true },
    },
    heading2: {
      run: { font: FUENTE, size: 26, bold: true, color: AZUL },
      paragraph: { spacing: { before: 240, after: 120 }, keepNext: true },
    },
    heading3: {
      run: { font: FUENTE, size: 23, bold: true, color: AZUL },
      paragraph: { spacing: { before: 200, after: 80 }, keepNext: true },
    },
  },
  // "caption" es el estilo integrado que Word muestra en español como "Descripción".
  paragraphStyles: [
    {
      id: 'Caption',
      name: 'caption',
      basedOn: 'Normal',
      next: 'Normal',
      quickFormat: true,
      run: { font: FUENTE, size: 20, bold: true, color: AZUL },
      paragraph: { spacing: { before: 240, after: 60 }, keepNext: true },
    },
  ],
}

export const numeracion = {
  config: [
    {
      reference: 'vinetas',
      levels: [
        {
          level: 0,
          format: LevelFormat.BULLET,
          text: '•',
          alignment: AlignmentType.LEFT,
          style: { paragraph: { indent: { left: 360, hanging: 260 } } },
        },
      ],
    },
    {
      reference: 'pasos',
      levels: [
        {
          level: 0,
          format: LevelFormat.DECIMAL,
          text: '%1.',
          alignment: AlignmentType.LEFT,
          style: { paragraph: { indent: { left: 360, hanging: 300 } } },
        },
      ],
    },
  ],
}

/**
 * Marcado mínimo dentro de un texto:
 *   **negrita**   `código`   [COMPLETAR ...]  (resaltado amarillo)
 */
export function runs(texto, { size, italics, color } = {}) {
  const partes = String(texto).split(/(\*\*[^*]+\*\*|`[^`]+`|\[COMPLETAR[^\]]*\])/g).filter(Boolean)
  return partes.map((parte) => {
    if (parte.startsWith('**')) return new TextRun({ text: parte.slice(2, -2), bold: true, size, italics, color })
    if (parte.startsWith('`'))
      return new TextRun({ text: parte.slice(1, -1), font: 'Consolas', size: (size ?? 22) - 2, color })
    if (parte.startsWith('[COMPLETAR'))
      return new TextRun({ text: parte, bold: true, highlight: 'yellow', size, italics })
    return new TextRun({ text: parte, size, italics, color })
  })
}

export const h1 = (t) => new Paragraph({ heading: HeadingLevel.HEADING_1, children: [new TextRun(t)] })
export const h2 = (t) => new Paragraph({ heading: HeadingLevel.HEADING_2, children: [new TextRun(t)] })
export const h3 = (t) => new Paragraph({ heading: HeadingLevel.HEADING_3, children: [new TextRun(t)] })

export const p = (texto, opciones = {}) =>
  new Paragraph({ children: runs(texto, opciones), alignment: opciones.alignment, spacing: opciones.spacing })

export const vinetas = (items, opciones = {}) =>
  items.map(
    (item) => new Paragraph({ children: runs(item, opciones), numbering: { reference: 'vinetas', level: 0 } }),
  )

/** Pasos numerados; `instancia` reinicia la numeración en cada lista. */
let instanciaPasos = 0
export function pasos(items, opciones = {}) {
  instanciaPasos += 1
  const instance = instanciaPasos
  return items.map(
    (item) =>
      new Paragraph({ children: runs(item, opciones), numbering: { reference: 'pasos', level: 0, instance } }),
  )
}

/** Texto pendiente del estudiante, resaltado en amarillo. */
export const completar = (que) => p(`[COMPLETAR POR EL ESTUDIANTE: ${que}]`)

const borde = { style: BorderStyle.SINGLE, size: 4, color: '808080' }
const bordes = { top: borde, bottom: borde, left: borde, right: borde, insideHorizontal: borde, insideVertical: borde }

/** Las rutas largas no tienen dónde partirse: se añade un espacio de ancho cero tras cada barra y guion bajo. */
const permitirSaltos = (texto) => String(texto).replace(/([/_])(?=\S)/g, '$1​');

function celda(contenido, { encabezado = false, ancho } = {}) {
  const parrafos = (Array.isArray(contenido) ? contenido : [contenido]).map((c) =>
    c instanceof Paragraph ? c : new Paragraph({ children: runs(permitirSaltos(c), { size: 20 }) }),
  )
  return new TableCell({
    children: parrafos,
    width: ancho ? { size: ancho, type: WidthType.DXA } : undefined,
    shading: encabezado ? { type: ShadingType.CLEAR, color: 'auto', fill: SOMBRA_ENCABEZADO } : undefined,
    margins: { top: 60, bottom: 60, left: 100, right: 100 },
  })
}

/**
 * Tabla con encabezado sombreado y repetido en cada página.
 * `proporciones`: fracciones del ancho útil por columna (suman 1).
 */
export function tabla(encabezados, filas, proporciones) {
  const anchos = (proporciones ?? encabezados.map(() => 1 / encabezados.length)).map((f) =>
    Math.round(f * ANCHO_UTIL),
  )
  const encabezado = new TableRow({
    tableHeader: true,
    cantSplit: true,
    children: encabezados.map((t, i) => celda(`**${t}**`, { encabezado: true, ancho: anchos[i] })),
  })
  const cuerpo = filas.map(
    (fila) => new TableRow({ cantSplit: true, children: fila.map((c, i) => celda(c, { ancho: anchos[i] })) }),
  )
  return [
    new Table({
      rows: [encabezado, ...cuerpo],
      width: { size: ANCHO_UTIL, type: WidthType.DXA },
      columnWidths: anchos,
      layout: TableLayoutType.FIXED,
      borders: bordes,
    }),
    new Paragraph({ spacing: { after: 120 } }),
  ]
}

// ---------------------------------------------------------------------------------------------
// Recuadros de captura. La numeración sigue el orden del documento; el registro alimenta el
// Anexo A.
// ---------------------------------------------------------------------------------------------
export const figuras = []

/** Texto pendiente dentro de un recuadro: amarillo, como el resto de lo que completa el estudiante. */
const PENDIENTE = '[COMPLETAR POR EL ESTUDIANTE: pega aquí la captura y borra este recuadro]'

/**
 * Fragmentos "ruta, líneas N–M" citados en los pasos de una figura de código. La herramienta de
 * capturas (tools/capturas) los lee de aquí: la imagen muestra exactamente el rango que cita el texto.
 */
const CITA = /([\w./-]+\.\w+), líneas? (\d+)(?:–(\d+))?/g
const fragmentosDe = (listaPasos) =>
  listaPasos.flatMap((paso) =>
    [...paso.matchAll(CITA)].map(([, ruta, ini, fin]) => ({ ruta, ini: Number(ini), fin: Number(fin ?? ini) })),
  )

/**
 * @param {string} id      identificador interno (para citar la figura desde otras secciones)
 * @param {string} titulo  título de la figura
 * @param {object} datos   { tipo: 'App'|'Terminal'|'Código'|'Prototipo'|'Boceto', que, pasos: string[], archivo,
 *                           seccion, estudiante: true si la captura le toca al estudiante }
 */
export function figura(id, titulo, { tipo, que, pasos: listaPasos, archivo, seccion, estudiante = false }) {
  const n = figuras.length + 1
  const rutaCaptura = path.join(CARPETA_CAPTURAS, archivo)
  const hecha = existsSync(rutaCaptura)
  const fragmentos = tipo === 'Código' ? fragmentosDe(listaPasos) : []
  figuras.push({ id, n, titulo, tipo, archivo, seccion, hecha, estudiante, fragmentos })

  const descripcion = new Paragraph({ style: 'Caption', children: [new TextRun(`Figura ${n}. ${titulo}`)] })
  // Si la captura ya existe en docs/capturas, se inserta en lugar del recuadro de instrucciones.
  if (hecha) {
    const fuente = fragmentos.length
      ? [p(`Fuente: ${fragmentos.map((f) => `\`${f.ruta}\`, ${f.ini === f.fin ? `línea ${f.ini}` : `líneas ${f.ini}–${f.fin}`}`).join('; ')}.`, { size: 18, alignment: AlignmentType.CENTER })]
      : []
    return [descripcion, imagen(rutaCaptura, tipo), ...fuente, new Paragraph({ spacing: { after: 200 } })]
  }

  const contenido = [
    new Paragraph({ children: runs(`**Qué debe verse:** ${que}`, { size: 20 }) }),
    new Paragraph({ children: runs('**Cómo obtenerla:**', { size: 20 }) }),
    ...pasos(listaPasos, { size: 20 }),
    new Paragraph({ children: runs(`**Nombre sugerido del archivo:** \`${archivo}\``, { size: 20 }) }),
  ]
  const recuadro = new Table({
    width: { size: ANCHO_UTIL, type: WidthType.DXA },
    columnWidths: [ANCHO_UTIL],
    borders: bordes,
    rows: [
      new TableRow({
        cantSplit: false,
        children: [
          new TableCell({
            children: contenido,
            shading: { type: ShadingType.CLEAR, color: 'auto', fill: GRIS_RECUADRO },
            margins: { top: 100, bottom: 100, left: 140, right: 140 },
          }),
        ],
      }),
    ],
  })
  return [
    descripcion,
    recuadro,
    new Paragraph({
      spacing: { before: 60, after: 200 },
      children: runs(PENDIENTE),
    }),
  ]
}

const ANCHO_MAX_PX = Math.floor((150 / 25.4) * 96) // 15 cm a 96 ppp
// Alto máximo: las capturas de pantalla hasta ~16 cm (se leen a ese tamaño); el código y la
// terminal hasta ~21,7 cm, lo que cabe en una página A4 junto a su pie.
const ALTO_MAX_PX = { App: 600, Prototipo: 600, Boceto: 600, Código: 820, Terminal: 820 }

/** Píxeles por píxel CSS según el bloque pHYs del PNG (las capturas se toman a 2x = 192 ppp). */
function densidadPng(datos) {
  let i = 8
  while (i < datos.length) {
    const largo = datos.readUInt32BE(i)
    const tipo = datos.toString('ascii', i + 4, i + 8)
    if (tipo === 'pHYs' && datos.readUInt8(i + 16) === 1) return Math.max(1, (datos.readUInt32BE(i + 8) * 0.0254) / 96)
    if (tipo === 'IDAT') return 1
    i += 12 + largo
  }
  return 1
}

/** Imagen PNG o JPG escalada al ancho útil (máx. 15 cm), centrada. */
function imagen(ruta, tipo) {
  const datos = readFileSync(ruta)
  const esPng = datos.readUInt32BE(0) === 0x89504e47
  const densidad = esPng ? densidadPng(datos) : 1
  const real = esPng ? { ancho: datos.readUInt32BE(16), alto: datos.readUInt32BE(20) } : dimensionesJpg(datos)
  const ancho = real.ancho / densidad
  const alto = real.alto / densidad
  const escala = Math.min(1, ANCHO_MAX_PX / ancho, (ALTO_MAX_PX[tipo] ?? 600) / alto)
  return new Paragraph({
    alignment: AlignmentType.CENTER,
    keepLines: true,
    children: [
      new ImageRun({
        type: esPng ? 'png' : 'jpg',
        data: datos,
        transformation: { width: Math.round(ancho * escala), height: Math.round(alto * escala) },
      }),
    ],
  })
}

function dimensionesJpg(datos) {
  let i = 2
  while (i < datos.length) {
    const marcador = datos.readUInt16BE(i)
    if (marcador >= 0xffc0 && marcador <= 0xffc3) return { alto: datos.readUInt16BE(i + 5), ancho: datos.readUInt16BE(i + 7) }
    i += 2 + datos.readUInt16BE(i + 2)
  }
  throw new Error('No se pudieron leer las dimensiones del JPG')
}

/** "Figura N" a partir del id (se usa después de construir las secciones). */
export function numeroFigura(id) {
  const f = figuras.find((x) => x.id === id)
  if (!f) throw new Error(`Figura no registrada: ${id}`)
  return f.n
}

export const figs = (...ids) => ids.map((id) => `Fig. ${numeroFigura(id)}`).join(', ')
