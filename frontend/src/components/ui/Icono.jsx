/**
 * Iconos SVG de trazo, propios y en línea (sin dependencias: lucide-react sumaría un paquete para usar una docena de trazos). Son decorativos: el significado siempre va también en
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
  flechaDerecha: <path d="M5 12h14m-6-6 6 6-6 6" />,
  marca: <path d="m5 12.5 4.5 4.5L19 7.5" />,
  equis: <path d="m6 6 12 12M18 6 6 18" />,
  menos: <path d="M6 12h12" />,
  mas: <path d="M12 5v14M5 12h14" />,
  lista: <path d="M8 6h13M8 12h13M8 18h13M3.5 6h.01M3.5 12h.01M3.5 18h.01" />,
  punto: <circle cx="12" cy="12" r="4" fill="currentColor" />,
  dashboard: (
    <>
      <rect x="3" y="3" width="7" height="9" rx="1" />
      <rect x="14" y="3" width="7" height="5" rx="1" />
      <rect x="14" y="12" width="7" height="9" rx="1" />
      <rect x="3" y="16" width="7" height="5" rx="1" />
    </>
  ),
  reservas: (
    <>
      <rect x="5" y="3" width="14" height="18" rx="2" />
      <path d="M9 8h6M9 12h6M9 16h3" />
    </>
  ),
  nuevaReserva: (
    <>
      <rect x="3" y="5" width="18" height="16" rx="2" />
      <path d="M3 10h18M8 3v4M16 3v4M12 13v5M9.5 15.5h5" />
    </>
  ),
  ambientes: (
    <path d="M4 21V5a2 2 0 0 1 2-2h8a2 2 0 0 1 2 2v16M16 9h2a2 2 0 0 1 2 2v10M2 21h20M8 7h4M8 11h4M8 15h4" />
  ),
  usuarios: (
    <>
      <circle cx="9" cy="8" r="3.5" />
      <path d="M2.5 20a6.5 6.5 0 0 1 13 0M16 4.5a3.5 3.5 0 0 1 0 7M18 14.5a6.5 6.5 0 0 1 3.5 5.5" />
    </>
  ),
  miAmbiente: (
    <>
      <path d="M12 21s7-6.2 7-11.5a7 7 0 0 0-14 0C5 14.8 12 21 12 21Z" />
      <circle cx="12" cy="9.5" r="2.5" />
    </>
  ),
  luna: <path d="M21 12.8A9 9 0 1 1 11.2 3a7 7 0 0 0 9.8 9.8Z" />,
  sol: (
    <>
      <circle cx="12" cy="12" r="4" />
      <path d="M12 2v2M12 20v2M4.9 4.9l1.4 1.4M17.7 17.7l1.4 1.4M2 12h2M20 12h2M4.9 19.1l1.4-1.4M17.7 6.3l1.4-1.4" />
    </>
  ),
  menu: <path d="M4 6h16M4 12h16M4 18h16" />,
  salir: <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4M16 17l5-5-5-5M21 12H9" />,
  contraer: <path d="m11 17-5-5 5-5M18 17l-5-5 5-5" />,
  expandir: <path d="m13 17 5-5-5-5M6 17l5-5-5-5" />,
  laboratorio: (
    <>
      <rect x="2" y="3" width="20" height="14" rx="2" />
      <path d="M8 21h8M12 17v4" />
    </>
  ),
  auditorio: (
    <>
      <path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2" />
      <circle cx="9" cy="7" r="4" />
      <path d="M22 21v-2a4 4 0 0 0-3-3.87M16 3.13a4 4 0 0 1 0 7.75" />
    </>
  ),
  sala: (
    <>
      <rect x="4" y="8" width="16" height="8" rx="2" />
      <path d="M8 4v4M16 4v4M8 16v4M16 16v4" />
    </>
  ),
}

export function iconoDeTipoAmbiente(tipo) {
  const normalizado = (tipo || '').toLowerCase()
  if (normalizado.includes('lab')) return 'laboratorio'
  if (normalizado.includes('auditor')) return 'auditorio'
  if (normalizado.includes('sala')) return 'sala'
  return 'ambientes'
}

export function Icono({ nombre, className, tamano = 16 }) {
  return (
    <svg
      className={className}
      viewBox="0 0 24 24"
      width={tamano}
      height={tamano}
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
