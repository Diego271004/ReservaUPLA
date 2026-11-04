import { Link, useParams } from 'react-router-dom'
import DetalleReserva from '../components/DetalleReserva/DetalleReserva.jsx'
import AlertMessage from '../components/ui/AlertMessage.jsx'
import Button from '../components/ui/Button.jsx'
import ModalConfirmacion from '../components/ui/ModalConfirmacion.jsx'
import { TEXTOS } from '../constants/messages.js'
import { useAuth } from '../context/AuthContext.jsx'
import { ESTADOS_PAGINA, useDetalleReserva } from '../hooks/useDetalleReserva.js'
import { isoAFecha } from '../utils/fechas.js'
import { accionesDeReserva, textoDeEvento } from '../utils/reservas.js'
import estilos from './DetalleReservaPage.module.css'

// Qué pide cada modal de confirmación (pantallas 05b, 05d y 05e).
const MODALES = {
  aprobar: {
    titulo: TEXTOS.tituloModalAprobar,
    confirmar: TEXTOS.confirmarAprobar,
    variante: 'primario',
  },
  rechazar: {
    titulo: TEXTOS.tituloModalRechazar,
    confirmar: TEXTOS.confirmarRechazar,
    variante: 'rechazo',
    irreversible: true, // Rechazada es un estado final (RN-06)
  },
  cancelar: {
    titulo: TEXTOS.tituloModalCancelar,
    confirmar: TEXTOS.confirmarCancelar,
    variante: 'primario',
    irreversible: true, // Cancelada es un estado final (RN-06)
  },
}

const VARIANTE_DE_BOTON = { cancelar: 'secundario', rechazar: 'rechazar', aprobar: 'primario' }

function resumenDe(reserva) {
  return [
    `Ambiente: ${reserva.ambienteNombre}`,
    `Solicitante: ${reserva.solicitanteNombre}`,
    `Horario: ${isoAFecha(reserva.fecha)}, ${reserva.horaInicio} – ${reserva.horaFin}`,
  ]
}

export default function DetalleReservaPage() {
  const { id } = useParams()
  const { sesion } = useAuth()
  const vm = useDetalleReserva(id)

  if (vm.estado === ESTADOS_PAGINA.cargando) return <p role="status">{TEXTOS.cargandoReserva}</p>

  if (vm.estado === ESTADOS_PAGINA.noEncontrado) {
    return (
      <>
        <h1>{TEXTOS.reservaNoEncontrada}</h1>
        <Link to="/reservas">Volver a Reservas</Link>
      </>
    )
  }

  if (vm.estado === ESTADOS_PAGINA.error) {
    return (
      <>
        <AlertMessage tipo="error">{vm.error}</AlertMessage>
        <Button variante="secundario" onClick={vm.recargar}>
          {TEXTOS.reintentar}
        </Button>
      </>
    )
  }

  const { reserva, historial } = vm.detalle
  const { acciones, aviso } = accionesDeReserva(sesion, reserva)
  const modal = vm.modal ? MODALES[vm.modal] : null

  return (
    <>
      <DetalleReserva
        reserva={reserva}
        historial={historial.map((evento) => ({ id: evento.id, texto: textoDeEvento(evento) }))}
        alerta={
          <>
            {vm.alerta && <AlertMessage tipo={vm.alerta.tipo}>{vm.alerta.mensaje}</AlertMessage>}
            {aviso && <AlertMessage tipo="info">{aviso}</AlertMessage>}
          </>
        }
        acciones={
          acciones.length > 0 ? (
            <>
              {acciones.map((accion) => (
                <div
                  key={accion.id}
                  className={accion.id === 'cancelar' ? estilos.separada : undefined}
                >
                  <Button
                    variante={VARIANTE_DE_BOTON[accion.id]}
                    deshabilitado={!accion.habilitada}
                    onClick={() => vm.abrirModal(accion.id)}
                  >
                    {accion.texto}
                  </Button>
                </div>
              ))}
            </>
          ) : null
        }
      />
      <ModalConfirmacion
        abierto={modal !== null}
        titulo={modal?.titulo ?? ''}
        resumen={resumenDe(reserva)}
        advertencia={modal?.irreversible ? TEXTOS.advertenciaIrreversible : undefined}
        textoConfirmar={modal?.confirmar ?? ''}
        variante={modal?.variante}
        cargando={vm.ejecutando}
        onConfirmar={vm.confirmar}
        onVolver={vm.cerrarModal}
      />
    </>
  )
}
