import { Icono } from '../ui/Icono.jsx'
import estilos from './BarraResumenMovil.module.css'

/**
 * Barra de resumen compacta para pantallas estrechas / móvil (ISO 9241-11, Nielsen 6).
 * Se ubica justo sobre el botón «Registrar solicitud» para que el usuario no tenga que
 * desplazarse hasta el final del formulario para confirmar qué está solicitando.
 */
export default function BarraResumenMovil({ ambiente, fecha, horaInicio, horaFin }) {
  const nombreAmbiente = ambiente?.nombre || 'Sin ambiente'
  const fechaTexto = fecha || 'Sin fecha'
  const horarioTexto = horaInicio && horaFin ? `${horaInicio} – ${horaFin}` : 'Sin horario'

  return (
    <div
      className={estilos.barra}
      role="region"
      aria-label="Resumen rápido de la solicitud"
      aria-live="polite"
    >
      <div className={estilos.contenido}>
        <Icono nombre="calendario" tamano={16} className={estilos.icono} />
        <span className={estilos.texto}>
          <strong className={estilos.segmento}>{nombreAmbiente}</strong>
          <span className={estilos.separador} aria-hidden="true">
            ·
          </span>
          <span className={estilos.segmento}>{fechaTexto}</span>
          <span className={estilos.separador} aria-hidden="true">
            ·
          </span>
          <span className={estilos.segmento}>{horarioTexto}</span>
        </span>
      </div>
    </div>
  )
}
