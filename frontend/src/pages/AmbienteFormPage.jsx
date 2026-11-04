import AlertMessage from '../components/ui/AlertMessage.jsx'
import FormularioTarjeta from '../components/FormularioTarjeta/FormularioTarjeta.jsx'
import SelectInput from '../components/ui/SelectInput.jsx'
import TextInput from '../components/ui/TextInput.jsx'
import { TEXTOS } from '../constants/messages.js'
import { OPCIONES_ESTADO_AMBIENTE, OPCIONES_TIPO } from '../constants/navegacion.js'
import { useAmbienteForm } from '../hooks/useAmbienteForm.js'

export default function AmbienteFormPage() {
  const form = useAmbienteForm()
  const { valores, errores, enviando } = form

  return (
    <FormularioTarjeta
      titulo={TEXTOS.tituloRegistrarAmbiente}
      textoGuardar={TEXTOS.guardarAmbiente}
      enviando={enviando}
      alerta={form.alerta}
      onSubmit={form.handleSubmit}
      onCancelar={form.cancelar}
    >
      {form.errorResponsables && <AlertMessage tipo="error">{form.errorResponsables}</AlertMessage>}
      <TextInput
        id="nombre"
        nombre="nombre"
        etiqueta={TEXTOS.etiquetaNombre}
        valor={valores.nombre}
        error={errores.nombre}
        onChange={form.handleChange}
        onBlur={form.handleBlur}
        soloLectura={enviando}
        autoComplete="off"
        inputRef={form.refDe('nombre')}
      />
      <SelectInput
        id="tipo"
        nombre="tipo"
        etiqueta={TEXTOS.etiquetaTipo}
        valor={valores.tipo}
        opciones={OPCIONES_TIPO}
        error={errores.tipo}
        onChange={form.handleChange}
        onBlur={form.handleBlur}
        deshabilitado={enviando}
        inputRef={form.refDe('tipo')}
      />
      <TextInput
        id="capacidad"
        nombre="capacidad"
        etiqueta={TEXTOS.etiquetaCapacidad}
        valor={valores.capacidad}
        error={errores.capacidad}
        onChange={form.handleChange}
        onBlur={form.handleBlur}
        soloLectura={enviando}
        inputMode="numeric"
        autoComplete="off"
        inputRef={form.refDe('capacidad')}
      />
      <TextInput
        id="ubicacion"
        nombre="ubicacion"
        etiqueta={TEXTOS.etiquetaUbicacion}
        valor={valores.ubicacion}
        error={errores.ubicacion}
        onChange={form.handleChange}
        onBlur={form.handleBlur}
        soloLectura={enviando}
        autoComplete="off"
        inputRef={form.refDe('ubicacion')}
      />
      <SelectInput
        id="estado"
        nombre="estado"
        etiqueta={TEXTOS.etiquetaEstado}
        valor={valores.estado}
        opciones={OPCIONES_ESTADO_AMBIENTE}
        error={errores.estado}
        onChange={form.handleChange}
        onBlur={form.handleBlur}
        deshabilitado={enviando}
        inputRef={form.refDe('estado')}
      />
      <SelectInput
        id="responsableId"
        nombre="responsableId"
        etiqueta={TEXTOS.etiquetaResponsable}
        valor={valores.responsableId}
        opciones={form.opcionesResponsable}
        error={errores.responsableId}
        onChange={form.handleChange}
        onBlur={form.handleBlur}
        deshabilitado={enviando}
        inputRef={form.refDe('responsableId')}
      />
    </FormularioTarjeta>
  )
}
