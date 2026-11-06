import { TEXTOS } from '../../constants/messages.js'
import estilos from '../../pages/DashboardPage.module.css'

const ESTADOS = (indicadores) => [
  ['Pendiente', indicadores.pendientes, estilos.pendiente, estilos.puntoPendiente],
  ['Aprobada', indicadores.aprobadas, estilos.aprobada, estilos.puntoAprobada],
  ['Rechazada', indicadores.rechazadas, estilos.rechazada, estilos.puntoRechazada],
]

/**
 * «Uso por ambiente» (barras horizontales de reservas aprobadas, con su tabla alternativa) y «Reservas por estado» (barra
 * apilada, leyenda legible y tabla). Cada gráfico tiene su equivalente en texto o en tabla.
 */
export default function UsoYEstados({ uso, indicadores }) {
  const maxUso = Math.max(1, ...uso.map((ambiente) => ambiente.reservasAprobadas))
  const estados = ESTADOS(indicadores)

  return (
    <section className={estilos.seccion} aria-labelledby="uso-titulo">
      <h2 id="uso-titulo">{TEXTOS.usoPorAmbiente}</h2>
      {uso.length === 0 ? (
        <p>{TEXTOS.usoSinDatos}</p>
      ) : (
        <>
          <div
            className={estilos.barras}
            role="img"
            aria-label="Gráfico de barras horizontales de reservas aprobadas por ambiente"
          >
            {uso.map((ambiente) => (
              <div className={estilos.filaBarra} key={ambiente.ambienteId}>
                <span>{ambiente.nombre}</span>
                <div className={estilos.trazo}>
                  <span style={{ width: `${(ambiente.reservasAprobadas / maxUso) * 100}%` }} />
                </div>
                <strong>{ambiente.reservasAprobadas}</strong>
              </div>
            ))}
          </div>
          <details className={estilos.tablaAlternativa}>
            <summary>{TEXTOS.usoTablaAlternativa}</summary>
            <table>
              <thead>
                <tr>
                  <th>Ambiente</th>
                  <th>Reservas aprobadas</th>
                </tr>
              </thead>
              <tbody>
                {uso.map((ambiente) => (
                  <tr key={ambiente.ambienteId}>
                    <td>{ambiente.nombre}</td>
                    <td>{ambiente.reservasAprobadas}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </details>
        </>
      )}
      <h3>{TEXTOS.distribucionEstados}</h3>
      <div
        className={estilos.apilada}
        role="img"
        aria-label={`${indicadores.pendientes} pendientes, ${indicadores.aprobadas} aprobadas, ${indicadores.rechazadas} rechazadas`}
      >
        {estados.map(([nombre, valor, clase]) => (
          <span
            key={nombre}
            className={clase}
            style={{ flexGrow: Math.max(0, valor) }}
            aria-hidden="true"
          ></span>
        ))}
      </div>
      <ul className={estilos.leyendaEstados} aria-label="Leyenda de reservas por estado">
        {estados.map(([nombre, valor, , clasePunto]) => (
          <li key={nombre}>
            <span className={`${estilos.puntoEstado} ${clasePunto}`} aria-hidden="true" />
            <span>{nombre}</span>
            <strong>{valor}</strong>
          </li>
        ))}
      </ul>
      <table className={estilos.tablaEstados}>
        <tbody>
          {estados.map(([nombre, valor]) => (
            <tr key={nombre}>
              <th>{nombre}</th>
              <td>{valor}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </section>
  )
}
