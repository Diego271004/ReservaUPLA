import estilos from './EsqueletoDeLista.module.css'

/**
 * Esqueleto de una lista o tabla mientras llegan los datos: la forma de lo que va a aparecer (una cabecera y unas filas), para
 * que la pantalla no salte al cargar. Es decorativo (aria-hidden): el lector oye el mensaje de estado, que va aparte.
 */
export default function EsqueletoDeLista({ texto, filas = 5 }) {
  return (
    <>
      <p role="status" className="solo-lector">
        {texto}
      </p>
      <div className={estilos.esqueleto} aria-hidden="true" data-testid="esqueleto-de-lista">
        <div className={estilos.cabecera} />
        {Array.from({ length: filas }, (_, indice) => (
          <div className={estilos.fila} key={indice}>
            <span className={estilos.celdaLarga} />
            <span className={estilos.celda} />
            <span className={estilos.celdaCorta} />
          </div>
        ))}
      </div>
    </>
  )
}
