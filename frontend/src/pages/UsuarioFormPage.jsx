import FormularioTarjeta from '../components/FormularioTarjeta/FormularioTarjeta.jsx'
import PasswordInput from '../components/ui/PasswordInput.jsx'
import SelectInput from '../components/ui/SelectInput.jsx'
import TextInput from '../components/ui/TextInput.jsx'
import { TEXTOS } from '../constants/messages.js'
import { OPCIONES_ROL } from '../constants/navegacion.js'
import { useUsuarioForm } from '../hooks/useUsuarioForm.js'
import { useState } from 'react'
import InterruptorActivo from '../components/ui/InterruptorActivo.jsx'

export default function UsuarioFormPage() {
  const form = useUsuarioForm()
  const [mostrarContrasena, setMostrarContrasena] = useState(false)
  const { valores, errores, enviando } = form

  return (
    <FormularioTarjeta
      titulo={TEXTOS.tituloRegistrarUsuario}
      textoGuardar={TEXTOS.guardarUsuario}
      enviando={enviando}
      alerta={form.alerta}
      onSubmit={form.handleSubmit}
      onCancelar={form.cancelar}
    >
      <TextInput
        id="nombreCompleto"
        nombre="nombreCompleto"
        etiqueta={TEXTOS.etiquetaNombreCompleto}
        valor={valores.nombreCompleto}
        error={errores.nombreCompleto}
        onChange={form.handleChange}
        onBlur={form.handleBlur}
        soloLectura={enviando}
        autoComplete="off"
        inputRef={form.refDe('nombreCompleto')}
      />
      <TextInput
        id="correo"
        nombre="correo"
        etiqueta="Correo institucional"
        ayuda={TEXTOS.ayudaCorreo}
        valor={valores.correo}
        error={errores.correo}
        onChange={form.handleChange}
        onBlur={form.handleBlur}
        soloLectura={enviando}
        tipo="email"
        autoComplete="off"
        inputRef={form.refDe('correo')}
      />
      <SelectInput
        id="rol"
        nombre="rol"
        etiqueta={TEXTOS.etiquetaRol}
        valor={valores.rol}
        opciones={OPCIONES_ROL}
        error={errores.rol}
        onChange={form.handleChange}
        onBlur={form.handleBlur}
        deshabilitado={enviando}
        inputRef={form.refDe('rol')}
      />
      <InterruptorActivo
        id="activo"
        nombre="activo"
        etiqueta={TEXTOS.etiquetaActivo}
        activo={valores.activo}
        onChange={form.handleChange}
        deshabilitado={enviando}
      />
      <PasswordInput
        id="contrasena"
        nombre="contrasena"
        etiqueta={TEXTOS.etiquetaContrasenaInicial}
        valor={valores.contrasena}
        error={errores.contrasena}
        onChange={form.handleChange}
        onBlur={form.handleBlur}
        soloLectura={enviando}
        mostrando={mostrarContrasena}
        onAlternar={() => setMostrarContrasena((visible) => !visible)}
        autoComplete="new-password"
        inputRef={form.refDe('contrasena')}
      />
    </FormularioTarjeta>
  )
}
