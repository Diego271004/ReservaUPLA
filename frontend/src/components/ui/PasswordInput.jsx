import { TEXTOS } from '../../constants/messages.js'
import TextInput from './TextInput.jsx'
import estilos from './PasswordInput.module.css'

/** Campo de contraseña: TextInput con el botón Mostrar / Ocultar dentro de la caja. */
export default function PasswordInput({ mostrando, onAlternar, ...resto }) {
  return (
    <TextInput
      {...resto}
      tipo={mostrando ? 'text' : 'password'}
      accion={
        <button
          type="button"
          className={estilos.alternar}
          onClick={onAlternar}
          aria-pressed={mostrando}
          aria-label={`${mostrando ? TEXTOS.ocultar : TEXTOS.mostrar} ${resto.etiqueta.toLowerCase()}`}
          disabled={resto.deshabilitado || resto.soloLectura}
        >
          {mostrando ? TEXTOS.ocultar : TEXTOS.mostrar}
        </button>
      }
    />
  )
}
