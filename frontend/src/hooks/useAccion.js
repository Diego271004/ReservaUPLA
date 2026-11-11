import { useCallback, useRef, useState } from 'react'
import { useAvisos } from '../context/AvisosContext.jsx'
import { alertaDeResultado } from '../services/mensajesDeResultado.js'

export function useAccion() {
  const [ejecutando, setEjecutando] = useState(false)
  const [alerta, setAlerta] = useState(null)
  const enCursoRef = useRef(false)
  const { avisar } = useAvisos()

  const enCurso = useCallback(() => enCursoRef.current, [])

  const iniciar = useCallback(() => {
    if (enCursoRef.current) return false
    enCursoRef.current = true
    setEjecutando(true)
    setAlerta(null)
    return true
  }, [])

  const terminar = useCallback(
    (alertaFinal = null) => {
      enCursoRef.current = false
      setEjecutando(false)
      if (alertaFinal?.tipo === 'exito') {
        avisar(alertaFinal.mensaje)
        setAlerta(null)
      } else {
        setAlerta(alertaFinal)
      }
    },
    [avisar],
  )

  const ejecutar = useCallback(
    async (llamar, opciones) => {
      if (!iniciar()) return null
      const resultado = await llamar()
      terminar(alertaDeResultado(resultado, opciones))
      return resultado
    },
    [iniciar, terminar],
  )

  return { ejecutando, alerta, setAlerta, enCurso, iniciar, terminar, ejecutar }
}
