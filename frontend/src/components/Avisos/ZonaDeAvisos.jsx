import Aviso from './Aviso.jsx'
import estilos from './Aviso.module.css'

/** La esquina donde se apilan los avisos. Es una región «polite»: el lector de pantalla los anuncia sin interrumpir. */
export default function ZonaDeAvisos({ avisos, alCerrar }) {
  return (
    <div className={estilos.zona} aria-live="polite" aria-relevant="additions">
      {avisos.map((aviso) => (
        <Aviso key={aviso.id} {...aviso} alCerrar={() => alCerrar(aviso.id)} />
      ))}
    </div>
  )
}
