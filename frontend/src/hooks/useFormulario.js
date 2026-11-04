import { useCallback, useEffect, useLayoutEffect, useMemo, useRef, useState } from 'react'
import { MENSAJES } from '../constants/messages.js'
import { RESULTADO } from '../services/llamarApi.js'
import { alertaDeResultado } from '../services/mensajesDeResultado.js'
import { tieneErrores } from '../utils/validators.js'
import { useAccion } from './useAccion.js'

/**
 * Comportamiento común de todos los formularios (lo que se repite vive aquí, no en cada hook):
 * valores, errores visibles, validación al salir del campo y al enviar, foco en el primer error,
 * guardia contra doble envío, cancelación y traducción de los resultados de la API.
 * Sin JSX: los componentes solo pintan lo que devuelve.
 *
 * Configuración:
 *  - valoresIniciales: valores de cada campo (cadenas, salvo interruptores).
 *  - validar(valores): { campo: mensaje|null } para todos los campos.
 *  - derivar(campo, valor, valores): cambios adicionales a otros campos cuando uno cambia (opcional).
 *  - enviar(valores, { signal }): promesa con un resultado de llamarApi.
 *  - alExito(datos, valores): qué hacer cuando la API acepta los datos.
 *  - manejarResultado(resultado, contexto): resultados propios de un formulario (devuelve true si lo atendió).
 */
export function useFormulario({
  valoresIniciales,
  validar,
  derivar,
  enviar,
  alExito,
  manejarResultado,
}) {
  const [valores, setValores] = useState(valoresIniciales)
  const [errores, setErrores] = useState({})
  // Estado ejecutando / alerta compartido con el resto de acciones de la aplicación.
  const { ejecutando: enviando, alerta, setAlerta, enCurso, iniciar, terminar } = useAccion()
  const [solicitudFoco, setSolicitudFoco] = useState(null)

  const refs = useRef({})
  const montadoRef = useRef(false)
  const controladorRef = useRef(null)
  const valoresRef = useRef(valores)
  useLayoutEffect(() => {
    valoresRef.current = valores
  }, [valores])

  useEffect(() => {
    montadoRef.current = true
    return () => {
      montadoRef.current = false
      controladorRef.current?.abort()
    }
  }, [])

  // El foco se mueve después del render, cuando los errores ya están en el DOM.
  useEffect(() => {
    if (solicitudFoco) refs.current[solicitudFoco.campo]?.focus()
  }, [solicitudFoco])

  const enfocar = useCallback((campo) => {
    setSolicitudFoco((previa) => ({ campo, id: (previa?.id ?? 0) + 1 }))
  }, [])

  /** Ref callback para registrar el elemento de un campo y poder enfocarlo. */
  const refDe = useCallback(
    (campo) => (elemento) => {
      refs.current[campo] = elemento
    },
    [],
  )

  const campoConError = (erroresActuales) =>
    Object.keys(valoresRef.current).find((campo) => erroresActuales[campo])

  const handleChange = useCallback(
    (evento) => {
      const { name, value, type, checked } = evento.target
      const nuevoValor = type === 'checkbox' ? checked : value
      const siguientes = {
        ...valoresRef.current,
        [name]: nuevoValor,
        ...derivar?.(name, nuevoValor, valoresRef.current),
      }
      valoresRef.current = siguientes
      setValores(siguientes)
      // Un error ya visible se actualiza (o desaparece) apenas se corrige; uno nuevo aparece al salir del campo o al enviar.
      setErrores((previos) => {
        const actualizados = { ...previos }
        const nuevosErrores = validar(siguientes)
        for (const campo of Object.keys(previos)) {
          if (previos[campo]) actualizados[campo] = nuevosErrores[campo] ?? null
        }
        return actualizados
      })
    },
    [derivar, validar],
  )

  const handleBlur = useCallback(
    (evento) => {
      const { name } = evento.target
      if (enCurso()) return
      setErrores((previos) => ({ ...previos, [name]: validar(valoresRef.current)[name] ?? null }))
    },
    [enCurso, validar],
  )

  const aplicarResultado = useCallback(
    (resultado, valoresEnviados) => {
      const contexto = { setAlerta, setValores, setErrores, enfocar, terminar }
      if (manejarResultado?.(resultado, contexto)) return

      switch (resultado.tipo) {
        case RESULTADO.exito:
          setAlerta(null)
          alExito?.(resultado.data, valoresEnviados)
          terminar()
          return
        case RESULTADO.datosInvalidos: {
          terminar()
          const erroresServidor = Object.fromEntries(
            Object.entries(resultado.errores).filter(([campo]) => campo in valoresRef.current),
          )
          setErrores(erroresServidor)
          const primero = campoConError(erroresServidor)
          if (primero) enfocar(primero)
          else setAlerta({ tipo: 'error', mensaje: MENSAJES.errorServidor })
          return
        }
        default:
          // 403, 409, 429, 5xx y sin red: un solo lugar los traduce a su mensaje (mensajesDeResultado.js).
          terminar(alertaDeResultado(resultado))
      }
    },
    [alExito, enfocar, manejarResultado, setAlerta, terminar],
  )

  const handleSubmit = useCallback(
    async (evento) => {
      evento?.preventDefault()
      if (enCurso()) return

      const actuales = valoresRef.current
      const erroresFormulario = validar(actuales)
      setErrores(erroresFormulario)
      if (tieneErrores(erroresFormulario)) {
        setAlerta(null)
        enfocar(campoConError(erroresFormulario))
        return // no se envía con errores
      }

      if (!iniciar()) return
      controladorRef.current = new AbortController()

      const resultado = await enviar(actuales, { signal: controladorRef.current.signal })
      if (!montadoRef.current) return
      aplicarResultado(resultado, actuales)
    },
    [aplicarResultado, enCurso, enviar, enfocar, iniciar, setAlerta, validar],
  )

  const cancelarEnvio = useCallback(() => controladorRef.current?.abort(), [])

  const reiniciar = useCallback(
    (nuevosValores = valoresIniciales) => {
      setValores(nuevosValores)
      setErrores({})
      setAlerta(null)
    },
    [setAlerta, valoresIniciales],
  )

  // Las props que todo campo del formulario necesita (id, valor, error, eventos y foco). Los componentes de campo las
  // reciben tal cual: ninguna pantalla vuelve a escribir esta lista. Texto y fecha se bloquean como "solo lectura" durante
  // el envío (conservan el foco); las listas, como deshabilitadas.
  const propsDeCampo = useCallback(
    (nombre) => ({
      id: nombre,
      nombre,
      valor: valores[nombre],
      error: errores[nombre],
      onChange: handleChange,
      onBlur: handleBlur,
      inputRef: refDe(nombre),
    }),
    [errores, handleBlur, handleChange, refDe, valores],
  )
  const campoDeTexto = useCallback(
    (nombre) => ({ ...propsDeCampo(nombre), soloLectura: enviando }),
    [enviando, propsDeCampo],
  )
  const campoDeLista = useCallback(
    (nombre) => ({ ...propsDeCampo(nombre), deshabilitado: enviando }),
    [enviando, propsDeCampo],
  )

  return useMemo(
    () => ({
      valores,
      errores,
      enviando,
      alerta,
      setAlerta,
      setValores,
      refDe,
      enfocar,
      handleChange,
      handleBlur,
      handleSubmit,
      cancelarEnvio,
      reiniciar,
      campoDeTexto,
      campoDeLista,
    }),
    [
      valores,
      errores,
      enviando,
      alerta,
      setAlerta,
      refDe,
      enfocar,
      handleChange,
      handleBlur,
      handleSubmit,
      cancelarEnvio,
      reiniciar,
      campoDeTexto,
      campoDeLista,
    ],
  )
}
