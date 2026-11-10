import { AlignmentType, PageBreak, Paragraph, TableOfContents } from 'docx'
import { runs } from '../lib/word.js'

const centrado = (texto, opciones = {}) =>
  new Paragraph({ alignment: AlignmentType.CENTER, spacing: { after: opciones.despues ?? 200 }, children: runs(texto, opciones) })

function fechaHoy() {
  return new Intl.DateTimeFormat('es-PE', { day: 'numeric', month: 'long', year: 'numeric', timeZone: 'America/Lima' }).format(new Date())
}

export function portada() {
  return [
    new Paragraph({ spacing: { before: 1800 } }),
    centrado('**UNIVERSIDAD PERUANA LOS ANDES**', { size: 32 }),
    centrado('Facultad de Ingeniería', { size: 24 }),
    centrado('Curso: Construcción de Software', { size: 24, despues: 1200 }),
    centrado('**ReservaUPLA: Sistema de Gestión de Reservas de Ambientes Universitarios**', { size: 36, despues: 300 }),
    centrado('Informe técnico del caso práctico (semanas 01 a 09)', { size: 24, despues: 1200 }),
    centrado('Estudiante: ____________________________________', { size: 24 }),
    centrado('Docente: ______________________________________', { size: 24 }),
    centrado(`Fecha: ${fechaHoy()}`, { size: 24 }),
    centrado('Huancayo, Perú', { size: 24 }),
    new Paragraph({ children: [new PageBreak()] }),
  ]
}

export function indice() {
  return [
    new TableOfContents('Índice', { hyperlink: true, headingStyleRange: '1-2' }),
    new Paragraph({
      spacing: { before: 200 },
      children: runs(
        'Si el índice aparece vacío o desactualizado, haz clic derecho sobre él y elige «Actualizar campo» → «Actualizar toda la tabla». Word también puede preguntarlo al abrir el archivo.',
        { italics: true, color: '595959', size: 18 },
      ),
    }),
    new Paragraph({ children: [new PageBreak()] }),
  ]
}
