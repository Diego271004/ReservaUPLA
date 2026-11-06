import { iniciales } from '../../utils/personas.js'
import estilos from './Avatar.module.css'

/** Círculo con las iniciales de una persona (decorativo: el nombre siempre va al lado, escrito). */
export default function Avatar({ nombre }) {
  return (
    <span className={estilos.avatar} aria-hidden="true">
      {iniciales(nombre)}
    </span>
  )
}
