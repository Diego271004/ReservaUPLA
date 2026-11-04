import { TEXTOS, textoPagina } from '../../constants/messages.js'
import { paginasVisibles, totalDePaginas } from '../../utils/paginacion.js'
import Button from '../ui/Button.jsx'
import estilos from './Paginacion.module.css'

/**
 * Paginación de las listas: «Anterior», los números cercanos y «Siguiente». «Anterior» está deshabilitado en la primera
 * página y «Siguiente» en la última; la página actual lleva aria-current. Con una sola página no se dibuja.
 */
export default function Paginacion({ pagina, total, tamano, alCambiar }) {
  const paginas = totalDePaginas(total, tamano)
  if (paginas <= 1) return null

  return (
    <nav className={estilos.paginacion} aria-label={TEXTOS.paginacion}>
      <Button
        variante="secundario"
        deshabilitado={pagina <= 1}
        onClick={() => alCambiar(pagina - 1)}
      >
        {TEXTOS.anterior}
      </Button>
      {paginasVisibles(pagina, paginas).map((numero, indice) =>
        numero === '…' ? (
          <span key={`hueco-${indice}`} className={estilos.hueco} aria-hidden="true">
            …
          </span>
        ) : (
          <Button
            key={numero}
            variante={numero === pagina ? 'primario' : 'secundario'}
            aria-current={numero === pagina ? 'page' : undefined}
            aria-label={textoPagina(numero)}
            onClick={() => alCambiar(numero)}
          >
            {numero}
          </Button>
        ),
      )}
      <Button
        variante="secundario"
        deshabilitado={pagina >= paginas}
        onClick={() => alCambiar(pagina + 1)}
      >
        {TEXTOS.siguiente}
      </Button>
    </nav>
  )
}
