import estilos from './EstadoVacio.module.css'

/**
 * Estado vacío del sistema: una ilustración sencilla, qué pasa y, si hay una salida, el botón que la ofrece («Limpiar
 * filtros», «Reservar un ambiente»). Un vacío sin siguiente paso deja al usuario sin saber qué hacer (Nielsen 9).
 */
export default function EstadoVacio({ mensaje = null, children = null }) {
  return (
    <div className={estilos.vacio}>
      <svg
        className={estilos.ilustracion}
        viewBox="0 0 120 96"
        width="120"
        height="96"
        aria-hidden="true"
        focusable="false"
      >
        <rect x="14" y="16" width="92" height="68" rx="6" className={estilos.hoja} />
        <rect x="14" y="16" width="92" height="18" rx="6" className={estilos.cabecera} />
        <path d="M34 8v14M86 8v14" className={estilos.anillas} />
        <path d="M30 48h24M30 60h40M30 72h18" className={estilos.lineas} />
        <circle cx="90" cy="68" r="12" className={estilos.lupa} />
        <path d="m99 77 8 8" className={estilos.lupa} />
      </svg>
      {mensaje && <p className={estilos.mensaje}>{mensaje}</p>}
      {children}
    </div>
  )
}
