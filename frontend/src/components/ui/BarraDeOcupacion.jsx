import estilos from './BarraDeOcupacion.module.css'

/**
 * Barra de ocupación de un ambiente en el día: el porcentaje en número y la barra. `porcentaje` null = no aplica
 * («—», por ejemplo un ambiente en mantenimiento). La barra es decorativa: el número es lo que se lee.
 */
export default function BarraDeOcupacion({ porcentaje, etiqueta }) {
  if (porcentaje === null || porcentaje === undefined) return <span>—</span>
  return (
    <span className={estilos.contenedor} role="img" aria-label={`${etiqueta}: ${porcentaje} %`}>
      <span className={estilos.pista} aria-hidden="true">
        <span className={estilos.relleno} style={{ width: `${porcentaje}%` }} />
      </span>
      <span aria-hidden="true" className={estilos.numero}>
        {porcentaje} %
      </span>
    </span>
  )
}
