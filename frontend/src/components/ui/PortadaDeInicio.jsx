import estilos from './PortadaDeInicio.module.css'

/**
 * La portada de cada Inicio (Administrador, Solicitante y Responsable): la fecha, un titular con lo más importante y, si hace
 * falta, una acción (`children`). Los hexágonos son una marca decorativa de la universidad.
 */
export default function PortadaDeInicio({ id, fecha, titulo, detalle, children }) {
  return (
    <section className={estilos.portada} aria-labelledby={id}>
      <svg
        className={estilos.marca}
        viewBox="0 0 220 160"
        width="220"
        height="160"
        aria-hidden="true"
        focusable="false"
      >
        <path d="M60 10 100 33v46L60 102 20 79V33z" />
        <path d="M130 50 170 73v46l-40 23-40-23V73z" />
        <path d="M150 -10 190 13v46l-40 23-40-23V13z" />
      </svg>
      <div className={estilos.texto}>
        <p className={estilos.fecha}>{fecha}</p>
        <h2 id={id} className={estilos.titulo}>
          {titulo}
        </h2>
        <p className={estilos.detalle}>{detalle}</p>
      </div>
      {children}
    </section>
  )
}
