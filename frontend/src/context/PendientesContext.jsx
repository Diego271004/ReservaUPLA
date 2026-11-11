import { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react'
import { RESULTADO } from '../services/llamarApi.js'
import { obtenerDashboard } from '../services/recursosService.js'

const SIN_PROVEEDOR = Object.freeze({ pendientes: 0, refrescar: () => {} })
const PendientesContext = createContext(SIN_PROVEEDOR)

export function PendientesProvider({ activo, children }) {
  const [pendientes, setPendientes] = useState(0)

  const refrescar = useCallback(async () => {
    if (!activo) return
    const resultado = await obtenerDashboard()
    if (resultado?.tipo === RESULTADO.exito) {
      setPendientes(resultado.data?.indicadores?.pendientes ?? 0)
    }
  }, [activo])

  useEffect(() => {
    // Lectura inicial: el estado cambia cuando responde la API.
    // eslint-disable-next-line react-hooks/set-state-in-effect
    refrescar()
  }, [refrescar])

  const valor = useMemo(() => ({ pendientes, refrescar }), [pendientes, refrescar])
  return <PendientesContext.Provider value={valor}>{children}</PendientesContext.Provider>
}

export const usePendientes = () => useContext(PendientesContext)
