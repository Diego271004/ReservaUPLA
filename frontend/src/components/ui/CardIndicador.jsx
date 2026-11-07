import { Link } from 'react-router-dom'
import { Icono } from './Icono.jsx'
import estilos from './CardIndicador.module.css'

/**
 * Tarjeta de indicador: una ficha con el icono del estado en un recuadro tintado, el número grande (en cifras de igual
 * ancho para que se alineen), la descripción y, si lleva enlace, una flecha que invita a abrir la lista. El tono (info,
 * aviso, exito, error) repite el color del estado, pero el icono y el texto dicen lo mismo: nunca solo color. Las tarjetas
 * de una fila tienen el mismo alto. Con `ancha` ocupa toda la fila (el ambiente más utilizado, un dato de texto largo).
 */
export default function CardIndicador({
  valor,
  descripcion,
  detalle,
  href,
  icono,
  tono = 'info',
  ancha = false,
  chips = null,
}) {
  const contenido = (
    <>
      <div className={estilos.superior}>
        {icono && (
          <span className={`${estilos.icono} ${estilos[tono]}`} aria-hidden="true">
            <Icono nombre={icono} />
          </span>
        )}
        {href && (
          <span className={estilos.flecha} aria-hidden="true">
            <Icono nombre="flechaDerecha" />
          </span>
        )}
      </div>
      {ancha && <p className={estilos.descripcion}>{descripcion}</p>}
      <p className={`${estilos.valor} ${typeof valor === 'number' ? '' : estilos.valorTexto}`}>
        {valor}
      </p>
      {chips && chips.length > 0 && (
        <div className={estilos.chips} aria-label="Ambientes en empate">
          {chips.map((nombre) => (
            <span key={nombre} className={estilos.chip}>
              <Icono nombre="ambientes" tamano={14} />
              <span>{nombre}</span>
            </span>
          ))}
        </div>
      )}
      {!ancha && <p className={estilos.descripcion}>{descripcion}</p>}
      {detalle && <p className={estilos.detalle}>{detalle}</p>}
    </>
  )

  return href ? (
    <Link
      className={`${estilos.enlace} ${ancha ? estilos.ancha : ''}`}
      to={href}
      aria-label={`${descripcion}: ${valor}`}
    >
      <article className={estilos.tarjeta}>{contenido}</article>
    </Link>
  ) : (
    <article className={estilos.tarjeta}>{contenido}</article>
  )
}
