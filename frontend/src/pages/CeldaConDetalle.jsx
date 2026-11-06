import estilos from './CeldaConDetalle.module.css'

/** Una celda de tabla con el dato principal y debajo, más pequeño, su detalle (el nombre de un ambiente y su tipo). */
export default function CeldaConDetalle({ principal, detalle }) {
  return (
    <span className={estilos.celda}>
      <span className={estilos.principal}>{principal}</span>
      {detalle && <span className={estilos.detalle}>{detalle}</span>}
    </span>
  )
}
