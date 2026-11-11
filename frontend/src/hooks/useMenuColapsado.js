import { useCallback, useState } from 'react'

export const CLAVE_MENU_COLAPSADO = 'reservaupla.menu-colapsado'

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
    // Sin almacenamiento local la preferencia simplemente no se recuerda
  }
}

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
