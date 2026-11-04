import { useCallback, useEffect, useState } from 'react'
import { MENSAJES, TEXTOS } from '../constants/messages.js'
import { RESULTADO } from '../services/llamarApi.js'
import { mensajeDeError } from '../services/mensajesDeResultado.js'
import {
  aprobarReserva,
  cancelarReserva,
  obtenerReserva,
  rechazarReserva,
} from '../services/recursosService.js'
import { useAccion } from './useAccion.js'

export const ESTADOS_PAGINA = Object.freeze({
  cargando: 'cargando',
  listo: 'listo',
  noEncontrado: 'noEncontrado',
  error: 'error',
})

const ACCIONES = {
  aprobar: { servicio: aprobarReserva, exito: MENSAJES.reservaAprobada },
  rechazar: { servicio: rechazarReserva, exito: MENSAJES.reservaRechazada },
  cancelar: { servicio: cancelarReserva, exito: MENSAJES.reservaCancelada },
}

/**
 * Estado del detalle de una reserva: la carga, el modal de confirmación abierto y lo que deja cada acción. El estado
 * "ejecutando / éxito / error" de aprobar, rechazar y cancelar lo lleva useAccion, igual que los formularios.
 * Sin JSX; DetalleReservaPage solo pinta lo que devuelve.
 */
export function useDetalleReserva(id) {
  const [pagina, setPagina] = useState({
    estado: ESTADOS_PAGINA.cargando,
    detalle: null,
    error: null,
  })
  const [modal, setModal] = useState(null) // 'aprobar' | 'rechazar' | 'cancelar' | null
  const { ejecutando, alerta, ejecutar } = useAccion()

  const cargar = useCallback(async () => {
    setPagina({ estado: ESTADOS_PAGINA.cargando, detalle: null, error: null })
    const resultado = await obtenerReserva(id)
    if (resultado.tipo === RESULTADO.exito) {
      setPagina({ estado: ESTADOS_PAGINA.listo, detalle: resultado.data, error: null })
    } else if (resultado.tipo === RESULTADO.noEncontrado) {
      setPagina({ estado: ESTADOS_PAGINA.noEncontrado, detalle: null, error: null })
    } else {
      const error = mensajeDeError(resultado) ?? MENSAJES.errorServidor
      setPagina({ estado: ESTADOS_PAGINA.error, detalle: null, error })
    }
  }, [id])

  useEffect(() => {
    // Carga inicial al abrir la pantalla: el estado cambia cuando responde la API.
    // eslint-disable-next-line react-hooks/set-state-in-effect
    cargar()
  }, [cargar])

  const abrirModal = useCallback((accion) => setModal(accion), [])
  const cerrarModal = useCallback(() => setModal(null), [])

  const confirmar = useCallback(async () => {
    const accion = ACCIONES[modal]
    if (!accion) return
    const resultado = await ejecutar(() => accion.servicio(pagina.detalle.reserva.id), {
      mensajeExito: accion.exito,
      noEncontrado: TEXTOS.reservaNoEncontrada,
    })
    if (resultado === null) return // ya había una acción en curso
    setModal(null)
    if (resultado.tipo === RESULTADO.exito) {
      setPagina((previa) => ({ ...previa, detalle: resultado.data }))
    }
  }, [modal, ejecutar, pagina.detalle])

  return {
    ...pagina,
    modal,
    ejecutando,
    alerta,
    recargar: cargar,
    abrirModal,
    cerrarModal,
    confirmar,
  }
}
