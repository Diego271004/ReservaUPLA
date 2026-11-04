import { TEXTOS } from '../../constants/messages.js'
import AlertMessage from '../ui/AlertMessage.jsx'
import Button from '../ui/Button.jsx'
import estilos from './FormularioTarjeta.module.css'

/**
 * Estructura común de las pantallas de registro (usuario, ambiente, reserva): título, tarjeta con el
 * formulario, mensaje de error y el grupo de botones (el secundario sale sin enviar —«Volver» o «Limpiar formulario»— y el primario va a la derecha).
 */
export default function FormularioTarjeta({
  titulo,
  textoGuardar,
  textoSecundario,
  enviando,
  alerta,
  onSubmit,
  onCancelar,
  children,
}) {
  return (
    <>
      <h1>{titulo}</h1>
      <form className={estilos.tarjeta} onSubmit={onSubmit} noValidate>
        {alerta && <AlertMessage tipo={alerta.tipo}>{alerta.mensaje}</AlertMessage>}
        {children}
        <div className={estilos.acciones}>
          <Button variante="secundario" onClick={onCancelar} deshabilitado={enviando}>
            {textoSecundario}
          </Button>
          <Button
            variante="primario"
            tipo="submit"
            cargando={enviando}
            textoCarga={TEXTOS.guardando}
          >
            {textoGuardar}
          </Button>
        </div>
      </form>
    </>
  )
}
