import { useId, useRef } from 'react'
import { TEXTOS } from '../../constants/messages.js'
import { useTrampaDeFoco } from '../../hooks/useTrampaDeFoco.js'
import Button from './Button.jsx'
import estilos from './ModalConfirmacion.module.css'

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

  const alPulsarTecla = useTrampaDeFoco(abierto, cuadroRef, {
    alEscape: onVolver,
    inicialRef: botonVolverRef,
  })

  if (!abierto) return null

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
