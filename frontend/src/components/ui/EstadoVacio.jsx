import estilos from './EstadoVacio.module.css'

/**
 * Estado vacío institucional: ilustración SVG sobria y ligera con la silueta de un edificio institucional
 * ilustrativo y el emblema de la UPLA, mensaje semántico y siguiente paso claro.
 * Accesible: la ilustración tiene aria-hidden="true" y focusable="false".
 */
export default function EstadoVacio({ mensaje = null, children = null, compacto = false }) {
  return (
    <div
      className={`${estilos.vacio} ${compacto ? estilos.compacto : ''}`}
      data-testid="estado-vacio"
    >
      <svg
        className={estilos.ilustracion}
        viewBox="0 0 140 100"
        width={compacto ? '64' : '100'}
        height={compacto ? '46' : '72'}
        aria-hidden="true"
        focusable="false"
      >
        <ellipse cx="70" cy="52" rx="54" ry="34" className={estilos.aura} />

        <path d="M16 88 h108" className={estilos.lineaBase} />

        <path d="M12 28 h10 M118 28 h10 M18 54 h6 M116 54 h6" className={estilos.guiaFlotante} />

        <rect x="24" y="82" width="92" height="6" rx="2" className={estilos.escalon} />
        <rect x="30" y="78" width="80" height="4" rx="1" className={estilos.escalon} />

        <rect x="36" y="44" width="8" height="34" rx="1" className={estilos.columna} />
        <rect x="52" y="44" width="8" height="34" rx="1" className={estilos.columna} />
        <rect x="80" y="44" width="8" height="34" rx="1" className={estilos.columna} />
        <rect x="96" y="44" width="8" height="34" rx="1" className={estilos.columna} />

        <path d="M62 78 v-20 a8 8 0 0 1 16 0 v20" className={estilos.arco} />
        <path d="M70 60 v18" className={estilos.trazoFino} />

        <rect x="30" y="38" width="80" height="6" rx="1" className={estilos.cornisa} />
        <path d="M32 41 h76" className={estilos.fileteDorado} />
        <path d="M26 38 L70 14 L114 38 Z" className={estilos.fronton} />
        <path d="M36 36 L70 19 L104 36" className={estilos.trazoFino} />

        <path d="M70 21 L76 24.5 V31.5 L70 35 L64 31.5 V24.5 Z" className={estilos.isocresta} />
        <circle cx="70" cy="28" r="2" className={estilos.puntoDorado} />
      </svg>
      {mensaje && <p className={estilos.mensaje}>{mensaje}</p>}
      {children}
    </div>
  )
}
