import { MENSAJES } from '../constants/messages'

export default function PendientePage() {
  return (
    <>
      <h1>{MENSAJES.pendiente.titulo}</h1>
      <p>{MENSAJES.pendiente.texto}</p>
    </>
  )
}
