// Construye el cuerpo del informe en el orden del documento. Las secciones se construyen en orden para que la numeración de
// figuras sea correlativa; los anexos van al final porque leen el registro de figuras.
import { anexoEjecucion, anexoFiguras } from '../contenido/anexos.js'
import { seccionResumen } from '../contenido/s0-resumen.js'
import { seccionAnalisis } from '../contenido/s1-analisis.js'
import { seccionCiclo, seccionEstandares } from '../contenido/s2-ciclo-estandares.js'
import { seccionEstructura } from '../contenido/s3-estructura.js'
import { seccionFormularios, seccionValidaciones } from '../contenido/s4-formularios-validaciones.js'
import { seccionReutilizacion, seccionRefinamiento } from '../contenido/s5-reutilizacion-refinamiento.js'
import { seccionSalida } from '../contenido/s6-salida-datos.js'
import { seccionCalidad } from '../contenido/s7-calidad.js'
import { seccionReflexion } from '../contenido/s8-reflexion.js'

export function construirCuerpo() {
  const cuerpo = [
    ...seccionResumen(),
    ...seccionAnalisis(),
    ...seccionCiclo(),
    ...seccionEstandares(),
    ...seccionEstructura(),
    ...seccionFormularios(),
    ...seccionValidaciones(),
    ...seccionReutilizacion(),
    ...seccionRefinamiento(),
    ...seccionSalida(),
    ...seccionCalidad(),
    ...seccionReflexion(),
  ]
  const anexos = [...anexoEjecucion(), ...anexoFiguras()]
  return { cuerpo, anexos }
}
