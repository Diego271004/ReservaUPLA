import estilos from './Button.module.css'

/**
 * Botón único del sistema. Variantes: primario (azul sólido), secundario (con borde), rechazar (contorno rojo),
 * confirmarRechazo (rojo sólido, solo en el modal) y enlace (texto, como "Cancelar" del login). Sobre el fondo
 * oscuro del menú lateral: sobreOscuro (con borde, abre el menú en móvil) y sobreOscuroLista (fila, cierra la sesión).
 * Con `cargando` muestra el spinner y el texto de carga, y no responde a más clics (sin perder el foco).
 */
export default function Button({
  variante = 'primario',
  tipo = 'button',
  cargando = false,
  textoCarga,
  deshabilitado = false,
  onClick,
  children,
  ...resto
}) {
  const alHacerClic = (evento) => {
    if (cargando) {
      evento.preventDefault()
      return
    }
    onClick?.(evento)
  }

  return (
    <button
      {...resto}
      type={tipo}
      className={`${estilos.boton} ${estilos[variante]}`}
      disabled={deshabilitado}
      aria-busy={cargando || undefined}
      aria-disabled={cargando || undefined}
      onClick={alHacerClic}
    >
      {cargando && <span className={estilos.spinner} aria-hidden="true" />}
      {cargando && textoCarga ? textoCarga : children}
    </button>
  )
}
