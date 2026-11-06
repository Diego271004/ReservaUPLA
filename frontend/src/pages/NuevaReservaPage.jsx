import AlertMessage from '../components/ui/AlertMessage.jsx'
import AtajosDeDuracion from '../components/AtajosDeDuracion/AtajosDeDuracion.jsx'
import BarraResumenMovil from '../components/ResumenDeSolicitud/BarraResumenMovil.jsx'
import ResumenDeSolicitud from '../components/ResumenDeSolicitud/ResumenDeSolicitud.jsx'
import Button from '../components/ui/Button.jsx'
import DateInput from '../components/ui/DateInput.jsx'
import FormularioTarjeta from '../components/FormularioTarjeta/FormularioTarjeta.jsx'
import FranjaNuevaReserva from '../components/Disponibilidad/FranjaNuevaReserva.jsx'
import Insignia from '../components/ui/Insignia.jsx'
import PageHeader from '../components/ui/PageHeader.jsx'
import SelectorDeAmbientes from '../components/ui/SelectorDeAmbientes.jsx'
import TextInput from '../components/ui/TextInput.jsx'
import TimeInput from '../components/ui/TimeInput.jsx'
import { MENSAJES, TEXTOS } from '../constants/messages.js'
import { ESTADOS_DISPONIBILIDAD } from '../hooks/useDisponibilidad.js'
import { useReservaForm } from '../hooks/useReservaForm.js'
import { isoAFecha } from '../utils/fechas.js'
import { LIMITES } from '../utils/validators.js'
import { useNavigate } from 'react-router-dom'
import estilos from './NuevaReservaPage.module.css'

const LIMITE_MOTIVO = LIMITES.motivo

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
        <PageHeader titulo={TEXTOS.tituloNuevaReserva} />
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
            <Button
              variante="secundario"
              onClick={() =>
                navigate(`/reservas/${reservaCreada.id}`, { state: { volverA: '/reservas' } })
              }
            >
              {TEXTOS.verDetalle}
            </Button>
            <Button onClick={form.registrarOtra}>{TEXTOS.registrarOtra}</Button>
          </div>
        </section>
      </>
    )
  }

  return (
    <FormularioTarjeta
      titulo={TEXTOS.tituloNuevaReserva}
      textoGuardar={TEXTOS.registrarSolicitud}
      textoSecundario={TEXTOS.limpiarFormulario}
      enviando={enviando}
      alerta={form.alerta}
      onSubmit={form.handleSubmit}
      onCancelar={form.cancelar}
      barraInferior={
        <BarraResumenMovil
          ambiente={form.ambienteElegido}
          fecha={form.valores.fecha}
          horaInicio={form.valores.horaInicio}
          horaFin={form.valores.horaFin}
        />
      }
      lateral={
        <ResumenDeSolicitud
          ambiente={form.ambienteElegido}
          fecha={form.valores.fecha}
          horaInicio={form.valores.horaInicio}
          horaFin={form.valores.horaFin}
          motivo={form.valores.motivo}
        />
      }
    >
      {form.errorAmbientes && <AlertMessage tipo="error">{form.errorAmbientes}</AlertMessage>}
      <SelectorDeAmbientes
        {...form.campoDeLista('ambienteId')}
        etiqueta={TEXTOS.etiquetaAmbiente}
        ambientes={form.ambientes}
      />
      <DateInput
        {...form.campoDeTexto('fecha')}
        etiqueta={TEXTOS.etiquetaFecha}
        ayuda={TEXTOS.ayudaFecha}
      />
      <FranjaNuevaReserva
        ambienteId={form.valores.ambienteId}
        fecha={form.valores.fecha}
        horaInicio={form.valores.horaInicio}
        horaFin={form.valores.horaFin}
        seleccionar={form.seleccionarFranja}
      />
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
      <AtajosDeDuracion
        horaInicio={form.valores.horaInicio}
        horaFin={form.valores.horaFin}
        alElegir={form.seleccionarFranja}
      />
      <AvisoDisponibilidad aviso={form.disponibilidad} />
      <TextInput
        {...form.campoDeTexto('motivo')}
        etiqueta={TEXTOS.etiquetaMotivo}
        ayuda={`${form.valores.motivo.length} de ${LIMITE_MOTIVO} caracteres`}
        multilinea
      />
    </FormularioTarjeta>
  )
}
