import estilos from './CardIndicador.module.css'

/**
 * Tarjeta de indicador: el número va siempre en la misma posición, la descripción puede partirse en dos líneas
 * (hallazgo del CardIndicador) y las tarjetas de una fila tienen el mismo alto.
 */
export default function CardIndicador({ valor, descripcion, detalle }) {
  return (
    <article className={estilos.tarjeta}>
      <p className={`${estilos.valor} ${typeof valor === 'number' ? '' : estilos.valorTexto}`}>
        {valor}
      </p>
      <p className={estilos.descripcion}>{descripcion}</p>
      {detalle && <p className={estilos.detalle}>{detalle}</p>}
    </article>
  )
}
