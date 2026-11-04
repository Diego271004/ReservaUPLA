import { Link, useLocation, useParams } from 'react-router-dom'
import DetalleReserva from '../components/DetalleReserva/DetalleReserva.jsx'
import AlertMessage from '../components/ui/AlertMessage.jsx'
import Button from '../components/ui/Button.jsx'
import ModalDeReserva from '../components/ModalDeReserva/ModalDeReserva.jsx'
import { TEXTOS } from '../constants/messages.js'
import { useAuth } from '../context/AuthContext.jsx'
import { ESTADOS_PAGINA, useDetalleReserva } from '../hooks/useDetalleReserva.js'
import { accionesDeReserva, textoDeEvento } from '../utils/reservas.js'
import { rutaDeRegreso, textoDeRegreso } from '../utils/rutaDeRegreso.js'
import estilos from './DetalleReservaPage.module.css'

const VARIANTE_DE_BOTON = { cancelar: 'secundario', rechazar: 'rechazar', aprobar: 'primario' }

export default function DetalleReservaPage() {
  const { id } = useParams()
  const { sesion } = useAuth()
  // El enlace de regreso lleva a la lista o al panel de donde se vino, con sus filtros y su página.
  const { state } = useLocation()
  const volverA = rutaDeRegreso(sesion.rol, state?.volverA)
  const vm = useDetalleReserva(id)

  if (vm.estado === ESTADOS_PAGINA.cargando) return <p role="status">{TEXTOS.cargandoReserva}</p>

  if (vm.estado === ESTADOS_PAGINA.noEncontrado) {
    return (
      <>
        <h1>{TEXTOS.reservaNoEncontrada}</h1>
        <Link to={volverA}>{textoDeRegreso(volverA)}</Link>
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

  return (
    <>
      <DetalleReserva
        reserva={reserva}
        volverA={volverA}
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
      <ModalDeReserva
        accion={vm.modal}
        reserva={reserva}
        ejecutando={vm.ejecutando}
        alConfirmar={vm.confirmar}
        alVolver={vm.cerrarModal}
      />
    </>
  )
}
