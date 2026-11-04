import { TEXTOS } from '../../constants/messages.js'
import estilos from './InterruptorActivo.module.css'

/**
 * Interruptor "Activo" junto a su etiqueta, con el texto "Activo" / "Inactivo" al lado (el estado nunca
 * depende solo del color). Es un checkbox con role="switch": se opera con Espacio.
 */
export default function InterruptorActivo({
  id,
  nombre,
  etiqueta,
  activo,
  onChange,
  deshabilitado = false,
}) {
  return (
    <div className={estilos.grupo}>
      <label htmlFor={id} className={estilos.etiqueta}>
        {etiqueta}
      </label>
      <input
        id={id}
        name={nombre}
        type="checkbox"
        role="switch"
        className={estilos.interruptor}
        checked={activo}
        onChange={onChange}
        disabled={deshabilitado}
      />
      <span className={estilos.texto} aria-hidden="true">
        {activo ? TEXTOS.activo : TEXTOS.inactivo}
      </span>
    </div>
  )
}
