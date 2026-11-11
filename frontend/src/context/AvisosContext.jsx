import { createContext, useCallback, useContext, useMemo, useState } from 'react'
import ZonaDeAvisos from '../components/Avisos/ZonaDeAvisos.jsx'

// Sin proveedor (una pantalla probada sola) avisar no hace nada: nunca rompe.
const AvisosContext = createContext({ avisar: () => {} })

let siguienteId = 0

export function AvisosProvider({ children }) {
  const [avisos, setAvisos] = useState([])

  const avisar = useCallback((mensaje, tipo = 'exito') => {
    siguienteId += 1
    setAvisos((actuales) => [...actuales, { id: siguienteId, mensaje, tipo }])
  }, [])
  const cerrar = useCallback(
    (id) => setAvisos((actuales) => actuales.filter((aviso) => aviso.id !== id)),
    [],
  )

  const valor = useMemo(() => ({ avisar }), [avisar])
  return (
    <AvisosContext.Provider value={valor}>
      {children}
      <ZonaDeAvisos avisos={avisos} alCerrar={cerrar} />
    </AvisosContext.Provider>
  )
}

export const useAvisos = () => useContext(AvisosContext)
