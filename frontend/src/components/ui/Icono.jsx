/**
 * Iconos SVG en línea (sin dependencias). Son decorativos: el significado siempre va también en
 * texto, por eso llevan aria-hidden.
 */
const TRAZOS = {
  exito: (
    <>
      <circle cx="12" cy="12" r="10" />
      <path d="m8 12.5 2.5 2.5L16 9.5" />
    </>
  ),
  info: (
    <>
      <circle cx="12" cy="12" r="10" />
      <path d="M12 11v6" />
      <path d="M12 7.5v.5" />
    </>
  ),
  aviso: (
    <>
      <path d="M10.3 3.9 1.8 18.5A2 2 0 0 0 3.5 21.5h17a2 2 0 0 0 1.7-3L13.7 3.9a2 2 0 0 0-3.4 0Z" />
      <path d="M12 9v4" />
      <path d="M12 16.5v.5" />
    </>
  ),
  calendario: (
    <>
      <rect x="3" y="5" width="18" height="16" rx="2" />
      <path d="M3 10h18M8 3v4M16 3v4" />
    </>
  ),
  reloj: (
    <>
      <circle cx="12" cy="12" r="9" />
      <path d="M12 7v5l3 2" />
    </>
  ),
  flecha: <path d="m6 9 6 6 6-6" />,
  flechaIzquierda: <path d="M19 12H5m6-6-6 6 6 6" />,
  marca: <path d="m5 12.5 4.5 4.5L19 7.5" />,
  equis: <path d="m6 6 12 12M18 6 6 18" />,
  menos: <path d="M6 12h12" />,
  punto: <circle cx="12" cy="12" r="4" fill="currentColor" />,
}

export function Icono({ nombre, className }) {
  return (
    <svg
      className={className}
      viewBox="0 0 24 24"
      width="16"
      height="16"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
      focusable="false"
    >
      {TRAZOS[nombre]}
    </svg>
  )
}

/**
 * Único icono de error de todo el sistema (hallazgo U3): círculo relleno con exclamación.
 * Lo usan AlertMessage y todos los campos, nadie dibuja el suyo.
 */
export function IconoError({ className }) {
  return (
    <svg
      className={className}
      data-icono="error"
      viewBox="0 0 24 24"
      width="16"
      height="16"
      aria-hidden="true"
      focusable="false"
    >
      <circle cx="12" cy="12" r="10" fill="currentColor" />
      <path d="M12 7v6" stroke="#fff" strokeWidth="2.2" strokeLinecap="round" />
      <circle cx="12" cy="16.8" r="1.3" fill="#fff" />
    </svg>
  )
}
