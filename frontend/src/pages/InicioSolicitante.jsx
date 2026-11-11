import { Link, useNavigate } from 'react-router-dom'
import AlertMessage from '../components/ui/AlertMessage.jsx'
import AvisoDeError from '../components/AvisoDeError/AvisoDeError.jsx'
import Button from '../components/ui/Button.jsx'
import ModalDeReserva from '../components/ModalDeReserva/ModalDeReserva.jsx'
import { Icono } from '../components/ui/Icono.jsx'
import Insignia from '../components/ui/Insignia.jsx'
import EsqueletoDeInicio from '../components/ui/EsqueletoDeInicio.jsx'
import PortadaDeInicio from '../components/ui/PortadaDeInicio.jsx'
import { useDecisionDeReserva } from '../hooks/useDecisionDeReserva.js'
import { useCarga } from '../hooks/useCarga.js'
import { obtenerDashboard } from '../services/recursosService.js'
import { isoAFecha, hoy } from '../utils/fechas.js'
import { TIPO_INSIGNIA_DE_ESTADO } from '../utils/reservas.js'
import { fechaLarga } from '../utils/resumenDeSolicitud.js'
import estilos from './InicioSolicitante.module.css'

const puedeCancelar = (estado) => estado === 'Pendiente' || estado === 'Aprobada'
const tipoInsignia = (estado) => TIPO_INSIGNIA_DE_ESTADO[estado] ?? 'neutro'

const iconoPorEstado = (estado) =>
  ({
    Pendiente: 'reloj',
    Aprobada: 'exito',
    Rechazada: 'equis',
    Cancelada: 'calendario',
  })[estado] ?? 'calendario'

const tonoPorEstado = (estado) =>
  ({
    Pendiente: 'aviso',
    Aprobada: 'exito',
    Rechazada: 'error',
    Cancelada: 'neutro',
  })[estado] ?? 'info'

const VACIO = Object.freeze({ inicioSolicitante: null })

export default function InicioSolicitante({ ahora = new Date() }) {
  const navigate = useNavigate()
  const { datos, cargando, error, recargar } = useCarga(obtenerDashboard, VACIO)
  const decision = useDecisionDeReserva(recargar)

  if (error) return <AvisoDeError mensaje={error} alReintentar={recargar} />
  if (cargando) return <EsqueletoDeInicio />

  const inicio = datos.inicioSolicitante
  const proxima = inicio?.proximaReserva
  const resumen = inicio?.resumenPorEstado ?? []
  const solicitudes = inicio?.solicitudes ?? []
  const fechaHoy = fechaLarga(hoy(ahora))

  return (
    <>
      {decision.alerta && (
        <AlertMessage tipo={decision.alerta.tipo}>{decision.alerta.mensaje}</AlertMessage>
      )}

      <div className={estilos.contenedorInicio}>
        <PortadaDeInicio
          id="portada-solicitante-titulo"
          fecha={fechaHoy}
          titulo={proxima ? 'Tienes una reserva programada' : 'Todo listo para tu próxima reserva'}
          detalle={
            proxima
              ? `${proxima.ambienteNombre} · ${proxima.horaInicio} a ${proxima.horaFin}`
              : 'No tienes reservas próximas. Elige un ambiente para comenzar.'
          }
        />

        {proxima ? (
          <section className={estilos.seccion} aria-labelledby="proxima-titulo">
            <div className={estilos.cabeceraSeccion}>
              <h2 id="proxima-titulo">Tu próxima reserva</h2>
              <Insignia tipo={tipoInsignia(proxima.estado)}>{proxima.estado}</Insignia>
            </div>
            <article className={estilos.tarjetaProxima}>
              <div className={estilos.cuerpoProxima}>
                <div className={estilos.iconoAmbiente} aria-hidden="true">
                  <Icono nombre="ambientes" tamano={24} />
                </div>
                <div className={estilos.infoProxima}>
                  <h3 className={estilos.nombreAmbiente}>{proxima.ambienteNombre}</h3>
                  <div className={estilos.datosReserva}>
                    <span>
                      <Icono nombre="calendario" tamano={16} />
                      {isoAFecha(proxima.fecha)}
                    </span>
                    <span>
                      <Icono nombre="reloj" tamano={16} />
                      {proxima.horaInicio} – {proxima.horaFin}
                    </span>
                    {proxima.motivo && (
                      <span className={estilos.motivoReserva}>{proxima.motivo}</span>
                    )}
                  </div>
                </div>
              </div>
              <div className={estilos.accionesReserva}>
                <Button
                  variante="secundario"
                  onClick={() =>
                    navigate(`/reservas/${proxima.id}`, { state: { volverA: '/dashboard' } })
                  }
                >
                  Ver detalle
                </Button>
                {puedeCancelar(proxima.estado) && (
                  <Button variante="rechazar" onClick={() => decision.abrir('cancelar', proxima)}>
                    Cancelar reserva
                  </Button>
                )}
              </div>
            </article>
          </section>
        ) : (
          <section className={estilos.seccion} aria-labelledby="proxima-titulo">
            <h2 id="proxima-titulo">Tu próxima reserva</h2>
            <div className={estilos.vacio}>
              <Icono nombre="calendario" tamano={32} />
              <p className={estilos.vacioTitulo}>No tienes una próxima reserva.</p>
              <p className={estilos.vacioTexto}>
                No tienes reservas próximas. Elige un ambiente para comenzar.
              </p>
              <Button onClick={() => navigate('/reservas/nueva')}>Reservar un ambiente</Button>
            </div>
          </section>
        )}

        <section className={estilos.seccion} aria-labelledby="resumen-solicitudes">
          <div className={estilos.cabeceraSeccion}>
            <h2 id="resumen-solicitudes">Tus solicitudes</h2>
            <Link to="/reservas" className={estilos.enlaceVerTodas}>
              Ver todas las solicitudes →
            </Link>
          </div>
          <div className={estilos.resumenEstados}>
            {resumen.map((item) => {
              const icono = iconoPorEstado(item.estado)
              const tono = tonoPorEstado(item.estado)
              return (
                <Button
                  key={item.estado}
                  variante="secundario"
                  className={estilos.resumenCard}
                  onClick={() => navigate(`/reservas?estado=${encodeURIComponent(item.estado)}`)}
                  aria-label={`Ver solicitudes ${item.estado.toLowerCase()}: ${item.total}`}
                >
                  <div className={estilos.tarjetaHeader}>
                    <span className={`${estilos.iconoEstado} ${estilos[tono]}`} aria-hidden="true">
                      <Icono nombre={icono} />
                    </span>
                    <span className={estilos.flechaTarjeta} aria-hidden="true">
                      →
                    </span>
                  </div>
                  <strong className={estilos.numeroResumen}>{item.total}</strong>
                  <span className={estilos.etiquetaResumen}>{item.estado}</span>
                </Button>
              )
            })}
          </div>

          {solicitudes.length > 0 && (
            <div className={estilos.bloqueSolicitudes}>
              <h3 className={estilos.subtituloSolicitudes}>Últimas solicitudes</h3>
              <ul className={estilos.listaSolicitudes} aria-label="Solicitudes recientes">
                {solicitudes.slice(0, 5).map((res) => (
                  <li key={res.id} className={estilos.itemSolicitud}>
                    <div className={estilos.columnaAmbiente}>
                      <strong>{res.ambienteNombre}</strong>
                      <span className={estilos.datosFecha}>
                        <Icono nombre="calendario" tamano={14} />
                        {isoAFecha(res.fecha)} · {res.horaInicio}–{res.horaFin}
                      </span>
                    </div>
                    <Insignia tipo={tipoInsignia(res.estado)}>{res.estado}</Insignia>
                    <Button
                      variante="secundario"
                      className={estilos.botonDetalleItem}
                      onClick={() =>
                        navigate(`/reservas/${res.id}`, { state: { volverA: '/dashboard' } })
                      }
                    >
                      Ver detalle
                    </Button>
                  </li>
                ))}
              </ul>
            </div>
          )}
        </section>
      </div>

      <ModalDeReserva
        accion={decision.decision?.accion}
        reserva={decision.decision?.reserva}
        ejecutando={decision.ejecutando}
        alConfirmar={decision.confirmar}
        alVolver={decision.cerrar}
      />
    </>
  )
}
