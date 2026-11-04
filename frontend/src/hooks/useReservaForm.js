import { useCallback, useMemo, useState } from 'react'
import { TEXTOS } from '../constants/messages.js'
import { crearReserva, listarAmbientes } from '../services/recursosService.js'
import { HORAS, fechaAIso, horasPosterioresA, hoy } from '../utils/fechas.js'
import { validarReserva } from '../utils/validators.js'
import { useCarga } from './useCarga.js'
import { useFormulario } from './useFormulario.js'

const valoresIniciales = () => ({
  ambienteId: '',
  fecha: hoy(), // valor por defecto: escribe menos
  horaInicio: '',
  horaFin: '',
  motivo: '',
})

// Si cambia la hora de inicio y la de fin ya no es posterior, se vacía para que no quede un valor imposible.
function derivar(campo, valor, valores) {
  if (campo !== 'horaInicio' || valores.horaFin === '') return undefined
  return horasPosterioresA(valor).includes(valores.horaFin) ? undefined : { horaFin: '' }
}

export function etiquetaDeAmbiente(ambiente) {
  const base = `${ambiente.nombre} · ${ambiente.capacidad} ${TEXTOS.personas} · ${ambiente.ubicacion}`
  return ambiente.estado === 'Disponible'
    ? base
    : `${ambiente.nombre} · ${ambiente.estado} (no disponible)`
}

export function useReservaForm() {
  const ambientes = useCarga(listarAmbientes)
  const [reservaCreada, setReservaCreada] = useState(null)
  const [valoresPorDefecto] = useState(valoresIniciales)

  const opcionesAmbiente = useMemo(
    () =>
      ambientes.datos.map((ambiente) => ({
        valor: String(ambiente.id),
        etiqueta: etiquetaDeAmbiente(ambiente),
        // Prevención de errores: un ambiente que no está disponible no se puede elegir.
        deshabilitada: ambiente.estado !== 'Disponible',
      })),
    [ambientes.datos],
  )

  const enviar = useCallback(
    (valores, { signal }) =>
      crearReserva(
        {
          ambienteId: Number(valores.ambienteId),
          fecha: fechaAIso(valores.fecha),
          horaInicio: valores.horaInicio,
          horaFin: valores.horaFin,
          motivo: valores.motivo.trim(),
        },
        { signal },
      ),
    [],
  )

  const alExito = useCallback((reserva) => setReservaCreada(reserva), [])

  const formulario = useFormulario({
    valoresIniciales: valoresPorDefecto,
    validar: validarReserva,
    derivar,
    enviar,
    alExito,
  })

  const { reiniciar } = formulario
  const registrarOtra = useCallback(() => {
    setReservaCreada(null)
    reiniciar(valoresIniciales())
  }, [reiniciar])

  return {
    ...formulario,
    opcionesAmbiente,
    cargandoAmbientes: ambientes.cargando,
    errorAmbientes: ambientes.error,
    horasInicio: HORAS,
    horasFin: horasPosterioresA(formulario.valores.horaInicio),
    reservaCreada,
    registrarOtra,
    cancelar: () => formulario.reiniciar(valoresIniciales()),
  }
}
