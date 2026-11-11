import { useEffect, useState } from 'react'
import { RESULTADO } from '../services/llamarApi.js'
import { consultarDisponibilidad } from '../services/recursosService.js'
import { fechaAIso } from '../utils/fechas.js'
import {
  validarAmbienteId,
  validarFecha,
  validarHoraFin,
  validarHoraInicio,
} from '../utils/validators.js'

export const ESTADOS_DISPONIBILIDAD = Object.freeze({
  consultando: 'consultando',
  disponible: 'disponible',
  ocupado: 'ocupado',
})

const ESPERA_MS = 300

export function useDisponibilidad({ ambienteId, fecha, horaInicio, horaFin }, activo = true) {
  const [respuesta, setRespuesta] = useState(null) // { clave, aviso }

  const completo =
    activo &&
    validarAmbienteId(ambienteId) === null &&
    validarFecha(fecha) === null &&
    validarHoraInicio(horaInicio) === null &&
    validarHoraFin(horaFin, horaInicio) === null
  const clave = completo ? [ambienteId, fecha, horaInicio, horaFin].join('|') : null

  useEffect(() => {
    if (!clave) return undefined
    let vigente = true
    const temporizador = setTimeout(async () => {
      const resultado = await consultarDisponibilidad({
        ambienteId: Number(ambienteId),
        fecha: fechaAIso(fecha),
        horaInicio,
        horaFin,
      })
      if (!vigente) return
      if (resultado?.tipo === RESULTADO.exito) {
        const { disponible, mensaje } = resultado.data
        setRespuesta({
          clave,
          aviso: {
            estado: disponible ? ESTADOS_DISPONIBILIDAD.disponible : ESTADOS_DISPONIBILIDAD.ocupado,
            mensaje,
          },
        })
      } else {
        setRespuesta({ clave, aviso: null })
      }
    }, ESPERA_MS)
    return () => {
      vigente = false
      clearTimeout(temporizador)
    }
  }, [clave, ambienteId, fecha, horaInicio, horaFin])

  if (!clave) return null
  return respuesta?.clave === clave
    ? respuesta.aviso
    : { estado: ESTADOS_DISPONIBILIDAD.consultando }
}
