import { useEffect, useRef, useState } from 'react'
import { TEXTOS } from '../../constants/messages.js'
import Button from '../ui/Button.jsx'
import { Icono } from '../ui/Icono.jsx'
import estilos from './Aviso.module.css'

export const DURACION_AVISO_MS = 6000
const ICONO_POR_TIPO = { exito: 'exito', info: 'info', aviso: 'aviso' }

/**
 * Un aviso: icono + texto + «Cerrar aviso». Se cierra solo a los 6 s; el tiempo se detiene mientras el puntero o el foco
 * están encima (quien lo lee con calma o con teclado no lo pierde) y, al soltarlo, sigue con lo que le quedaba.
 */
export default function Aviso({ mensaje, tipo, alCerrar }) {
  const [pausado, setPausado] = useState(false)
  const restanteRef = useRef(DURACION_AVISO_MS)
  const alCerrarRef = useRef(alCerrar)
  useEffect(() => {
    alCerrarRef.current = alCerrar
  })

  useEffect(() => {
    if (pausado) return undefined
    const inicio = Date.now()
    const temporizador = setTimeout(() => alCerrarRef.current(), restanteRef.current)
    return () => {
      clearTimeout(temporizador)
      restanteRef.current = Math.max(0, restanteRef.current - (Date.now() - inicio))
    }
  }, [pausado])

  return (
    <div
      role="status"
      className={`${estilos.tarjeta} ${estilos[tipo]}`}
      onMouseEnter={() => setPausado(true)}
      onMouseLeave={() => setPausado(false)}
      onFocus={() => setPausado(true)}
      onBlur={(evento) => {
        if (!evento.currentTarget.contains(evento.relatedTarget)) setPausado(false)
      }}
      onKeyDown={(evento) => {
        if (evento.key === 'Escape') alCerrar()
      }}
    >
      <Icono nombre={ICONO_POR_TIPO[tipo]} className={estilos.icono} tamano={20} />
      <span className={estilos.mensaje}>{mensaje}</span>
      <Button variante="icono" aria-label={TEXTOS.cerrarAviso} onClick={alCerrar}>
        <Icono nombre="equis" />
      </Button>
    </div>
  )
}
