// Genera docs/INFORME_ReservaUPLA.docx. Uso (desde tools/generar-informe): npm run generar
import { writeFileSync } from 'node:fs'
import path from 'node:path'
import { AlignmentType, Document, Footer, Packer, PageNumber, Paragraph, TextRun } from 'docx'
import { citas, RAIZ } from './lib/codigo.js'
import { estilos, figuras, MARGEN, numeracion } from './lib/word.js'
import { construirCuerpo } from './lib/cuerpo.js'
import { indice, portada } from './contenido/portada-rubrica.js'

// --salida <ruta> escribe en otro lugar (útil para no pisar una copia ya editada en Word).
const iSalida = process.argv.indexOf('--salida')
const SALIDA = iSalida > 0 ? path.resolve(process.argv[iSalida + 1]) : path.join(RAIZ, 'docs', 'INFORME_ReservaUPLA.docx')

const { cuerpo, anexos } = construirCuerpo()

const pie = new Footer({
  children: [
    new Paragraph({
      alignment: AlignmentType.CENTER,
      children: [new TextRun({ children: ['Página ', PageNumber.CURRENT, ' de ', PageNumber.TOTAL_PAGES], size: 18 })],
    }),
  ],
})

const documento = new Document({
  creator: 'ReservaUPLA',
  title: 'ReservaUPLA: Sistema de Gestión de Reservas de Ambientes Universitarios',
  description: 'Informe técnico del caso práctico — Construcción de Software (UPLA)',
  features: { updateFields: true },
  styles: estilos,
  numbering: numeracion,
  sections: [
    {
      properties: {
        page: {
          size: { width: 11906, height: 16838 }, // A4
          margin: { top: MARGEN, right: MARGEN, bottom: MARGEN, left: MARGEN },
        },
      },
      footers: { default: pie },
      children: [...portada(), ...indice(), ...cuerpo, ...anexos],
    },
  ],
})

const buffer = await Packer.toBuffer(documento)
writeFileSync(SALIDA, buffer)

console.log(`Informe generado: ${path.relative(RAIZ, SALIDA)} (${Math.round(buffer.length / 1024)} KB)`)
console.log(`Figuras: ${figuras.length} (${figuras.filter((f) => f.hecha).length} con captura)`)
console.log(`Citas de código verificadas: ${citas.length}`)
if (process.argv.includes('--citas')) {
  for (const c of citas) console.log(`  ${c.ruta}:${c.ini}-${c.fin}  | ${c.primera}  …  ${c.ultima}`)
}
