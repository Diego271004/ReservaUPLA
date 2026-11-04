import FormularioTarjeta from '../components/FormularioTarjeta/FormularioTarjeta.jsx'
import AlertMessage from '../components/ui/AlertMessage.jsx'
import SelectInput from '../components/ui/SelectInput.jsx'
import TextInput from '../components/ui/TextInput.jsx'
import { TEXTOS } from '../constants/messages.js'
import { OPCIONES_ESTADO_AMBIENTE, OPCIONES_TIPO } from '../constants/navegacion.js'
import { useAmbienteForm } from '../hooks/useAmbienteForm.js'

export default function AmbienteFormPage() {
  const form = useAmbienteForm()

  return (
    <FormularioTarjeta
      titulo={TEXTOS.tituloRegistrarAmbiente}
      textoGuardar={TEXTOS.registrarAmbiente}
      textoSecundario={TEXTOS.volver}
      enviando={form.enviando}
      alerta={form.alerta}
      onSubmit={form.handleSubmit}
      onCancelar={form.cancelar}
    >
      {form.errorResponsables && <AlertMessage tipo="error">{form.errorResponsables}</AlertMessage>}
      <TextInput
        {...form.campoDeTexto('nombre')}
        etiqueta={TEXTOS.etiquetaNombre}
        autoComplete="off"
      />
      <SelectInput
        {...form.campoDeLista('tipo')}
        etiqueta={TEXTOS.etiquetaTipo}
        opciones={OPCIONES_TIPO}
      />
      <TextInput
        {...form.campoDeTexto('capacidad')}
        etiqueta={TEXTOS.etiquetaCapacidad}
        inputMode="numeric"
        autoComplete="off"
      />
      <TextInput
        {...form.campoDeTexto('ubicacion')}
        etiqueta={TEXTOS.etiquetaUbicacion}
        autoComplete="off"
      />
      <SelectInput
        {...form.campoDeLista('estado')}
        etiqueta={TEXTOS.etiquetaEstado}
        opciones={OPCIONES_ESTADO_AMBIENTE}
      />
      <SelectInput
        {...form.campoDeLista('responsableId')}
        etiqueta={TEXTOS.etiquetaResponsable}
        opciones={form.opcionesResponsable}
      />
    </FormularioTarjeta>
  )
}
