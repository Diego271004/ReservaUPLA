import { useEffect, useRef } from 'react'
import { useNavigate } from 'react-router-dom'
import Button from '../ui/Button.jsx'
import { Icono } from '../ui/Icono.jsx'
import Insignia from '../ui/Insignia.jsx'
import estilos from './PanelReserva.module.css'

/**
 * Panel accesible con el detalle de una reserva en la vista de disponibilidad (ISO 9241-11).
 * Regla de privacidad: el Solicitante no ve nombre ni motivo ajenos; el Administrador y el Responsable sí.
 */
export default function PanelReserva({ reserva, ambiente, rol, onCerrar }) {
  const botonCerrarRef = useRef(null)
  const navigate = useNavigate()

  useEffect(() => {
    if (reserva) {
      botonCerrarRef.current?.focus()
    }
  }, [reserva])

  if (!reserva) return null

  const esAdminOResponsable = rol === 'Administrador' || rol === 'Responsable'
  const puedeVerDetalle = esAdminOResponsable || reserva.propia

  const alKeyDown = (evento) => {
    if (evento.key === 'Escape') {
      evento.stopPropagation()
      onCerrar()
    }
  }

  return (
    <div className={estilos.telon} onClick={onCerrar} onKeyDown={alKeyDown} role="presentation">
      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby="titulo-panel-reserva"
        className={estilos.panel}
        onClick={(e) => e.stopPropagation()}
      >
        <div className={estilos.cabecera}>
          <h2 id="titulo-panel-reserva" className={estilos.titulo}>
            {ambiente?.nombre ?? 'Reserva'}
          </h2>
          <Button
            variante="secundario"
            className={estilos.botonCerrar}
            onClick={onCerrar}
            aria-label="Cerrar panel"
            inputRef={botonCerrarRef}
          >
            <Icono nombre="cerrar" tamano={18} />
          </Button>
        </div>

        <div className={estilos.cuerpo}>
          <div className={estilos.fila}>
            <span className={estilos.etiqueta}>Horario:</span>
            <span className={estilos.valor}>
              {reserva.horaInicio} – {reserva.horaFin}
            </span>
          </div>

          <div className={estilos.fila}>
            <span className={estilos.etiqueta}>Estado:</span>
            <span className={estilos.valor}>
              <Insignia
                tipo={
                  reserva.estado === 'Aprobada'
                    ? 'aprobada'
                    : reserva.estado === 'Pendiente'
                      ? 'pendiente'
                      : 'neutro'
                }
              >
                {reserva.estado}
              </Insignia>
            </span>
          </div>

          {puedeVerDetalle ? (
            <>
              {reserva.solicitanteNombre && (
                <div className={estilos.fila}>
                  <span className={estilos.etiqueta}>Solicitante:</span>
                  <span className={estilos.valor}>{reserva.solicitanteNombre}</span>
                </div>
              )}
              {reserva.motivo && (
                <div className={estilos.fila}>
                  <span className={estilos.etiqueta}>Motivo:</span>
                  <span className={estilos.valor}>{reserva.motivo}</span>
                </div>
              )}
            </>
          ) : (
            <p className={estilos.privado}>
              <Icono nombre="info" tamano={16} />
              <span>Horario reservado por otro usuario.</span>
            </p>
          )}
        </div>

        <div className={estilos.pie}>
          {puedeVerDetalle && reserva.id && (
            <Button
              variante="primario"
              onClick={() => {
                onCerrar()
                navigate(`/reservas/${reserva.id}`)
              }}
            >
              Ver detalle
            </Button>
          )}
          <Button variante="secundario" onClick={onCerrar}>
            Volver
          </Button>
        </div>
      </div>
    </div>
  )
}
