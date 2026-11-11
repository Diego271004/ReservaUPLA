import { useCallback, useState } from 'react'
import { TEXTOS } from '../constants/messages.js'
import { usePendientes } from '../context/PendientesContext.jsx'
import { RESULTADO } from '../services/llamarApi.js'
import { ACCIONES } from './accionesDeReserva.js'
import { useAccion } from './useAccion.js'

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
    if (resultado.tipo === RESULTADO.exito || resultado.tipo === RESULTADO.conflicto) alTerminar()
  }, [decision, ejecutar, alTerminar, refrescarPendientes])

  return { decision, ejecutando, alerta, abrir, cerrar, confirmar }
}
