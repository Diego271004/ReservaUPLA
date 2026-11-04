import { TEXTOS } from '../../constants/messages.js'
import { MODALES, resumenDe } from '../../utils/modalesDeReserva.js'
import ModalConfirmacion from '../ui/ModalConfirmacion.jsx'

/**
 * El modal de confirmación de aprobar, rechazar o cancelar una reserva (el Detalle y el Dashboard usan este mismo):
 * título, resumen de la reserva y, en las acciones sin vuelta atrás, la advertencia. Sin `accion` queda cerrado.
 */
export default function ModalDeReserva({ accion, reserva, ejecutando, alConfirmar, alVolver }) {
  const modal = accion ? MODALES[accion] : null
  return (
    <ModalConfirmacion
      abierto={modal !== null}
      titulo={modal?.titulo ?? ''}
      resumen={reserva ? resumenDe(reserva) : []}
      advertencia={modal?.irreversible ? TEXTOS.advertenciaIrreversible : undefined}
      textoConfirmar={modal?.confirmar ?? ''}
      variante={modal?.variante}
      cargando={ejecutando}
      onConfirmar={alConfirmar}
      onVolver={alVolver}
    />
  )
}
