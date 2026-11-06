import { Link } from 'react-router-dom'
import { fechaLarga } from '../../utils/resumenDeSolicitud.js'
import { hoy } from '../../utils/fechas.js'
import estilos from './Portada.module.css'

/**
 * La portada del Inicio del Administrador: en una sola mirada, cuántas solicitudes esperan su decisión y el camino directo para
 * atenderlas. Es el primer elemento que se lee (lo urgente primero). Los hexágonos son una marca decorativa de la universidad.
 */
export default function Portada({ pendientes, ahora = new Date() }) {
  const fecha = fechaLarga(hoy(ahora))
  const alDia = pendientes === 0

  return (
    <section className={estilos.portada} aria-labelledby="portada-titulo">
      <svg
        className={estilos.marca}
        viewBox="0 0 220 160"
        width="220"
        height="160"
        aria-hidden="true"
        focusable="false"
      >
        <path d="M60 10 100 33v46L60 102 20 79V33z" />
        <path d="M130 50 170 73v46l-40 23-40-23V73z" />
        <path d="M150 -10 190 13v46l-40 23-40-23V13z" />
      </svg>
      <div className={estilos.texto}>
        <p className={estilos.fecha}>{fecha}</p>
        <h2 id="portada-titulo" className={estilos.titulo}>
          {alDia
            ? 'Todo al día'
            : pendientes === 1
              ? '1 solicitud espera tu decisión'
              : `${pendientes} solicitudes esperan tu decisión`}
        </h2>
        <p className={estilos.detalle}>
          {alDia
            ? 'No hay solicitudes pendientes. Revisa la disponibilidad para anticiparte.'
            : 'Apruébalas o recházalas: quien las pidió está esperando una respuesta.'}
        </p>
      </div>
      <Link
        className={estilos.accion}
        to={alDia ? '/disponibilidad' : '/reservas?estado=Pendiente'}
      >
        {alDia ? 'Ver disponibilidad' : 'Revisar solicitudes'}
      </Link>
    </section>
  )
}
