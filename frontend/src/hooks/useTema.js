import { useCallback, useState } from 'react'

export const CLAVE_TEMA = 'reservaupla.tema'
export const TEMAS = Object.freeze({ claro: 'claro', oscuro: 'oscuro' })

/** El tema que ya puso el script de index.html en <html> antes de pintar (claro por omisión). */
const temaActual = () =>
  document.documentElement.dataset.tema === TEMAS.oscuro ? TEMAS.oscuro : TEMAS.claro

const guardar = (tema) => {
  try {
    localStorage.setItem(CLAVE_TEMA, tema)
  } catch {
    // sin almacenamiento (ventana privada): el tema solo vale mientras dure la pestaña
  }
}

/**
 * El tema de colores (claro u oscuro). Se aplica con data-tema en <html>, que es lo que leen los tokens, y se recuerda entre visitas.
 * Sin elección guardada el sistema es claro; index.html lo pone antes de pintar para que no haya un parpadeo.
 */
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
