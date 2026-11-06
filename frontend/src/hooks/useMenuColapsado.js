import { useCallback, useState } from 'react'

export const CLAVE_MENU_COLAPSADO = 'reservaupla.menu-colapsado'

// localStorage puede estar bloqueado (ventana privada, datos del sitio desactivados): sin él, el menú funciona igual pero no recuerda.
const leer = () => {
  try {
    return localStorage.getItem(CLAVE_MENU_COLAPSADO) === '1'
  } catch {
    return false
  }
}
const guardar = (colapsado) => {
  try {
    localStorage.setItem(CLAVE_MENU_COLAPSADO, colapsado ? '1' : '0')
  } catch {
    // sin almacenamiento: la preferencia solo vale mientras dure la pestaña
  }
}

/** Si el menú lateral de escritorio está contraído (solo iconos). La preferencia se recuerda entre visitas. */
export function useMenuColapsado() {
  const [colapsado, setColapsado] = useState(leer)
  const alternar = useCallback(() => {
    setColapsado((actual) => {
      guardar(!actual)
      return !actual
    })
  }, [])
  return [colapsado, alternar]
}
