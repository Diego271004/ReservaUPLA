import { TEXTOS } from '../../constants/messages.js'
import AlertMessage from '../ui/AlertMessage.jsx'
import Button from '../ui/Button.jsx'
import PageHeader from '../ui/PageHeader.jsx'
import estilos from './FormularioTarjeta.module.css'

/**
 * Estructura común de las pantallas de registro (usuario, ambiente, reserva): título, tarjeta con el
 * formulario (con un panel `lateral` opcional a su derecha, como el resumen de Nueva reserva), mensaje de error y el grupo de botones (el secundario sale sin enviar —«Volver» o «Limpiar formulario»— y el primario va a la derecha).
 */
export default function FormularioTarjeta({
  titulo,
  textoGuardar,
  textoSecundario,
  enviando,
  alerta,
  onSubmit,
  onCancelar,
  lateral = null,
  barraInferior = null,
  children,
}) {
  return (
    <>
      <PageHeader titulo={titulo} />
      <div className={lateral ? estilos.conLateral : undefined}>
        <form className={estilos.tarjeta} onSubmit={onSubmit} noValidate>
          {alerta && <AlertMessage tipo={alerta.tipo}>{alerta.mensaje}</AlertMessage>}
          {children}
          {barraInferior}
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
        {lateral}
      </div>
    </>
  )
}
