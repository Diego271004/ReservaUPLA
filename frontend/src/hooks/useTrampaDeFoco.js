import { useCallback, useEffect, useRef } from 'react'

const FOCALIZABLES =
  'button:not([disabled]), [href], input, select, textarea, [tabindex]:not([tabindex="-1"])'

export function useTrampaDeFoco(abierto, panelRef, { alEscape, inicialRef } = {}) {
  const alEscapeRef = useRef(alEscape)
  useEffect(() => {
    alEscapeRef.current = alEscape
  })

  useEffect(() => {
    if (!abierto) return undefined
    const elementoPrevio = document.activeElement
    const primero = panelRef.current?.querySelector(FOCALIZABLES)
    ;(inicialRef?.current ?? primero)?.focus()
    // Escape también cuando el foco no llegó a entrar al panel (p. ej. aún se estaba mostrando): nunca queda atrapado.
    const alEscapar = (evento) => evento.key === 'Escape' && alEscapeRef.current?.()
    document.addEventListener('keydown', alEscapar)
    return () => {
      document.removeEventListener('keydown', alEscapar)
      elementoPrevio?.focus?.()
    }
  }, [abierto, panelRef, inicialRef])

  return useCallback(
    (evento) => {
      if (evento.key === 'Escape') {
        evento.stopPropagation()
        alEscape?.()
        return
      }
      if (evento.key !== 'Tab') return
      const elementos = [...panelRef.current.querySelectorAll(FOCALIZABLES)]
      const primero = elementos[0]
      const ultimo = elementos[elementos.length - 1]
      if (evento.shiftKey && document.activeElement === primero) {
        evento.preventDefault()
        ultimo.focus()
      } else if (!evento.shiftKey && document.activeElement === ultimo) {
        evento.preventDefault()
        primero.focus()
      }
    },
    [alEscape, panelRef],
  )
}
