import CardIndicador from '../ui/CardIndicador.jsx'
import estilos from './GrupoDeIndicadores.module.css'

/**
 * La fila de tarjetas de indicadores del Dashboard y de Mi ambiente. Las tarjetas de una fila miden lo mismo: la rejilla las
 * estira al alto de la más alta. `indicadores`: [{ clave, valor, descripcion, detalle? }]. Con `columnas={2}` la fila lleva solo
 * dos tarjetas anchas (los indicadores de gestión); `etiqueta` es el nombre de la región para el lector de pantalla.
 */
export default function GrupoDeIndicadores({
  indicadores,
  etiqueta = 'Indicadores',
  columnas = null,
}) {
  return (
    <section
      className={`${estilos.grupo} ${columnas === 2 ? estilos.dos : ''}`}
      aria-label={etiqueta}
    >
      {indicadores.map(
        ({ clave, valor, descripcion, detalle, href, icono, tono, ancha, chips }) => (
          <CardIndicador
            key={clave}
            valor={valor}
            descripcion={descripcion}
            detalle={detalle}
            href={href}
            icono={icono}
            tono={tono}
            ancha={ancha}
            chips={chips}
          />
        ),
      )}
    </section>
  )
}
