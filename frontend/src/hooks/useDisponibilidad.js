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

/**
 * Aviso inmediato de disponibilidad (pantallas 04 y 04e): cuando ya están el ambiente, la fecha y las dos horas
 * (y son válidos) consulta al servidor, con una pequeña espera para no preguntar en cada tecla.
 * Devuelve null (sin aviso), { estado: 'consultando' } o { estado: 'disponible' | 'ocupado', mensaje }.
 * Si la consulta falla no hay aviso: registrar sigue permitido y el servidor decide.
 */
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
