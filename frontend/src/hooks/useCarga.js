import { useCallback, useEffect, useState } from 'react'
import { MENSAJES } from '../constants/messages.js'
import { RESULTADO } from '../services/llamarApi.js'
import { mensajeDeError } from '../services/mensajesDeResultado.js'

/**
 * Carga una lista al abrir la pantalla. Devuelve { datos, cargando, error, recargar }.
 * `cargar` debe ser una función estable (definida fuera del componente o con useCallback). `inicial` es lo que se
 * devuelve mientras carga o si falla: una lista vacía por omisión; una constante definida fuera del componente si no es una lista.
 */
const LISTA_VACIA = Object.freeze([])

export function useCarga(cargar, inicial = LISTA_VACIA) {
  const [estado, setEstado] = useState({ datos: inicial, cargando: true, error: null })

  const ejecutar = useCallback(async () => {
    setEstado((previo) => ({ ...previo, cargando: true, error: null }))
    const resultado = await cargar()
    if (resultado.tipo === RESULTADO.exito) {
      setEstado({ datos: resultado.data ?? inicial, cargando: false, error: null })
    } else {
      const error = mensajeDeError(resultado) ?? MENSAJES.errorServidor
      setEstado({ datos: inicial, cargando: false, error })
    }
  }, [cargar, inicial])

  useEffect(() => {
    // Carga inicial al montar: la actualización de estado ocurre cuando responde la API.
    // eslint-disable-next-line react-hooks/set-state-in-effect
    ejecutar()
  }, [ejecutar])

  return { ...estado, recargar: ejecutar }
}
