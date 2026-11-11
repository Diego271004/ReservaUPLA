import estilos from './EsqueletoDeInicio.module.css'

/** Esqueleto de un Inicio mientras llegan los datos: el lector oye el mensaje y las cajas son solo decorativas. */
export default function EsqueletoDeInicio({ texto = 'Iniciando tu dashboard…' }) {
  return (
    <section aria-live="polite" aria-busy="true" className={estilos.esqueleto}>
      <p className={estilos.texto}>{texto}</p>
      <div className={estilos.caja} />
      <div className={estilos.caja} />
      <div className={estilos.caja} />
    </section>
  )
}
