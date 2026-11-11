import { useCallback, useEffect, useState } from 'react'
import { MENSAJES, TEXTOS } from '../constants/messages.js'
import { usePendientes } from '../context/PendientesContext.jsx'
import { RESULTADO } from '../services/llamarApi.js'
import { mensajeDeError } from '../services/mensajesDeResultado.js'
import { obtenerDisponibilidadDia, obtenerReserva } from '../services/recursosService.js'
import { minutosDeHora } from '../utils/fechas.js'
import { ACCIONES } from './accionesDeReserva.js'
import { useAccion } from './useAccion.js'

export const ESTADOS_PAGINA = Object.freeze({
  cargando: 'cargando',
  listo: 'listo',
  noEncontrado: 'noEncontrado',
  error: 'error',
})

export function useDetalleReserva(id) {
  const [pagina, setPagina] = useState({
    estado: ESTADOS_PAGINA.cargando,
    detalle: null,
    error: null,
    conflicto: null,
  })
  const [modal, setModal] = useState(null) // 'aprobar' | 'rechazar' | 'cancelar' | null
  const { ejecutando, alerta, ejecutar } = useAccion()
  const { refrescar: refrescarPendientes } = usePendientes()

  const cargar = useCallback(async () => {
    setPagina({ estado: ESTADOS_PAGINA.cargando, detalle: null, error: null, conflicto: null })
    const resultado = await obtenerReserva(id)
    if (resultado.tipo === RESULTADO.exito) {
      let conflicto = null
      const res = resultado.data.reserva
      if (res && res.estado === 'Pendiente') {
        try {
          const disp = await obtenerDisponibilidadDia(res.fecha)
          if (disp && disp.tipo === RESULTADO.exito && disp.data?.ambientes) {
            const ambiente = disp.data.ambientes.find(
              (a) => Number(a.id) === Number(res.ambienteId),
            )
            const inicio = minutosDeHora(res.horaInicio)
            const fin = minutosDeHora(res.horaFin)
            const choque = ambiente?.bloques?.find(
              (b) =>
                b.estado === 'Aprobada' &&
                Number(b.id) !== Number(res.id) &&
                minutosDeHora(b.horaInicio) < fin &&
                minutosDeHora(b.horaFin) > inicio,
            )
            if (choque) {
              conflicto = { id: choque.id, horaInicio: choque.horaInicio, horaFin: choque.horaFin }
            }
          }
        } catch {
          // Si falla la consulta de disponibilidad, no interrumpe la carga del detalle
        }
      }
      setPagina({ estado: ESTADOS_PAGINA.listo, detalle: resultado.data, error: null, conflicto })
    } else if (resultado.tipo === RESULTADO.noEncontrado) {
      setPagina({
        estado: ESTADOS_PAGINA.noEncontrado,
        detalle: null,
        error: null,
        conflicto: null,
      })
    } else {
      const error = mensajeDeError(resultado) ?? MENSAJES.errorServidor
      setPagina({ estado: ESTADOS_PAGINA.error, detalle: null, error, conflicto: null })
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
      refrescarPendientes() // el contador del menú (aprobar, rechazar y cancelar cambian los pendientes)
    }
  }, [modal, ejecutar, pagina.detalle, refrescarPendientes])

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
