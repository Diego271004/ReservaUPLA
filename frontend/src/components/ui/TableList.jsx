import { TEXTOS } from '../../constants/messages.js'
import estilos from './TableList.module.css'

/**
 * Tabla única del sistema. `columnas`: [{ clave, titulo, render? }]; `render(fila)` permite mostrar una
 * insignia o un botón. Encabezados en negrita con mayúscula inicial. En móvil cada fila se vuelve una
 * tarjeta apilada (cada celda lleva su título en data-etiqueta), así que nunca hay desplazamiento horizontal.
 * Con `alActivarFila` toda la fila responde al puntero (el botón de la fila sigue siendo el camino del teclado).
 */
export default function TableList({
  titulo,
  columnas,
  filas,
  claveFila = 'id',
  textoVacio = TEXTOS.noHayDatos,
  alActivarFila = null,
}) {
  return (
    <div className={estilos.contenedor}>
      <table className={estilos.tabla}>
        <caption className={estilos.titulo}>{titulo}</caption>
        <thead>
          <tr>
            {columnas.map((columna) => (
              <th key={columna.clave} scope="col">
                {columna.titulo}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {filas.length === 0 ? (
            <tr>
              <td colSpan={columnas.length} className={estilos.vacio}>
                {textoVacio}
              </td>
            </tr>
          ) : (
            filas.map((fila) => (
              <tr
                key={fila[claveFila]}
                className={alActivarFila ? estilos.activable : undefined}
                onClick={
                  alActivarFila
                    ? (evento) => {
                        // Un clic en un botón o enlace de la fila hace lo suyo; el resto de la fila abre el registro.
                        if (!evento.target.closest('button, a, input, select')) alActivarFila(fila)
                      }
                    : undefined
                }
              >
                {columnas.map((columna) => (
                  <td key={columna.clave} data-etiqueta={columna.titulo}>
                    {columna.render ? columna.render(fila) : fila[columna.clave]}
                  </td>
                ))}
              </tr>
            ))
          )}
        </tbody>
      </table>
    </div>
  )
}
