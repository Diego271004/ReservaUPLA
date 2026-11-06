import { Icono } from '../ui/Icono.jsx'
import { TEXTOS } from '../../constants/messages.js'
import { minutosDeHora } from '../../utils/fechas.js'
import estilos from '../../pages/DashboardPage.module.css'

const HORAS_DEL_EJE = [7, 9, 11, 13, 15, 17, 19, 21]
const INICIO_MINUTOS = 420
const DURACION_MINUTOS = 900

const posicion = (minutos) => `${((minutos - INICIO_MINUTOS) / DURACION_MINUTOS) * 100}%`
const dosDigitos = (hora) => hora.toString().padStart(2, '0')
/** Centra una etiqueta ancha (unos 5,5 rem) sobre `porcentaje` sin dejar que se salga del carril por ninguno de los dos lados. */
const dentroDelCarril = (porcentaje) => `clamp(2.75rem, ${porcentaje}, calc(100% - 2.75rem))`

/**
 * «Hoy en los ambientes»: una línea de tiempo de 07:00 a 22:00 por ambiente con sus reservas aprobadas de hoy, el eje de horas
 * y la hora actual marcada en su propio carril (sin pisar las etiquetas del eje).
 */
export default function AgendaDeHoy({ ambientes, horaActual }) {
  const hayAhora = horaActual >= 7 && horaActual <= 22

  return (
    <section className={estilos.seccion} aria-labelledby="agenda-titulo">
      <h2 id="agenda-titulo">{TEXTOS.hoyEnAmbientes}</h2>
      <div className={estilos.agenda}>
        {ambientes?.length ? (
          <>
            <div className={estilos.agendaEncabezado}>
              <span aria-hidden="true" />
              <div className={estilos.carrilEje} aria-label="Carril del eje de horas">
                {HORAS_DEL_EJE.map((hora) => (
                  <span
                    key={hora}
                    className={estilos.etiquetaHora}
                    style={{ left: posicion(hora * 60) }}
                  >
                    {dosDigitos(hora)}:00
                  </span>
                ))}
              </div>
              {hayAhora && (
                <div className={estilos.carrilAhora} aria-label="Carril de la hora actual">
                  <span
                    aria-label={`Ahora ${dosDigitos(horaActual)}:00`}
                    style={{ left: dentroDelCarril(posicion(horaActual * 60)) }}
                  >
                    Ahora {dosDigitos(horaActual)}:00
                  </span>
                </div>
              )}
            </div>
            {ambientes.map((ambiente) => (
              <div className={estilos.filaAgenda} key={ambiente.id}>
                <span className={estilos.nombreAmbiente}>{ambiente.nombre}</span>
                <div className={estilos.lineaTiempo}>
                  {ambiente.reservas?.length
                    ? ambiente.reservas.map((reserva) => {
                        const inicio = minutosDeHora(reserva.horaInicio) ?? INICIO_MINUTOS
                        const fin = minutosDeHora(reserva.horaFin) ?? INICIO_MINUTOS
                        return (
                          <span
                            key={reserva.id}
                            className={estilos.bloqueAprobado}
                            style={{
                              left: posicion(inicio),
                              width: `${((fin - inicio) / DURACION_MINUTOS) * 100}%`,
                            }}
                            title={`${reserva.horaInicio}–${reserva.horaFin}: ${reserva.solicitanteNombre}`}
                            role="img"
                            aria-label={`${reserva.horaInicio} a ${reserva.horaFin}, ${reserva.solicitanteNombre}`}
                          >
                            <span aria-hidden="true">
                              {reserva.horaInicio}–{reserva.horaFin}
                            </span>
                            <span className="solo-lector">
                              {reserva.horaInicio} a {reserva.horaFin}, {reserva.solicitanteNombre}
                            </span>
                          </span>
                        )
                      })
                    : ambiente.estado !== 'En mantenimiento' && (
                        <span className={estilos.sinReservasHoy}>Sin reservas aprobadas hoy</span>
                      )}
                  {ambiente.estado === 'En mantenimiento' && (
                    <span className={estilos.mantenimiento}>
                      <Icono nombre="aviso" />
                      Mantenimiento
                    </span>
                  )}
                  {hayAhora && (
                    <span
                      className={estilos.horaActual}
                      style={{ left: posicion(horaActual * 60) }}
                      aria-hidden="true"
                    />
                  )}
                </div>
              </div>
            ))}
          </>
        ) : (
          <p>{TEXTOS.noHayDatos}</p>
        )}
      </div>
    </section>
  )
}
