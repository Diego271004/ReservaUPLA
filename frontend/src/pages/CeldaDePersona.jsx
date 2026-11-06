import Avatar from '../components/ui/Avatar.jsx'
import estilos from './CeldaDePersona.module.css'

/** La celda de una persona en una tabla: avatar con iniciales y el nombre escrito. */
export default function CeldaDePersona({ nombre }) {
  return (
    <span className={estilos.persona}>
      <Avatar nombre={nombre} />
      {nombre}
    </span>
  )
}
