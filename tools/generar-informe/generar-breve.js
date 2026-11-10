// Genera docs/INFORME_ReservaUPLA_breve.docx (el informe técnico breve que pide la guía). Uso: node generar-breve.js
import { writeFileSync } from 'node:fs'
import path from 'node:path'
import { AlignmentType, Document, Footer, Packer, PageNumber, Paragraph, TextRun } from 'docx'
import { RAIZ } from './lib/codigo.js'
import { estilos, MARGEN, numeracion } from './lib/word.js'
import { portada } from './contenido/portada-rubrica.js'
import { cuerpoBreve } from './contenido/breve.js'

const SALIDA = path.join(RAIZ, 'docs', 'INFORME_ReservaUPLA_breve.docx')
const pie = new Footer({
  children: [new Paragraph({ alignment: AlignmentType.CENTER, children: [new TextRun({ children: ['Página ', PageNumber.CURRENT], size: 18 })] })],
})
const documento = new Document({
  creator: 'ReservaUPLA',
  title: 'ReservaUPLA: informe técnico breve',
  styles: estilos,
  numbering: numeracion,
  sections: [
    {
      properties: { page: { size: { width: 11906, height: 16838 }, margin: { top: MARGEN, right: MARGEN, bottom: MARGEN, left: MARGEN } } },
      footers: { default: pie },
      children: [...portada(), ...cuerpoBreve()],
    },
  ],
})
writeFileSync(SALIDA, await Packer.toBuffer(documento))
console.log(`Generado: ${path.relative(RAIZ, SALIDA)}`)
