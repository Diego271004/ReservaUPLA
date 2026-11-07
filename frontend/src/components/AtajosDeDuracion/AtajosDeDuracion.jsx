import { TEXTOS } from '../../constants/messages.js'
import { horaFinDeDuracion } from '../../utils/resumenDeSolicitud.js'
import Button from '../ui/Button.jsx'
import estilos from './AtajosDeDuracion.module.css'

const DURACIONES = [1, 2, 3]

/**
 * Atajos de duración (1 h, 2 h, 3 h): los tres siempre en una fila (cuadrícula de tres
 * columnas iguales de 44 px de alto), también a 375 y 188 px.
 */
export default function AtajosDeDuracion({ horaInicio, horaFin, alElegir }) {
  const sinInicio = !horaInicio
  const idAyuda = 'ayuda-atajos-inicio'

  return (
    <div
      className={estilos.contenedor}
      role="group"
      aria-label="Duración de la reserva"
      aria-describedby={sinInicio ? idAyuda : undefined}
    >
      <span className={estilos.titulo}>Duración</span>
      <div className={estilos.cuadricula}>
        {DURACIONES.map((horas) => {
          const fin = horaFinDeDuracion(horaInicio, horas)
          const elegida = Boolean(horaInicio) && fin !== null && fin === horaFin
          return (
            <Button
              key={horas}
              variante="secundario"
              aria-pressed={elegida}
              deshabilitado={sinInicio || fin === null}
              aria-describedby={sinInicio ? idAyuda : undefined}
              title={
                sinInicio
                  ? 'Elige primero la hora de inicio'
                  : fin === null
                    ? 'Pasaría de las 22:00'
                    : undefined
              }
              className={`${estilos.boton} ${elegida ? estilos.elegida : ''}`}
              onClick={() => alElegir(horaInicio, fin)}
            >
              {horas} h
            </Button>
          )
        })}
      </div>
      {sinInicio && (
        <p id={idAyuda} className={estilos.ayuda}>
          {TEXTOS.atajosAyudaHoraInicio}
        </p>
      )}
    </div>
  )
}
