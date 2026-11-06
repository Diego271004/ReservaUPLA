import { useCallback, useState } from 'react'
import { TEXTOS } from '../constants/messages.js'
import { usePendientes } from '../context/PendientesContext.jsx'
import { RESULTADO } from '../services/llamarApi.js'
import { ACCIONES } from './accionesDeReserva.js'
import { useAccion } from './useAccion.js'

/**
 * Aprobar o rechazar una reserva desde una lista (el Dashboard): qué decisión está abierta en el modal y lo que deja al
 * confirmarla. Al terminar bien llama a `alTerminar` (la lista se vuelve a pedir). Sin JSX.
 */
export function useDecisionDeReserva(alTerminar) {
  const [decision, setDecision] = useState(null) // { accion: 'aprobar' | 'rechazar', reserva } | null
  const { ejecutando, alerta, ejecutar } = useAccion()
  const { refrescar: refrescarPendientes } = usePendientes()

  const abrir = useCallback((accion, reserva) => setDecision({ accion, reserva }), [])
  const cerrar = useCallback(() => setDecision(null), [])

  const confirmar = useCallback(async () => {
    if (!decision) return
    const { servicio, exito } = ACCIONES[decision.accion]
    const resultado = await ejecutar(() => servicio(decision.reserva.id), {
      mensajeExito: exito,
      noEncontrado: TEXTOS.reservaNoEncontrada,
    })
    if (resultado === null) return // ya había una acción en curso
    setDecision(null)
    if (resultado.tipo === RESULTADO.exito) refrescarPendientes() // el contador del menú
    // Se vuelve a pedir la lista con éxito o sin él: tras un conflicto (409) o un «ya no existe» el estado real cambió.
    if (resultado.tipo === RESULTADO.exito || resultado.tipo === RESULTADO.conflicto) alTerminar()
  }, [decision, ejecutar, alTerminar, refrescarPendientes])

  return { decision, ejecutando, alerta, abrir, cerrar, confirmar }
}
