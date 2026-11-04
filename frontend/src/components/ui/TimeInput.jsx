import SelectInput from './SelectInput.jsx'

/**
 * Hora como lista cerrada (hallazgo N1): solo ofrece las horas de `horas` (07:00 a 22:00 cada 30 minutos;
 * para la hora de fin, solo las posteriores al inicio). No se puede escribir una hora fuera de horario.
 */
export default function TimeInput({ horas, ...resto }) {
  return (
    <SelectInput
      {...resto}
      icono="reloj"
      opciones={horas.map((hora) => ({ valor: hora, etiqueta: hora }))}
    />
  )
}
