import { textoMostrando } from '../../constants/messages.js'
import Paginacion from '../Paginacion/Paginacion.jsx'
import estilos from './PieDeLista.module.css'

/** El pie de una lista paginada: «Mostrando N de M» y, si hay más de una página, la paginación. */
export default function PieDeLista({ pagina }) {
  return (
    <>
      {pagina.total > 0 && (
        <p role="status" className={estilos.resumen}>
          {textoMostrando(pagina.elementos.length, pagina.total)}
        </p>
      )}
      <Paginacion
        pagina={pagina.pagina}
        total={pagina.total}
        tamano={pagina.tamano}
        alCambiar={pagina.alCambiar}
      />
    </>
  )
}
