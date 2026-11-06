import { useCallback, useRef, useState } from 'react'
import { useAvisos } from '../context/AvisosContext.jsx'
import { alertaDeResultado } from '../services/mensajesDeResultado.js'

/**
 * El estado "ejecutando / éxito / error" de cualquier acción contra la API, en un solo lugar. Lo usan los formularios
 * (guardar) y el detalle de reserva (aprobar, rechazar, cancelar).
 *  - `ejecutando`: la acción está en curso (el botón muestra la carga).
 *  - `alerta`: { tipo: 'error', mensaje } con lo que dejó la última acción. El éxito no queda en la pantalla: se muestra
 *    como aviso no bloqueante (toast) y la alerta queda en null; el error sigue en un AlertMessage donde ocurrió.
 *  - `ejecutar(llamar, opciones)`: corre la acción, ignora un segundo clic mientras dura y deja la alerta.
 *  - `iniciar()` / `terminar(alerta)`: para quien necesita más control (los formularios validan antes de empezar).
 * La guardia contra el doble envío es una referencia (síncrona): dos clics seguidos no esperan a que React vuelva a pintar.
 */
export function useAccion() {
  const [ejecutando, setEjecutando] = useState(false)
  const [alerta, setAlerta] = useState(null)
  const enCursoRef = useRef(false)
  const { avisar } = useAvisos()

  const enCurso = useCallback(() => enCursoRef.current, [])

  /** Empieza una acción. Devuelve false si ya hay una en curso. */
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
