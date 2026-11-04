import { Icono, IconoError } from './Icono.jsx'
import estilos from './AlertMessage.module.css'

const ICONO_POR_TIPO = { exito: 'exito', aviso: 'aviso', info: 'info' }

/**
 * Mensaje de éxito, error, aviso o información: siempre icono + texto (el significado nunca depende solo
 * del color). El error usa el icono único IconoError y se anuncia con role="alert"; el resto con "status".
 */
export default function AlertMessage({ tipo = 'info', children, id }) {
  return (
    <div
      id={id}
      role={tipo === 'error' ? 'alert' : 'status'}
      className={`${estilos.alerta} ${estilos[tipo]}`}
    >
      {tipo === 'error' ? (
        <IconoError className={estilos.icono} />
      ) : (
        <Icono nombre={ICONO_POR_TIPO[tipo]} className={estilos.icono} />
      )}
      <span>{children}</span>
    </div>
  )
}
