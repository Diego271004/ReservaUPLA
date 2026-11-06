import estilos from './PageHeader.module.css'

/**
 * Cabecera común de todas las pantallas: título (h1), una línea de contexto debajo («6 reservas · 2 pendientes») y las
 * acciones principales a la derecha. Así toda pantalla empieza igual y el usuario sabe dónde está y qué puede hacer
 * (consistencia, Nielsen 4 y Shneiderman 1).
 */
export default function PageHeader({ titulo, subtitulo = null, acciones = null, idTitulo }) {
  return (
    <header className={estilos.cabecera}>
      <div className={estilos.texto}>
        <h1 id={idTitulo}>{titulo}</h1>
        {subtitulo && <p className={estilos.subtitulo}>{subtitulo}</p>}
      </div>
      {acciones && <div className={estilos.acciones}>{acciones}</div>}
    </header>
  )
}
