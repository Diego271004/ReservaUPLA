import { useCallback, useEffect, useMemo, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import AlertMessage from '../components/ui/AlertMessage.jsx'
import Button from '../components/ui/Button.jsx'
import DateInput from '../components/ui/DateInput.jsx'
import PageHeader from '../components/ui/PageHeader.jsx'
import { Icono } from '../components/ui/Icono.jsx'
import {
  AgendaMovil,
  BloquesEscritorio,
} from '../components/Disponibilidad/BloquesDisponibilidad.jsx'
import PanelReserva from '../components/Disponibilidad/PanelReserva.jsx'
import { useCarga } from '../hooks/useCarga.js'
import { useAuth } from '../context/AuthContext.jsx'
import { obtenerDisponibilidadDia } from '../services/recursosService.js'
import { esAnteriorAHoy, fechaAIso, hoy, isoAFecha } from '../utils/fechas.js'
import estilos from './DisponibilidadPage.module.css'

function agregarDia(valor, dias) {
  const iso = fechaAIso(valor) ?? fechaAIso(hoy())
  const fecha = new Date(`${iso}T12:00:00`)
  fecha.setDate(fecha.getDate() + dias)
  return `${String(fecha.getDate()).padStart(2, '0')}/${String(fecha.getMonth() + 1).padStart(2, '0')}/${fecha.getFullYear()}`
}

export function formatearFechaDisponibilidad(fechaIso) {
  if (!fechaIso) return ''
  const [anio, mes, dia] = fechaIso.split('-').map(Number)
  return new Intl.DateTimeFormat('es-PE', {
    weekday: 'long',
    day: 'numeric',
    month: 'long',
    year: 'numeric',
    timeZone: 'America/Lima',
  }).format(new Date(anio, mes - 1, dia))
}

export function horaLima(fecha = new Date()) {
  return new Intl.DateTimeFormat('es-PE', {
    timeZone: 'America/Lima',
    hour: '2-digit',
    minute: '2-digit',
    hourCycle: 'h23',
  }).format(fecha)
}

export default function DisponibilidadPage() {
  const [fecha, setFecha] = useState(hoy)
  const [movil, setMovil] = useState(false)
  const [reservaModal, setReservaModal] = useState(null)

  useEffect(() => {
    const media = window.matchMedia?.('(max-width: 767px)')
    if (!media) return undefined
    const actualizar = () => setMovil(media.matches)
    actualizar()
    media.addEventListener?.('change', actualizar)
    return () => media.removeEventListener?.('change', actualizar)
  }, [])

  const navigate = useNavigate()
  const { sesion } = useAuth()
  const responsable = sesion?.rol === 'Responsable'
  const cargar = useCallback(() => obtenerDisponibilidadDia(fechaAIso(fecha) ?? ''), [fecha])
  const disponibilidad = useCarga(cargar, null)
  const datos = disponibilidad.datos
  const hoySeleccionado = fechaAIso(fecha) === fechaAIso(hoy())

  const rangoActual = datos?.ambientes?.length
    ? formatearFechaDisponibilidad(datos.fecha)
    : formatearFechaDisponibilidad(fechaAIso(fecha))
  const past = esAnteriorAHoy(fecha)
  const keyAhora = useMemo(() => new Date(), [])

  const totalReservas = useMemo(
    () =>
      datos?.ambientes?.reduce(
        (acum, amb) =>
          acum +
          (amb.bloques?.filter((b) => b.estado === 'Aprobada' || b.estado === 'Pendiente').length ??
            0),
        0,
      ) ?? 0,
    [datos?.ambientes],
  )

  return (
    <div className={estilos.pagina}>
      <PageHeader
        titulo="Disponibilidad"
        subtitulo={`${rangoActual} · Hora de Lima: ${horaLima(keyAhora)}`}
        acciones={
          <div className={estilos.fechas} role="group" aria-label="Controles de fecha">
            <Button
              variante="secundario"
              className={estilos.botonNav}
              aria-label="Día anterior"
              onClick={() => setFecha((actual) => agregarDia(actual, -1))}
            >
              <span aria-hidden="true">◀</span>
            </Button>
            <DateInput
              id="fechaDisponibilidad"
              nombre="fechaDisponibilidad"
              etiqueta="Fecha"
              valor={fecha}
              onChange={(evento) => setFecha(evento.target.value)}
            />
            <Button
              variante="secundario"
              className={estilos.botonNav}
              aria-label="Día siguiente"
              onClick={() => setFecha((actual) => agregarDia(actual, 1))}
            >
              <span aria-hidden="true">▶</span>
            </Button>
            <Button
              variante="secundario"
              className={estilos.botonHoy}
              onClick={() => setFecha(hoy())}
            >
              Hoy
            </Button>
          </div>
        }
      />

      <div className={estilos.leyenda} aria-label="Leyenda">
        {[
          ['libre', 'exito', 'Libre'],
          ['pendiente', 'reloj', 'Pendiente'],
          ['aprobada', 'marca', 'Aprobada'],
          ['mantenimiento', 'aviso', 'Mantenimiento'],
        ].map(([tipo, icono, texto]) => (
          <span key={tipo}>
            <Icono nombre={icono} /> <span>{texto}</span>
          </span>
        ))}
      </div>

      {past && <AlertMessage tipo="info">Solo lectura: este día ya pasó</AlertMessage>}

      {disponibilidad.cargando && (
        <section className={estilos.esqueleto} aria-label="Cargando disponibilidad">
          <span className="solo-lector">Cargando disponibilidad…</span>
          {[1, 2, 3].map((fila) => (
            <div key={fila} className={estilos.carrilEsqueleto}>
              <div className={estilos.esqueletoNombre} />
              <div className={estilos.esqueletoPista}>
                <div className={estilos.esqueletoBloque1} />
                <div className={estilos.esqueletoBloque2} />
              </div>
            </div>
          ))}
        </section>
      )}

      {disponibilidad.error && (
        <AlertMessage tipo="error">
          <span>No se pudo cargar la disponibilidad.</span>
          <Button variante="secundario" onClick={disponibilidad.recargar}>
            Reintentar
          </Button>
        </AlertMessage>
      )}

      {!disponibilidad.cargando && !disponibilidad.error && totalReservas === 0 && (
        <AlertMessage tipo="info">
          Día libre en todos los ambientes: puedes reservar el que necesites
        </AlertMessage>
      )}

      {!disponibilidad.cargando && !disponibilidad.error && datos?.ambientes?.length === 0 && (
        <div className={estilos.vacio}>
          <h2>Día libre en todos los ambientes: puedes reservar el que necesites</h2>
          {!responsable && (
            <Button onClick={() => navigate('/reservas/nueva')}>Reservar un ambiente</Button>
          )}
        </div>
      )}

      {!disponibilidad.cargando && !disponibilidad.error && datos?.ambientes?.length > 0 && (
        <section
          aria-label={`Disponibilidad del ${isoAFecha(datos.fecha)}`}
          className={estilos.vista}
        >
          {!movil && (
            <BloquesEscritorio
              ambientes={datos.ambientes}
              datos={datos}
              hoySeleccionado={hoySeleccionado}
              ahora={keyAhora}
              rol={sesion?.rol}
              past={past}
              responsable={responsable}
              alElegirReserva={(reserva, ambiente) => setReservaModal({ reserva, ambiente })}
            />
          )}
          {movil && (
            <AgendaMovil
              ambientes={datos.ambientes}
              datos={datos}
              past={past}
              responsable={responsable}
              alElegirReserva={(reserva, ambiente) => setReservaModal({ reserva, ambiente })}
            />
          )}
        </section>
      )}

      {reservaModal && (
        <PanelReserva
          reserva={reservaModal.reserva}
          ambiente={reservaModal.ambiente}
          rol={sesion?.rol}
          onCerrar={() => setReservaModal(null)}
        />
      )}
    </div>
  )
}
