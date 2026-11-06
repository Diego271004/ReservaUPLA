import { useCallback } from 'react'
import AlertMessage from '../ui/AlertMessage.jsx'
import Button from '../ui/Button.jsx'
import { Icono } from '../ui/Icono.jsx'
import { useCarga } from '../../hooks/useCarga.js'
import { obtenerDisponibilidadDia } from '../../services/recursosService.js'
import { fechaAIso, minutosDeHora } from '../../utils/fechas.js'
import { tramosFusionados } from '../../utils/disponibilidad.js'
import estilos from './FranjaNuevaReserva.module.css'

function horaMasUna(inicio, fin) {
  const unaHora = minutosDeHora(inicio) + 60
  return unaHora < minutosDeHora(fin)
    ? `${String(Math.floor(unaHora / 60)).padStart(2, '0')}:${String(unaHora % 60).padStart(2, '0')}`
    : fin
}

export default function FranjaNuevaReserva({
  ambienteId,
  fecha,
  horaInicio,
  horaFin,
  seleccionar,
}) {
  const iso = fechaAIso(fecha)
  const cargar = useCallback(
    () => (ambienteId && iso ? obtenerDisponibilidadDia(iso) : Promise.resolve(null)),
    [ambienteId, iso],
  )
  const carga = useCarga(cargar, null)
  const ambiente = carga.datos?.ambientes?.find((item) => String(item.id) === String(ambienteId))

  if (!ambienteId || !iso) return null
  if (carga.cargando)
    return <AlertMessage tipo="info">Cargando disponibilidad del ambiente…</AlertMessage>
  if (carga.error)
    return <AlertMessage tipo="error">No se pudo cargar la disponibilidad.</AlertMessage>
  if (!ambiente) return null

  const tramos =
    ambiente.estado === 'En mantenimiento'
      ? [{ tipo: 'mantenimiento', horaInicio: '07:00', horaFin: '22:00' }]
      : tramosFusionados(ambiente.bloques)
  // RN-01: solo una reserva APROBADA impide pedir ese horario; una pendiente puede coexistir (el administrador decide).
  const seCruza = (bloque) =>
    Boolean(horaInicio && horaFin) &&
    minutosDeHora(horaInicio) < minutosDeHora(bloque.horaFin) &&
    minutosDeHora(horaFin) > minutosDeHora(bloque.horaInicio)
  const hayChoque = Boolean(ambiente.bloques?.some((b) => b.estado === 'Aprobada' && seCruza(b)))
  const cruzaPendiente =
    !hayChoque && Boolean(ambiente.bloques?.some((b) => b.estado === 'Pendiente' && seCruza(b)))

  return (
    <section className={estilos.franja} aria-label="Disponibilidad del ambiente elegido">
      <h2>Disponibilidad del ambiente</h2>
      <p>
        Selecciona un tramo libre. Si dura más de una hora, se toma la primera hora; puedes ajustar
        el horario después.
      </p>
      {cruzaPendiente && (
        <AlertMessage tipo="info">
          Ya hay una solicitud pendiente en ese horario. Puedes pedirlo igual: el administrador
          decide cuál aprueba.
        </AlertMessage>
      )}
      <div className={estilos.tramos}>
        {tramos.map((tramo, indice) => {
          const libre =
            tramo.tipo === 'libre' &&
            ambiente.estado !== 'En mantenimiento' &&
            !carga.datos.soloLectura
          const choque = tramo.tipo === 'ocupado' && tramo.estado === 'Aprobada' && seCruza(tramo)
          const clase =
            tramo.tipo === 'mantenimiento'
              ? estilos.mantenimiento
              : tramo.tipo === 'libre'
                ? estilos.libre
                : tramo.estado === 'Aprobada'
                  ? estilos.aprobada
                  : estilos.pendiente
          const etiqueta =
            tramo.tipo === 'libre'
              ? `Libre ${tramo.horaInicio}–${tramo.horaFin}`
              : tramo.tipo === 'mantenimiento'
                ? 'Mantenimiento 07:00–22:00'
                : `${tramo.estado} ${tramo.horaInicio}–${tramo.horaFin}`
          return (
            <Button
              key={`${tramo.tipo}-${tramo.horaInicio}-${indice}`}
              variante="secundario"
              className={`${estilos.tramo} ${clase}`}
              deshabilitado={!libre}
              aria-label={etiqueta}
              onClick={() =>
                libre && seleccionar(tramo.horaInicio, horaMasUna(tramo.horaInicio, tramo.horaFin))
              }
            >
              <Icono
                nombre={
                  tramo.tipo === 'mantenimiento'
                    ? 'aviso'
                    : tramo.tipo === 'libre'
                      ? 'exito'
                      : tramo.estado === 'Aprobada'
                        ? 'marca'
                        : 'reloj'
                }
              />
              <span>{etiqueta}</span>
              {choque && (
                <span className={estilos.marcaChoque}>
                  <Icono nombre="aviso" tamano={14} />
                  <span>Choque</span>
                </span>
              )}
            </Button>
          )
        })}
      </div>
    </section>
  )
}
