import { TEXTOS } from '../constants/messages.js'

/** Pantallas que llegan en fases posteriores (Dashboard, Reservas, Mi ambiente). */
export default function PendientePage() {
  return (
    <>
      <h1>{TEXTOS.pantallaEnConstruccion}</h1>
      <p>{TEXTOS.textoEnConstruccion}</p>
    </>
  )
}
