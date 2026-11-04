import { useEffect, useId, useRef } from 'react'
import { TEXTOS } from '../../constants/messages.js'
import Button from './Button.jsx'
import estilos from './ModalConfirmacion.module.css'

const FOCALIZABLES =
  'button:not([disabled]), [href], input, select, textarea, [tabindex]:not([tabindex="-1"])'

/**
 * Confirmación antes de una acción irreversible: título, resumen, "Volver" y el botón de confirmar
 * (`variante="rechazo"` lo pinta rojo sólido). `advertencia` (opcional) avisa de las consecuencias, p. ej. que no se
 * puede deshacer. Al abrir, el foco pasa a "Volver" (la opción segura); Tab
 * no sale del cuadro; Escape equivale a "Volver"; al cerrar, el foco regresa a donde estaba.
 */
export default function ModalConfirmacion({
  abierto,
  titulo,
  resumen = [],
  advertencia,
  textoConfirmar,
  textoVolver = TEXTOS.volver,
  variante = 'primario',
  cargando = false,
  onConfirmar,
  onVolver,
}) {
  const idTitulo = useId()
  const idResumen = useId()
  const idAdvertencia = useId()
  const cuadroRef = useRef(null)
  const botonVolverRef = useRef(null)

  useEffect(() => {
    if (!abierto) return undefined
    const elementoPrevio = document.activeElement
    botonVolverRef.current?.focus()
    return () => elementoPrevio?.focus?.()
  }, [abierto])

  if (!abierto) return null

  const alPulsarTecla = (evento) => {
    if (evento.key === 'Escape') {
      evento.stopPropagation()
      onVolver()
      return
    }
    if (evento.key !== 'Tab') return
    const elementos = [...cuadroRef.current.querySelectorAll(FOCALIZABLES)]
    const primero = elementos[0]
    const ultimo = elementos[elementos.length - 1]
    if (evento.shiftKey && document.activeElement === primero) {
      evento.preventDefault()
      ultimo.focus()
    } else if (!evento.shiftKey && document.activeElement === ultimo) {
      evento.preventDefault()
      primero.focus()
    }
  }

  return (
    <div className={estilos.fondo}>
      <div
        ref={cuadroRef}
        role="dialog"
        aria-modal="true"
        aria-labelledby={idTitulo}
        aria-describedby={
          [resumen.length > 0 && idResumen, advertencia && idAdvertencia]
            .filter(Boolean)
            .join(' ') || undefined
        }
        className={estilos.cuadro}
        onKeyDown={alPulsarTecla}
      >
        <h2 id={idTitulo} className={estilos.titulo}>
          {titulo}
        </h2>
        {resumen.length > 0 && (
          <div id={idResumen} className={estilos.resumen}>
            {resumen.map((linea) => (
              <p key={linea}>{linea}</p>
            ))}
          </div>
        )}
        {advertencia && (
          <p id={idAdvertencia} className={estilos.advertencia}>
            {advertencia}
          </p>
        )}
        <div className={estilos.acciones}>
          <button ref={botonVolverRef} type="button" className={estilos.volver} onClick={onVolver}>
            {textoVolver}
          </button>
          <Button
            variante={variante === 'rechazo' ? 'confirmarRechazo' : 'primario'}
            cargando={cargando}
            textoCarga={TEXTOS.guardando}
            onClick={onConfirmar}
          >
            {textoConfirmar}
          </Button>
        </div>
      </div>
    </div>
  )
}
