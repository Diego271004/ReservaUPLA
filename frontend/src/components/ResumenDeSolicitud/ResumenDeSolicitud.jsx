import { TEXTOS } from '../../constants/messages.js'
import { fechaLarga, textoDeDuracion } from '../../utils/resumenDeSolicitud.js'
import { Icono } from '../ui/Icono.jsx'
import estilos from './ResumenDeSolicitud.module.css'

const SIN_ELEGIR = 'Sin elegir'

/**
 * El resumen vivo de la solicitud (panel de la derecha en Nueva reserva): muestra lo que se va eligiendo para que el
 * usuario vea el resultado antes de enviar y no tenga que recordar lo que escribió (Norman: retroalimentación; Nielsen 6:
 * reconocer en vez de recordar). Es solo lectura: se anuncia con aria-live="polite" sin interrumpir lo que se escribe.
 */
export default function ResumenDeSolicitud({ ambiente, fecha, horaInicio, horaFin, motivo }) {
  const duracion = textoDeDuracion(horaInicio, horaFin)
  const fechaTexto = fechaLarga(fecha)
  const filas = [
    {
      clave: 'ambiente',
      icono: 'ambientes',
      titulo: TEXTOS.etiquetaAmbiente,
      valor: ambiente?.nombre,
      detalle: ambiente?.detalle,
    },
    { clave: 'fecha', icono: 'calendario', titulo: TEXTOS.etiquetaFecha, valor: fechaTexto },
    {
      clave: 'horario',
      icono: 'reloj',
      titulo: 'Horario',
      valor: horaInicio && horaFin ? `${horaInicio} – ${horaFin}` : null,
      detalle: duracion,
    },
    {
      clave: 'motivo',
      icono: 'reservas',
      titulo: TEXTOS.etiquetaMotivo,
      valor: motivo.trim() || null,
    },
  ]

  return (
    <aside className={estilos.resumen} aria-label="Resumen de tu solicitud">
      <h2>Resumen de tu solicitud</h2>
      <dl aria-live="polite">
        {filas.map((fila) => (
          <div key={fila.clave} className={estilos.fila}>
            <dt>
              <Icono nombre={fila.icono} className={estilos.icono} />
              {fila.titulo}
            </dt>
            <dd className={fila.valor ? estilos.elegido : estilos.pendiente}>
              {fila.valor ?? SIN_ELEGIR}
              {fila.valor && fila.detalle && (
                <span className={estilos.detalle}>{fila.detalle}</span>
              )}
            </dd>
          </div>
        ))}
      </dl>
      <p className={estilos.nota}>
        <Icono nombre="info" className={estilos.icono} />
        <span>
          La solicitud se envía como <strong>Pendiente</strong> y el administrador la aprueba o la
          rechaza.
        </span>
      </p>
    </aside>
  )
}
