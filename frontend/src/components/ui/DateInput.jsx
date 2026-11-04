import { aplicarMascaraFecha } from '../../utils/fechas.js'
import { Icono } from './Icono.jsx'
import TextInput from './TextInput.jsx'
import estilos from './DateInput.module.css'

/**
 * Fecha en formato dd/mm/aaaa con icono de calendario. Mientras se escribe solo admite dígitos y pone
 * las barras sola: 05112026 → 05/11/2026. Avisa al formulario con el mismo evento que un TextInput.
 */
export default function DateInput({ onChange, nombre, ...resto }) {
  const alCambiar = (evento) =>
    onChange({
      target: { name: nombre, value: aplicarMascaraFecha(evento.target.value), type: 'text' },
    })

  return (
    <TextInput
      {...resto}
      nombre={nombre}
      onChange={alCambiar}
      inputMode="numeric"
      maxLength={10}
      autoComplete="off"
      accion={<Icono nombre="calendario" className={estilos.icono} />}
    />
  )
}
