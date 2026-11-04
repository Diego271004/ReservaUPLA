import { MENSAJES } from '../constants/messages'
import { ESTADOS_SALUD, useSalud } from '../hooks/useSalud'
import estilos from './InicioPage.module.css'

const TEXTO_POR_ESTADO = {
  [ESTADOS_SALUD.cargando]: MENSAJES.salud.cargando,
  [ESTADOS_SALUD.disponible]: MENSAJES.salud.disponible,
  [ESTADOS_SALUD.sinConexion]: MENSAJES.salud.sinConexion,
}

export default function InicioPage() {
  const estado = useSalud()

  return (
    <>
      <h1>{MENSAJES.salud.titulo}</h1>
      <p
        role={estado === ESTADOS_SALUD.sinConexion ? 'alert' : 'status'}
        className={`${estilos.estado} ${estilos[estado]}`}
      >
        {TEXTO_POR_ESTADO[estado]}
      </p>
    </>
  )
}
