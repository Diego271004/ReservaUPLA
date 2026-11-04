import AlertMessage from '../components/ui/AlertMessage.jsx'
import Button from '../components/ui/Button.jsx'
import DateInput from '../components/ui/DateInput.jsx'
import FormularioTarjeta from '../components/FormularioTarjeta/FormularioTarjeta.jsx'
import Insignia from '../components/ui/Insignia.jsx'
import SelectInput from '../components/ui/SelectInput.jsx'
import TextInput from '../components/ui/TextInput.jsx'
import TimeInput from '../components/ui/TimeInput.jsx'
import { MENSAJES, TEXTOS } from '../constants/messages.js'
import { useReservaForm } from '../hooks/useReservaForm.js'
import { isoAFecha } from '../utils/fechas.js'
import estilos from './NuevaReservaPage.module.css'

export default function NuevaReservaPage() {
  const form = useReservaForm()
  const { valores, errores, enviando, reservaCreada } = form

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
        id="ambienteId"
        nombre="ambienteId"
        etiqueta={TEXTOS.etiquetaAmbiente}
        valor={valores.ambienteId}
        opciones={form.opcionesAmbiente}
        error={errores.ambienteId}
        onChange={form.handleChange}
        onBlur={form.handleBlur}
        deshabilitado={enviando}
        inputRef={form.refDe('ambienteId')}
      />
      <DateInput
        id="fecha"
        nombre="fecha"
        etiqueta={TEXTOS.etiquetaFecha}
        valor={valores.fecha}
        error={errores.fecha}
        onChange={form.handleChange}
        onBlur={form.handleBlur}
        soloLectura={enviando}
        inputRef={form.refDe('fecha')}
      />
      <div className={estilos.horas}>
        <TimeInput
          id="horaInicio"
          nombre="horaInicio"
          etiqueta={TEXTOS.etiquetaHoraInicio}
          horas={form.horasInicio}
          valor={valores.horaInicio}
          error={errores.horaInicio}
          onChange={form.handleChange}
          onBlur={form.handleBlur}
          deshabilitado={enviando}
          inputRef={form.refDe('horaInicio')}
        />
        <TimeInput
          id="horaFin"
          nombre="horaFin"
          etiqueta={TEXTOS.etiquetaHoraFin}
          horas={form.horasFin}
          valor={valores.horaFin}
          error={errores.horaFin}
          onChange={form.handleChange}
          onBlur={form.handleBlur}
          deshabilitado={enviando}
          inputRef={form.refDe('horaFin')}
        />
      </div>
      <p className={estilos.ayudaHorario}>{TEXTOS.ayudaHorario}</p>
      <TextInput
        id="motivo"
        nombre="motivo"
        etiqueta={TEXTOS.etiquetaMotivo}
        valor={valores.motivo}
        error={errores.motivo}
        onChange={form.handleChange}
        onBlur={form.handleBlur}
        soloLectura={enviando}
        multilinea
        inputRef={form.refDe('motivo')}
      />
    </FormularioTarjeta>
  )
}
