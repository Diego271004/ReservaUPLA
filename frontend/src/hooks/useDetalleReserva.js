import { useCallback, useEffect, useState } from 'react'
import { MENSAJES, TEXTOS } from '../constants/messages.js'
import { RESULTADO } from '../services/llamarApi.js'
import {
  aprobarReserva,
  cancelarReserva,
  obtenerReserva,
  rechazarReserva,
} from '../services/recursosService.js'

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

const MENSAJE_POR_RESULTADO = {
  [RESULTADO.sinPermiso]: MENSAJES.sinPermiso,
  [RESULTADO.demasiadosIntentos]: MENSAJES.demasiadosIntentos,
  [RESULTADO.errorServidor]: MENSAJES.errorServidor,
  [RESULTADO.errorConexion]: MENSAJES.errorConexion,
}

/**
 * Estado del detalle de una reserva: la carga, el modal de confirmación abierto, la acción en curso y el mensaje
 * (éxito o error) que deja cada acción. Sin JSX; DetalleReservaPage solo pinta lo que devuelve.
 */
export function useDetalleReserva(id) {
  const [pagina, setPagina] = useState({
    estado: ESTADOS_PAGINA.cargando,
    detalle: null,
    error: null,
  })
  const [modal, setModal] = useState(null) // 'aprobar' | 'rechazar' | 'cancelar' | null
  const [ejecutando, setEjecutando] = useState(false)
  const [alerta, setAlerta] = useState(null) // { tipo: 'exito' | 'error', mensaje }

  const cargar = useCallback(async () => {
    setPagina({ estado: ESTADOS_PAGINA.cargando, detalle: null, error: null })
    const resultado = await obtenerReserva(id)
    if (resultado.tipo === RESULTADO.exito) {
      setPagina({ estado: ESTADOS_PAGINA.listo, detalle: resultado.data, error: null })
    } else if (resultado.tipo === RESULTADO.noEncontrado) {
      setPagina({ estado: ESTADOS_PAGINA.noEncontrado, detalle: null, error: null })
    } else {
      const mensaje = MENSAJE_POR_RESULTADO[resultado.tipo] ?? MENSAJES.errorServidor
      setPagina({ estado: ESTADOS_PAGINA.error, detalle: null, error: mensaje })
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
    if (!accion || ejecutando) return
    setEjecutando(true)
    setAlerta(null)

    const resultado = await accion.servicio(pagina.detalle.reserva.id)

    setEjecutando(false)
    setModal(null)
    if (resultado.tipo === RESULTADO.exito) {
      setPagina((previa) => ({ ...previa, detalle: resultado.data }))
      setAlerta({ tipo: 'exito', mensaje: accion.exito })
    } else if (resultado.tipo === RESULTADO.conflicto) {
      setAlerta({ tipo: 'error', mensaje: resultado.mensaje })
    } else if (resultado.tipo === RESULTADO.noEncontrado) {
      setAlerta({ tipo: 'error', mensaje: TEXTOS.reservaNoEncontrada })
    } else if (resultado.tipo !== RESULTADO.noAutorizado) {
      // 401: la sesión ya se cerró y el router lleva al login.
      setAlerta({
        tipo: 'error',
        mensaje: MENSAJE_POR_RESULTADO[resultado.tipo] ?? MENSAJES.errorServidor,
      })
    }
  }, [modal, ejecutando, pagina.detalle])

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
