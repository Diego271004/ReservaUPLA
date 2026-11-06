import { useId, useRef } from 'react'
import { TEXTOS } from '../../constants/messages.js'
import estilos from './PestanasDeEstado.module.css'

/** Las pestañas de la lista de Reservas: un estado por pestaña y, entre paréntesis, cuántas reservas tiene. '' = Todas. */
export const PESTANAS = Object.freeze([
  { valor: '', texto: TEXTOS.pestanaTodas },
  { valor: 'Pendiente', texto: TEXTOS.pestanaPendientes },
  { valor: 'Aprobada', texto: TEXTOS.pestanaAprobadas },
  { valor: 'Rechazada', texto: TEXTOS.pestanaRechazadas },
  { valor: 'Cancelada', texto: TEXTOS.pestanaCanceladas },
])

/**
 * Patrón de pestañas WAI-ARIA: una sola pestaña entra en el orden del Tab (la activa) y las flechas, Inicio y Fin mueven
 * el foco y activan la pestaña. `conteos` puede ser null mientras carga (se muestra «…» en vez de un número falso).
 */
export default function PestanasDeEstado({ activa, conteos, alElegir, idPanel }) {
  const prefijo = useId()
  const refs = useRef([])

  const elegirPorIndice = (indice) => {
    const siguiente = (indice + PESTANAS.length) % PESTANAS.length
    refs.current[siguiente]?.focus()
    alElegir(PESTANAS[siguiente].valor)
  }

  const alPulsar = (evento, indice) => {
    const teclas = {
      ArrowRight: indice + 1,
      ArrowLeft: indice - 1,
      Home: 0,
      End: PESTANAS.length - 1,
    }
    if (!(evento.key in teclas)) return
    evento.preventDefault()
    elegirPorIndice(teclas[evento.key])
  }

  const total = conteos ? Object.values(conteos).reduce((suma, n) => suma + n, 0) : null

  return (
    <div role="tablist" aria-label={TEXTOS.etiquetaFiltroEstado} className={estilos.pestanas}>
      {PESTANAS.map((pestana, indice) => {
        const seleccionada = pestana.valor === activa
        const cantidad = pestana.valor === '' ? total : conteos?.[pestana.valor]
        return (
          <button
            key={pestana.valor || 'todas'}
            ref={(nodo) => {
              refs.current[indice] = nodo
            }}
            id={`${prefijo}-${indice}`}
            type="button"
            role="tab"
            aria-selected={seleccionada}
            aria-controls={idPanel}
            tabIndex={seleccionada ? 0 : -1}
            className={`${estilos.pestana} ${seleccionada ? estilos.activa : ''}`}
            onClick={() => alElegir(pestana.valor)}
            onKeyDown={(evento) => alPulsar(evento, indice)}
          >
            {pestana.texto}
            <span className={estilos.conteo}>{cantidad ?? '…'}</span>
          </button>
        )
      })}
    </div>
  )
}
