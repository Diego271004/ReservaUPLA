import { useEffect, useRef } from 'react'

export function useParalaje() {
  const ref = useRef(null)

  useEffect(() => {
    const elemento = ref.current
    if (!elemento) return undefined
    const sinMovimiento = window.matchMedia?.('(prefers-reduced-motion: reduce)')?.matches
    const tactil = window.matchMedia?.('(pointer: coarse)')?.matches
    if (sinMovimiento || tactil) return undefined

    let cuadro = 0
    const mover = (evento) => {
      cancelAnimationFrame(cuadro)
      cuadro = requestAnimationFrame(() => {
        const caja = elemento.getBoundingClientRect()
        if (!caja.width || !caja.height) return
        const x = ((evento.clientX - caja.left) / caja.width) * 2 - 1
        const y = ((evento.clientY - caja.top) / caja.height) * 2 - 1
        elemento.style.setProperty('--mx', x.toFixed(3))
        elemento.style.setProperty('--my', y.toFixed(3))
      })
    }
    const centrar = () => {
      cancelAnimationFrame(cuadro)
      elemento.style.setProperty('--mx', '0')
      elemento.style.setProperty('--my', '0')
    }

    elemento.addEventListener('pointermove', mover)
    elemento.addEventListener('pointerleave', centrar)
    return () => {
      cancelAnimationFrame(cuadro)
      elemento.removeEventListener('pointermove', mover)
      elemento.removeEventListener('pointerleave', centrar)
    }
  }, [])

  return ref
}
