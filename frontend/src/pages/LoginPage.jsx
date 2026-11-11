import { Navigate } from 'react-router-dom'
import AlertMessage from '../components/ui/AlertMessage.jsx'
import Button from '../components/ui/Button.jsx'
import { Icono } from '../components/ui/Icono.jsx'
import InterruptorDeTema from '../components/ui/InterruptorDeTema.jsx'
import PasswordInput from '../components/ui/PasswordInput.jsx'
import TextInput from '../components/ui/TextInput.jsx'
import { MENSAJES, TEXTOS } from '../constants/messages.js'
import { RUTA_INICIAL_POR_ROL } from '../constants/navegacion.js'
import { useAuth } from '../context/AuthContext.jsx'
import { useLoginForm } from '../hooks/useLoginForm.js'
import { useParalaje } from '../hooks/useParalaje.js'
import logo from '../assets/logo-upla-login.webp'
import estilos from './LoginPage.module.css'

export default function LoginPage() {
  const { sesion, sesionTerminada } = useAuth()
  const form = useLoginForm()
  const panel = useParalaje()

  if (sesion) return <Navigate to={RUTA_INICIAL_POR_ROL[sesion.rol] ?? '/'} replace />

  const { enviando } = form

  return (
    <div className={estilos.pagina}>
      <aside className={estilos.panel} ref={panel}>
        <div className={estilos.foto} aria-hidden="true">
          <div className={estilos.fotoImagen} />
        </div>
        <div className={estilos.velo} aria-hidden="true" />
        <svg
          className={estilos.hexagonos}
          viewBox="0 0 320 300"
          aria-hidden="true"
          focusable="false"
        >
          <g className={estilos.hexLejano}>
            <path d="M210 14 262 44v60l-52 30-52-30V44z" />
          </g>
          <g className={estilos.hexMedio}>
            <path d="M120 120 180 155v70l-60 35-60-35v-70z" />
          </g>
          <g className={estilos.hexCercano}>
            <path d="M262 168 306 194v52l-44 26-44-26v-52z" />
          </g>
        </svg>
        <div className={estilos.texto}>
          <p className={estilos.universidad}>{TEXTOS.universidad}</p>
          <div data-testid="encabezado-panel">
            <p className={estilos.marca}>{TEXTOS.nombreProducto}</p>
            <p className={estilos.lema}>{TEXTOS.lemaLogin}</p>
          </div>
          <ul className={estilos.chips} aria-label={TEXTOS.loginEspacios}>
            <li>
              <Icono nombre="laboratorio" tamano={18} />
              {TEXTOS.loginLaboratorios}
            </li>
            <li>
              <Icono nombre="auditorio" tamano={18} />
              {TEXTOS.loginAuditorios}
            </li>
            <li>
              <Icono nombre="sala" tamano={18} />
              {TEXTOS.loginSalas}
            </li>
          </ul>
        </div>
      </aside>
      <main className={estilos.contenido}>
        <div className={estilos.tarjeta}>
          <span className={estilos.logo}>
            <img src={logo} width="138" height="160" alt={TEXTOS.universidad} />
          </span>
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
              {...form.campoDeTexto('correo')}
              etiqueta={TEXTOS.etiquetaCorreo}
              ayuda={TEXTOS.ayudaCorreo}
              tipo="email"
              autoComplete="username"
            />
            <PasswordInput
              {...form.campoDeTexto('contrasena')}
              etiqueta={TEXTOS.etiquetaContrasena}
              aviso={form.bloqMayusActivo ? TEXTOS.avisoBloqMayus : undefined}
              onKeyDown={form.handleBloqMayus}
              onKeyUp={form.handleBloqMayus}
              onMouseDown={form.handleBloqMayus}
              mostrando={form.mostrarContrasena}
              onAlternar={form.alternarMostrarContrasena}
              autoComplete="current-password"
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
        </div>
        <InterruptorDeTema className={estilos.interruptor} />
      </main>
    </div>
  )
}
