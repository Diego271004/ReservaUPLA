import CardIndicador from '../ui/CardIndicador.jsx'
import estilos from './GrupoDeIndicadores.module.css'

/**
 * La fila de tarjetas de indicadores del Dashboard y de Mi ambiente. Las tarjetas de una fila miden lo mismo: la rejilla las
 * estira al alto de la más alta. `indicadores`: [{ clave, valor, descripcion, detalle? }].
 */
export default function GrupoDeIndicadores({ indicadores }) {
  return (
    <section className={estilos.grupo} aria-label="Indicadores">
      {indicadores.map(({ clave, valor, descripcion, detalle, href, icono, tono, ancha }) => (
        <CardIndicador
          key={clave}
          valor={valor}
          descripcion={descripcion}
          detalle={detalle}
          href={href}
          icono={icono}
          tono={tono}
          ancha={ancha}
        />
      ))}
    </section>
  )
}
