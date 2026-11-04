import { Navigate } from 'react-router-dom'
import AlertMessage from '../components/ui/AlertMessage.jsx'
import Button from '../components/ui/Button.jsx'
import PasswordInput from '../components/ui/PasswordInput.jsx'
import TextInput from '../components/ui/TextInput.jsx'
import { MENSAJES, TEXTOS } from '../constants/messages.js'
import { RUTA_INICIAL_POR_ROL } from '../constants/navegacion.js'
import { useAuth } from '../context/AuthContext.jsx'
import { useLoginForm } from '../hooks/useLoginForm.js'
import estilos from './LoginPage.module.css'

export default function LoginPage() {
  const { sesion, sesionTerminada } = useAuth()
  const form = useLoginForm()

  // Quien ya tiene sesión no necesita volver a iniciarla.
  if (sesion) return <Navigate to={RUTA_INICIAL_POR_ROL[sesion.rol] ?? '/'} replace />

  const { valores, errores, enviando } = form

  return (
    <div className={estilos.pagina}>
      <aside className={estilos.panel}>
        <div data-testid="encabezado-panel">
          <p className={estilos.marca}>{TEXTOS.nombreProducto}</p>
          <p className={estilos.lema}>{TEXTOS.lemaLogin}</p>
        </div>
        <p className={estilos.universidad}>{TEXTOS.universidad}</p>
      </aside>
      <main className={estilos.contenido}>
        <form className={estilos.formulario} onSubmit={form.handleSubmit} noValidate>
          <h1>{TEXTOS.tituloLogin}</h1>
          <p className={estilos.subtitulo}>{TEXTOS.subtituloLogin}</p>

          {sesionTerminada && !form.alerta && (
            <AlertMessage tipo="info">{MENSAJES.sesionTerminada}</AlertMessage>
          )}
          {form.alerta && (
            <AlertMessage tipo={form.alerta.tipo}>{form.alerta.mensaje}</AlertMessage>
          )}

          <TextInput
            id="correo"
            nombre="correo"
            etiqueta={TEXTOS.etiquetaCorreo}
            ayuda={TEXTOS.ayudaCorreo}
            valor={valores.correo}
            error={errores.correo}
            onChange={form.handleChange}
            onBlur={form.handleBlur}
            soloLectura={enviando}
            tipo="email"
            autoComplete="username"
            inputRef={form.refDe('correo')}
          />
          <PasswordInput
            id="contrasena"
            nombre="contrasena"
            etiqueta={TEXTOS.etiquetaContrasena}
            valor={valores.contrasena}
            error={errores.contrasena}
            aviso={form.bloqMayusActivo ? TEXTOS.avisoBloqMayus : undefined}
            onChange={form.handleChange}
            onBlur={form.handleBlur}
            onKeyDown={form.handleBloqMayus}
            onKeyUp={form.handleBloqMayus}
            onMouseDown={form.handleBloqMayus}
            soloLectura={enviando}
            mostrando={form.mostrarContrasena}
            onAlternar={form.alternarMostrarContrasena}
            autoComplete="current-password"
            inputRef={form.refDe('contrasena')}
          />

          <div className={estilos.boton}>
            <Button tipo="submit" cargando={enviando} textoCarga={TEXTOS.verificandoCredenciales}>
              {TEXTOS.botonIngresar}
            </Button>
          </div>
          {enviando && (
            <div className={estilos.centrado}>
              <Button variante="enlace" onClick={form.cancelarEnvio}>
                {TEXTOS.cancelar}
              </Button>
            </div>
          )}

          <div className={estilos.centrado}>
            <Button
              variante="enlace"
              onClick={form.alternarAyudaSoporte}
              aria-expanded={form.ayudaSoporteVisible}
              aria-controls="ayuda-soporte"
            >
              {TEXTOS.olvidasteContrasena}
            </Button>
          </div>
          {form.ayudaSoporteVisible && (
            <div id="ayuda-soporte">
              <AlertMessage tipo="info">{TEXTOS.ayudaSoporte}</AlertMessage>
            </div>
          )}
        </form>
      </main>
    </div>
  )
}
