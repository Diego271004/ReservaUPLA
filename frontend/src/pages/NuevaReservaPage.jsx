import AlertMessage from '../components/ui/AlertMessage.jsx'
import Button from '../components/ui/Button.jsx'
import DateInput from '../components/ui/DateInput.jsx'
import FormularioTarjeta from '../components/FormularioTarjeta/FormularioTarjeta.jsx'
import Insignia from '../components/ui/Insignia.jsx'
import SelectInput from '../components/ui/SelectInput.jsx'
import TextInput from '../components/ui/TextInput.jsx'
import TimeInput from '../components/ui/TimeInput.jsx'
import { MENSAJES, TEXTOS } from '../constants/messages.js'
import { ESTADOS_DISPONIBILIDAD } from '../hooks/useDisponibilidad.js'
import { useReservaForm } from '../hooks/useReservaForm.js'
import { isoAFecha } from '../utils/fechas.js'
import { useNavigate } from 'react-router-dom'
import estilos from './NuevaReservaPage.module.css'

// Aviso inmediato (pantallas 04 y 04e): verde si está libre, rojo con la hora ocupada si no.
function AvisoDisponibilidad({ aviso }) {
  if (!aviso) return null
  if (aviso.estado === ESTADOS_DISPONIBILIDAD.consultando) {
    return <AlertMessage tipo="info">{TEXTOS.consultandoDisponibilidad}</AlertMessage>
  }
  const tipo = aviso.estado === ESTADOS_DISPONIBILIDAD.disponible ? 'exito' : 'error'
  return <AlertMessage tipo={tipo}>{aviso.mensaje}</AlertMessage>
}

export default function NuevaReservaPage() {
  const form = useReservaForm()
  const navigate = useNavigate()
  const { enviando, reservaCreada } = form

  // Cierre del proceso (S4): confirma que se registró y propone el siguiente paso.
  if (reservaCreada) {
    return (
      <>
        <h1>{TEXTOS.tituloNuevaReserva}</h1>
        <section className={estilos.cierre}>
          <AlertMessage tipo="exito">{MENSAJES.reservaRegistrada}</AlertMessage>
          <dl className={estilos.resumen}>
            <div>
              <dt>Ambiente</dt>
              <dd>{reservaCreada.ambienteNombre}</dd>
            </div>
            <div>
              <dt>Fecha</dt>
              <dd>{isoAFecha(reservaCreada.fecha)}</dd>
            </div>
            <div>
              <dt>Horario</dt>
              <dd>
                {reservaCreada.horaInicio} – {reservaCreada.horaFin}
              </dd>
            </div>
            <div>
              <dt>Estado</dt>
              <dd>
                <Insignia tipo="pendiente">{reservaCreada.estado}</Insignia>
              </dd>
            </div>
          </dl>
          <div className={estilos.acciones}>
            <Button variante="secundario" onClick={() => navigate(`/reservas/${reservaCreada.id}`)}>
              {TEXTOS.verDetalle}
            </Button>
            <Button onClick={form.registrarOtra}>{TEXTOS.tituloNuevaReserva}</Button>
          </div>
        </section>
      </>
    )
  }

  return (
    <FormularioTarjeta
      titulo={TEXTOS.tituloNuevaReserva}
      textoGuardar={TEXTOS.registrarSolicitud}
      enviando={enviando}
      alerta={form.alerta}
      onSubmit={form.handleSubmit}
      onCancelar={form.cancelar}
    >
      {form.errorAmbientes && <AlertMessage tipo="error">{form.errorAmbientes}</AlertMessage>}
      <SelectInput
        {...form.campoDeLista('ambienteId')}
        etiqueta={TEXTOS.etiquetaAmbiente}
        opciones={form.opcionesAmbiente}
        ayuda={form.ayudaAmbiente}
      />
      <DateInput {...form.campoDeTexto('fecha')} etiqueta={TEXTOS.etiquetaFecha} />
      <div className={estilos.horas}>
        <TimeInput
          {...form.campoDeLista('horaInicio')}
          etiqueta={TEXTOS.etiquetaHoraInicio}
          horas={form.horasInicio}
        />
        <TimeInput
          {...form.campoDeLista('horaFin')}
          etiqueta={TEXTOS.etiquetaHoraFin}
          horas={form.horasFin}
        />
      </div>
      <p className={estilos.ayudaHorario}>{TEXTOS.ayudaHorario}</p>
      <TextInput {...form.campoDeTexto('motivo')} etiqueta={TEXTOS.etiquetaMotivo} multilinea />
      <AvisoDisponibilidad aviso={form.disponibilidad} />
    </FormularioTarjeta>
  )
}
