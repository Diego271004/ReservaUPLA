import { Link } from 'react-router-dom'
import PortadaDeInicio from '../ui/PortadaDeInicio.jsx'
import { fechaLarga } from '../../utils/resumenDeSolicitud.js'
import { hoy } from '../../utils/fechas.js'
import estilos from '../ui/PortadaDeInicio.module.css'

/**
 * La portada del Inicio del Administrador: en una sola mirada, cuántas solicitudes esperan su decisión y el camino directo para
 * atenderlas. Es el primer elemento que se lee (lo urgente primero).
 */
export default function Portada({ pendientes, ahora = new Date() }) {
  const alDia = pendientes === 0

  return (
    <PortadaDeInicio
      id="portada-titulo"
      fecha={fechaLarga(hoy(ahora))}
      titulo={
        alDia
          ? 'Todo al día'
          : pendientes === 1
            ? '1 solicitud espera tu decisión'
            : `${pendientes} solicitudes esperan tu decisión`
      }
      detalle={
        alDia
          ? 'No hay solicitudes pendientes. Revisa la disponibilidad para anticiparte.'
          : 'Apruébalas o recházalas: quien las pidió está esperando una respuesta.'
      }
    >
      <Link
        className={estilos.accion}
        to={alDia ? '/disponibilidad' : '/reservas?estado=Pendiente'}
      >
        {alDia ? 'Ver disponibilidad' : 'Revisar solicitudes'}
      </Link>
    </PortadaDeInicio>
  )
}
