import { Link } from 'react-router-dom'
import { TEXTOS } from '../../constants/messages.js'
import { isoAFecha } from '../../utils/fechas.js'
import { fechaLarga, textoDeDuracion } from '../../utils/resumenDeSolicitud.js'
import { textoDeRegreso } from '../../utils/rutaDeRegreso.js'
import { TIPO_INSIGNIA_DE_ESTADO } from '../../utils/reservas.js'
import Insignia from '../ui/Insignia.jsx'
import PageHeader from '../ui/PageHeader.jsx'
import { Icono } from '../ui/Icono.jsx'
import estilos from './DetalleReserva.module.css'

/**
 * Único componente de detalle de reserva (hallazgo E4): la misma estructura para todos los estados y
 * roles (enlace de regreso, datos, historial). Las variantes solo cambian lo que se le pasa en `alerta`
 * (un AlertMessage) y en `acciones` (los botones). En la Fase 5 solo existe su estructura: sin acciones.
 */
export default function DetalleReserva({
  reserva,
  historial = [],
  alerta,
  acciones,
  volverA = '/reservas',
}) {
  const cuando = [
    fechaLarga(isoAFecha(reserva.fecha)),
    textoDeDuracion(reserva.horaInicio, reserva.horaFin),
  ]
    .filter(Boolean)
    .join(' · ')
  const datos = [
    ['Solicitante', reserva.solicitanteNombre],
    ['Fecha', isoAFecha(reserva.fecha)],
    ['Horario', `${reserva.horaInicio} – ${reserva.horaFin}`],
    ['Motivo', reserva.motivo],
  ]

  return (
    <section className={estilos.detalle} aria-labelledby="titulo-detalle-reserva">
      <Link to={volverA} className={estilos.volver}>
        <Icono nombre="flechaIzquierda" />
        {textoDeRegreso(volverA)}
      </Link>
      <PageHeader titulo={TEXTOS.tituloDetalleReserva} idTitulo="titulo-detalle-reserva" />
      {alerta}
      <div className={estilos.tarjeta}>
        <div className={estilos.hero}>
          <div>
            <p className={estilos.sobretitulo}>Reserva de</p>
            <p className={estilos.ambiente}>{reserva.ambienteNombre}</p>
            <p className={estilos.cuando}>{cuando}</p>
          </div>
          <Insignia tipo={TIPO_INSIGNIA_DE_ESTADO[reserva.estado]}>{reserva.estado}</Insignia>
        </div>
        <dl className={estilos.datos}>
          {datos.map(([etiqueta, valor]) => (
            <div key={etiqueta}>
              <dt>{etiqueta}</dt>
              <dd>{valor}</dd>
            </div>
          ))}
        </dl>
        <h2>Historial</h2>
        {historial.length === 0 ? (
          <p className={estilos.sinHistorial}>Todavía no hay eventos.</p>
        ) : (
          <ol className={estilos.historial} aria-label="Historial de la reserva">
            {historial.map((evento, indice) => {
              const esActual = indice === historial.length - 1
              return (
                <li
                  key={evento.id}
                  className={esActual ? estilos.actual : estilos.pasado}
                  aria-current={esActual ? 'step' : undefined}
                >
                  <div className={estilos.eventoContenido}>
                    <span className={estilos.eventoTexto}>{evento.texto}</span>
                    {evento.fechaRelativa && (
                      <time
                        dateTime={evento.fecha}
                        aria-label={evento.fechaAbsoluta}
                        className={estilos.eventoFecha}
                      >
                        ({evento.fechaRelativa})
                      </time>
                    )}
                  </div>
                </li>
              )
            })}
          </ol>
        )}
        {acciones && (
          <div className={estilos.acciones} data-testid="acciones-reserva">
            {acciones}
          </div>
        )}
      </div>
    </section>
  )
}
