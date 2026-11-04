import { useState } from 'react'
import FormularioTarjeta from '../components/FormularioTarjeta/FormularioTarjeta.jsx'
import InterruptorActivo from '../components/ui/InterruptorActivo.jsx'
import PasswordInput from '../components/ui/PasswordInput.jsx'
import SelectInput from '../components/ui/SelectInput.jsx'
import TextInput from '../components/ui/TextInput.jsx'
import { TEXTOS } from '../constants/messages.js'
import { OPCIONES_ROL } from '../constants/navegacion.js'
import { useUsuarioForm } from '../hooks/useUsuarioForm.js'

export default function UsuarioFormPage() {
  const form = useUsuarioForm()
  const [mostrarContrasena, setMostrarContrasena] = useState(false)

  return (
    <FormularioTarjeta
      titulo={TEXTOS.tituloRegistrarUsuario}
      textoGuardar={TEXTOS.guardarUsuario}
      enviando={form.enviando}
      alerta={form.alerta}
      onSubmit={form.handleSubmit}
      onCancelar={form.cancelar}
    >
      <TextInput
        {...form.campoDeTexto('nombreCompleto')}
        etiqueta={TEXTOS.etiquetaNombreCompleto}
        autoComplete="off"
      />
      <TextInput
        {...form.campoDeTexto('correo')}
        etiqueta="Correo institucional"
        ayuda={TEXTOS.ayudaCorreo}
        tipo="email"
        autoComplete="off"
      />
      <SelectInput
        {...form.campoDeLista('rol')}
        etiqueta={TEXTOS.etiquetaRol}
        opciones={OPCIONES_ROL}
      />
      <InterruptorActivo
        id="activo"
        nombre="activo"
        etiqueta={TEXTOS.etiquetaActivo}
        activo={form.valores.activo}
        onChange={form.handleChange}
        deshabilitado={form.enviando}
      />
      <PasswordInput
        {...form.campoDeTexto('contrasena')}
        etiqueta={TEXTOS.etiquetaContrasenaInicial}
        ayuda={form.errores.contrasena ? undefined : TEXTOS.ayudaContrasenaInicial}
        mostrando={mostrarContrasena}
        onAlternar={() => setMostrarContrasena((visible) => !visible)}
        autoComplete="new-password"
      />
    </FormularioTarjeta>
  )
}
