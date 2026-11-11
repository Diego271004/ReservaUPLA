import { useEffect, useRef } from 'react'
import { useNavigate } from 'react-router-dom'
import Button from '../ui/Button.jsx'
import { Icono } from '../ui/Icono.jsx'
import Insignia from '../ui/Insignia.jsx'
import { TIPO_INSIGNIA_DE_ESTADO } from '../../utils/reservas.js'
import estilos from './PanelReserva.module.css'

function Dato({ etiqueta, children }) {
  return (
    <div className={estilos.fila}>
      <span className={estilos.etiqueta}>{etiqueta}:</span>
      <span className={estilos.valor}>{children}</span>
    </div>
  )
}

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
          <Dato etiqueta="Horario">
            {reserva.horaInicio} – {reserva.horaFin}
          </Dato>
          <Dato etiqueta="Estado">
            <Insignia tipo={TIPO_INSIGNIA_DE_ESTADO[reserva.estado] ?? 'neutro'}>
              {reserva.estado}
            </Insignia>
          </Dato>

          {puedeVerDetalle ? (
            <>
              {reserva.solicitanteNombre && (
                <Dato etiqueta="Solicitante">{reserva.solicitanteNombre}</Dato>
              )}
              {reserva.motivo && <Dato etiqueta="Motivo">{reserva.motivo}</Dato>}
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
