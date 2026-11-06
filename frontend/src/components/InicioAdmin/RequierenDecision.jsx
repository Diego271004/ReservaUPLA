import { Link, useNavigate } from 'react-router-dom'
import Button from '../ui/Button.jsx'
import { Icono } from '../ui/Icono.jsx'
import { TEXTOS, textoMostrando } from '../../constants/messages.js'
import { isoAFecha } from '../../utils/fechas.js'
import estilos from '../../pages/DashboardPage.module.css'

/**
 * «Requieren tu decisión»: las solicitudes pendientes más próximas, cada una con su aviso de choque (RN-01) o de
 * mantenimiento y las acciones Rechazar, Aprobar y Ver detalle. Es lo primero que ve el Administrador: lo urgente arriba.
 */
export default function RequierenDecision({ solicitudes, totalPendientes, alDecidir }) {
  const navigate = useNavigate()

  return (
    <section className={estilos.seccion} aria-labelledby="decisiones-titulo">
      <div className={estilos.encabezadoSeccion}>
        <div>
          <p className={estilos.etiqueta}>
            {solicitudes.length ? `${solicitudes.length} por atender` : 'Al día'}
          </p>
          <h2 id="decisiones-titulo">{TEXTOS.requierenDecision}</h2>
        </div>
        {totalPendientes > 0 && (
          <Link className={estilos.verTodas} to="/reservas?estado=Pendiente">
            {TEXTOS.verTodas}
          </Link>
        )}
      </div>
      {solicitudes.length === 0 ? (
        <div className={estilos.vacio}>
          <Icono nombre="exito" />
          <p>{TEXTOS.sinPendientes}</p>
        </div>
      ) : (
        <div className={estilos.tarjetasDecision}>
          {solicitudes.map(({ reserva, choqueAprobada, ambienteEnMantenimiento }) => {
            const de = `${reserva.ambienteNombre}, ${isoAFecha(reserva.fecha)}`
            return (
              <article className={estilos.tarjetaDecision} key={reserva.id}>
                <div>
                  <p className={estilos.ambiente}>{reserva.ambienteNombre}</p>
                  <p className={estilos.datos}>
                    <Icono nombre="calendario" />
                    {isoAFecha(reserva.fecha)}
                  </p>
                  <p className={estilos.datos}>
                    <Icono nombre="reloj" />
                    {reserva.horaInicio} – {reserva.horaFin}
                  </p>
                  <p className={estilos.solicitante}>{reserva.solicitanteNombre}</p>
                </div>
                {(choqueAprobada || ambienteEnMantenimiento) && (
                  <div className={estilos.advertencias}>
                    {choqueAprobada && (
                      <p>
                        <Icono nombre="aviso" />
                        {TEXTOS.conflictoAprobada}
                      </p>
                    )}
                    {ambienteEnMantenimiento && (
                      <p>
                        <Icono nombre="aviso" />
                        {TEXTOS.ambienteEnMantenimientoAviso}
                      </p>
                    )}
                  </div>
                )}
                <div className={estilos.acciones}>
                  <Button
                    variante="rechazar"
                    aria-label={`${TEXTOS.rechazar}: ${de}`}
                    onClick={() => alDecidir('rechazar', reserva)}
                  >
                    {TEXTOS.rechazar}
                  </Button>
                  <Button
                    aria-label={`${TEXTOS.aprobar}: ${de}`}
                    onClick={() => alDecidir('aprobar', reserva)}
                  >
                    {TEXTOS.aprobar}
                  </Button>
                  <Button
                    variante="enlace"
                    aria-label={`${TEXTOS.verDetalle}: ${de}`}
                    onClick={() =>
                      navigate(`/reservas/${reserva.id}`, { state: { volverA: '/dashboard' } })
                    }
                  >
                    {TEXTOS.verDetalle}
                  </Button>
                </div>
              </article>
            )
          })}
        </div>
      )}
      {totalPendientes > 0 && (
        <p className={estilos.piePagina} role="status">
          {textoMostrando(solicitudes.length, totalPendientes)}
        </p>
      )}
    </section>
  )
}
