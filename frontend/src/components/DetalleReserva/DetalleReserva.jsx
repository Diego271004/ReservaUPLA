import { Link } from 'react-router-dom'
import { isoAFecha } from '../../utils/fechas.js'
import Insignia from '../ui/Insignia.jsx'
import { Icono } from '../ui/Icono.jsx'
import estilos from './DetalleReserva.module.css'

const TIPO_INSIGNIA = {
  Pendiente: 'pendiente',
  Aprobada: 'aprobada',
  Rechazada: 'rechazada',
  Cancelada: 'cancelada',
}

/**
 * Único componente de detalle de reserva (hallazgo E4): la misma estructura para todos los estados y
 * roles (enlace de regreso, datos, historial). Las variantes solo cambian lo que se le pasa en `alerta`
 * (un AlertMessage) y en `acciones` (los botones). En la Fase 5 solo existe su estructura: sin acciones.
 */
export default function DetalleReserva({ reserva, historial = [], alerta, acciones }) {
  const datos = [
    ['Ambiente', reserva.ambienteNombre],
    ['Solicitante', reserva.solicitanteNombre],
    ['Fecha', isoAFecha(reserva.fecha)],
    ['Horario', `${reserva.horaInicio} – ${reserva.horaFin}`],
    ['Motivo', reserva.motivo],
  ]

  return (
    <section className={estilos.detalle} aria-labelledby="titulo-detalle-reserva">
      <Link to="/reservas" className={estilos.volver}>
        <Icono nombre="flechaIzquierda" />
        Volver a Reservas
      </Link>
      <h1 id="titulo-detalle-reserva">Detalle de la reserva</h1>
      {alerta}
      <div className={estilos.tarjeta}>
        <dl className={estilos.datos}>
          {datos.map(([etiqueta, valor]) => (
            <div key={etiqueta}>
              <dt>{etiqueta}</dt>
              <dd>{valor}</dd>
            </div>
          ))}
          <div>
            <dt>Estado</dt>
            <dd>
              <Insignia tipo={TIPO_INSIGNIA[reserva.estado]}>{reserva.estado}</Insignia>
            </dd>
          </div>
        </dl>
        <h2>Historial</h2>
        {historial.length === 0 ? (
          <p className={estilos.sinHistorial}>Todavía no hay eventos.</p>
        ) : (
          <ul className={estilos.historial}>
            {historial.map((evento) => (
              <li key={evento.id}>{evento.texto}</li>
            ))}
          </ul>
        )}
        {acciones && <div className={estilos.acciones}>{acciones}</div>}
      </div>
    </section>
  )
}
