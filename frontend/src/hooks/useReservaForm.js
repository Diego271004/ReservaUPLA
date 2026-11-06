import { useCallback, useMemo, useState } from 'react'
import { TEXTOS } from '../constants/messages.js'
import { crearReserva, listarAmbientes } from '../services/recursosService.js'
import { HORAS, fechaAIso, horasPosterioresA, hoy, isoAFecha } from '../utils/fechas.js'
import { validarReserva } from '../utils/validators.js'
import { useCarga } from './useCarga.js'
import { useDisponibilidad } from './useDisponibilidad.js'
import { useFormulario } from './useFormulario.js'
import { useSearchParams } from 'react-router-dom'

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
  return ambiente.estado === 'Disponible'
    ? ambiente.nombre
    : `${ambiente.nombre} · ${ambiente.estado} (no disponible)`
}

/** Detalle del ambiente elegido, como ayuda bajo el campo: "30 personas · Pabellón A, piso 2". */
export function detalleDeAmbiente(ambiente) {
  return `${ambiente.capacidad} ${TEXTOS.personas} · ${ambiente.ubicacion}`
}

export function useReservaForm() {
  const [parametros] = useSearchParams()
  const ambientes = useCarga(listarAmbientes)
  const [reservaCreada, setReservaCreada] = useState(null)
  const [valoresPorDefecto] = useState(() => {
    const ambienteId = parametros.get('ambienteId') ?? ''
    const fechaIso = parametros.get('fecha') ?? ''
    const horaInicio = parametros.get('horaInicio') ?? ''
    const horaFinParam = parametros.get('horaFin') ?? ''
    const horaFin = horaFinParam || (horaInicio ? (horasPosterioresA(horaInicio)[0] ?? '') : '')
    return {
      ...valoresIniciales(),
      ambienteId,
      fecha: fechaIso
        ? fechaIso.includes('/')
          ? fechaIso
          : (isoAFecha(fechaIso) ?? valoresIniciales().fecha)
        : valoresIniciales().fecha,
      horaInicio,
      horaFin,
    }
  })

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

  const ayudaAmbiente = useMemo(() => {
    const elegido = ambientes.datos.find(
      (ambiente) => String(ambiente.id) === formulario.valores.ambienteId,
    )
    return elegido ? detalleDeAmbiente(elegido) : undefined
  }, [ambientes.datos, formulario.valores.ambienteId])

  const ambienteElegido = useMemo(() => {
    const elegido = ambientes.datos.find(
      (ambiente) => String(ambiente.id) === formulario.valores.ambienteId,
    )
    return elegido ? { nombre: elegido.nombre, detalle: detalleDeAmbiente(elegido) } : null
  }, [ambientes.datos, formulario.valores.ambienteId])

  const disponibilidad = useDisponibilidad(formulario.valores, reservaCreada === null)
  const { setValores, reiniciar } = formulario
  const seleccionarFranja = useCallback(
    (horaInicio, horaFin) => {
      setValores((actuales) => ({
        ...actuales,
        horaInicio,
        horaFin,
      }))
    },
    [setValores],
  )

  const registrarOtra = useCallback(() => {
    setReservaCreada(null)
    reiniciar(valoresIniciales())
  }, [reiniciar])

  return {
    ...formulario,
    ambientes: ambientes.datos,
    opcionesAmbiente,
    ayudaAmbiente,
    ambienteElegido,
    cargandoAmbientes: ambientes.cargando,
    errorAmbientes: ambientes.error,
    horasInicio: HORAS,
    horasFin: horasPosterioresA(formulario.valores.horaInicio),
    disponibilidad,
    seleccionarFranja,
    reservaCreada,
    registrarOtra,
    cancelar: () => formulario.reiniciar(valoresIniciales()),
  }
}
