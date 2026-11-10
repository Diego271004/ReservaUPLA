import { Link } from 'react-router-dom'
import { Icono } from '../ui/Icono.jsx'
import { TEXTOS } from '../../constants/messages.js'
import { isoAFecha, tiempoRelativo } from '../../utils/fechas.js'
import { fraseDeActividad } from '../../utils/gestion.js'
import estilos from './ActividadReciente.module.css'

const ICONO_POR_ESTADO = {
  Pendiente: 'reloj',
  Aprobada: 'marca',
  Rechazada: 'equis',
  Cancelada: 'menos',
}
const TONO_POR_ESTADO = {
  Pendiente: 'pendiente',
  Aprobada: 'aprobada',
  Rechazada: 'rechazada',
  Cancelada: 'cancelada',
}

/**
 * «Actividad reciente»: los últimos cambios de estado de cualquier reserva, con quién los hizo y cuándo. Es la trazabilidad que
 * el caso pedía (hoy nada se pierde ni se pregunta por mensaje). Cada fila lleva al detalle de la reserva.
 */
export default function ActividadReciente({ actividad = [], ahora = new Date() }) {
  return (
    <section className={estilos.seccion} aria-labelledby="actividad-titulo">
      <h2 id="actividad-titulo">{TEXTOS.actividadReciente}</h2>
      {actividad.length === 0 ? (
        <p className={estilos.vacio}>{TEXTOS.sinActividad}</p>
      ) : (
        <ol className={estilos.lista}>
          {actividad.map((evento) => {
            const frase = fraseDeActividad(evento)
            const cuando = tiempoRelativo(evento.fecha, ahora)
            const detalle = `${evento.ambienteNombre} · ${isoAFecha(evento.fechaReserva)} · ${evento.horaInicio}–${evento.horaFin}`
            return (
              <li key={`${evento.reservaId}-${evento.fecha}-${evento.estadoNuevo}`}>
                <Link
                  className={estilos.fila}
                  to={`/reservas/${evento.reservaId}`}
                  state={{ volverA: '/dashboard' }}
                  aria-label={`${frase}. ${detalle}. ${cuando}`}
                >
                  <span
                    className={`${estilos.icono} ${estilos[TONO_POR_ESTADO[evento.estadoNuevo] ?? 'pendiente']}`}
                    aria-hidden="true"
                  >
                    <Icono nombre={ICONO_POR_ESTADO[evento.estadoNuevo] ?? 'reloj'} tamano={16} />
                  </span>
                  <span className={estilos.texto}>
                    <span className={estilos.frase}>{frase}</span>
                    <span className={estilos.detalle}>{detalle}</span>
                    <time className={estilos.cuando} dateTime={evento.fecha}>
                      {cuando}
                    </time>
                  </span>
                </Link>
              </li>
            )
          })}
        </ol>
      )}
    </section>
  )
}
