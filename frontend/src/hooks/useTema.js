import { useCallback, useState } from 'react'

export const CLAVE_TEMA = 'reservaupla.tema'
export const TEMAS = Object.freeze({ claro: 'claro', oscuro: 'oscuro' })

const temaActual = () =>
  document.documentElement.dataset.tema === TEMAS.oscuro ? TEMAS.oscuro : TEMAS.claro

const guardar = (tema) => {
  try {
    localStorage.setItem(CLAVE_TEMA, tema)
  } catch {
    // Sin almacenamiento local la preferencia simplemente no se recuerda
  }
}

export function useTema() {
  const [tema, setTema] = useState(temaActual)

  const alternar = useCallback(() => {
    const nuevo = temaActual() === TEMAS.oscuro ? TEMAS.claro : TEMAS.oscuro
    document.documentElement.dataset.tema = nuevo
    guardar(nuevo)
    setTema(nuevo)
  }, [])

  return [tema, alternar]
}
