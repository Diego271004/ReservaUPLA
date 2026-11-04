import { TEXTOS } from '../../constants/messages.js'
import AlertMessage from '../ui/AlertMessage.jsx'
import Button from '../ui/Button.jsx'

/** El aviso rojo de «no se pudo cargar» con el enlace «Reintentar»: el mismo en todas las pantallas que cargan una lista. */
export default function AvisoDeError({ mensaje, alReintentar }) {
  return (
    <AlertMessage tipo="error">
      {mensaje}{' '}
      <Button variante="enlace" onClick={alReintentar}>
        {TEXTOS.reintentar}
      </Button>
    </AlertMessage>
  )
}
