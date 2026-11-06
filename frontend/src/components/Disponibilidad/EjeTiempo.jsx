import estilos from './EjeTiempo.module.css'
import { leftPorCentaje } from '../../utils/disponibilidad.js'

export default function EjeTiempo({ ahora, hoy = false, compacto = false }) {
  const horas = compacto ? [7, 9, 11, 13, 15, 17, 19, 21] : [7, 9, 11, 13, 15, 17, 19, 21]
  const horaAhora = ahora ? ahora.getHours() + ahora.getMinutes() / 60 : null
  const mostrarAhora = hoy && horaAhora >= 7 && horaAhora <= 22
  const minutoAhora = ahora ? String(ahora.getMinutes()).padStart(2, '0') : '00'
  const etiquetaAhora = mostrarAhora
    ? `Ahora ${String(ahora.getHours()).padStart(2, '0')}:${minutoAhora}`
    : null
  const cercaDeEtiqueta = mostrarAhora && horas.some((hora) => Math.abs(hora - horaAhora) < 0.75)

  return (
    <div className={estilos.contenedor} aria-label="Eje de horas">
      <div className={estilos.eje}>
        {horas.map((hora) => (
          <span
            key={hora}
            style={{ left: leftPorCentaje(`${String(hora).padStart(2, '0')}:00`) }}
            className={
              cercaDeEtiqueta && Math.abs(hora - horaAhora) < 0.75 ? estilos.etiquetaOculta : ''
            }
          >
            {`${String(hora).padStart(2, '0')}:00`}
          </span>
        ))}
      </div>
      {mostrarAhora && (
        <div className={estilos.carrilAhora}>
          <span
            aria-label={etiquetaAhora}
            style={{
              left: `clamp(2.75rem, ${leftPorCentaje(`${String(ahora.getHours()).padStart(2, '0')}:${minutoAhora}`)}, calc(100% - 2.75rem))`,
            }}
          >
            {etiquetaAhora}
          </span>
        </div>
      )}
    </div>
  )
}
