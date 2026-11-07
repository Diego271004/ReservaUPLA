import { useNavigate } from 'react-router-dom'
import Button from '../components/ui/Button.jsx'
import CardIndicador from '../components/ui/CardIndicador.jsx'
import AvisoDeError from '../components/AvisoDeError/AvisoDeError.jsx'
import { Icono } from '../components/ui/Icono.jsx'
import Insignia from '../components/ui/Insignia.jsx'
import { isoAFecha, hoy } from '../utils/fechas.js'
import { fechaLarga } from '../utils/resumenDeSolicitud.js'
import { useCarga } from '../hooks/useCarga.js'
import { obtenerDashboard } from '../services/recursosService.js'
import estilos from './InicioResponsable.module.css'

const VACIO = Object.freeze({ inicioResponsable: null })
const tipoInsignia = (estado) =>
  ({
    Pendiente: 'pendiente',
    Aprobada: 'aprobada',
    Rechazada: 'rechazada',
    Cancelada: 'cancelada',
  })[estado] ?? 'neutro'

export default function InicioResponsable({ ahora = new Date(), alVerDetalle }) {
  const navigate = useNavigate()
  const { datos, cargando, error, recargar } = useCarga(obtenerDashboard, VACIO)

  if (error) return <AvisoDeError mensaje={error} alReintentar={recargar} />
  if (cargando)
    return (
      <section aria-live="polite" aria-busy="true" className={estilos.esqueleto}>
        <p className={estilos.textoCarga}>Iniciando tu dashboard…</p>
        <div className={estilos.cajaEsqueleto} />
        <div className={estilos.cajaEsqueleto} />
        <div className={estilos.cajaEsqueleto} />
      </section>
    )

  const inicio = datos.inicioResponsable
  const hoyList = inicio?.hoy ?? []
  const proximas = inicio?.proximas ?? []
  const ambientes = inicio?.ambientes ?? []
  const ordenadasHoy = [...hoyList].sort((a, b) => `${a.horaInicio}`.localeCompare(b.horaInicio))
  const ordenadasProximas = [...proximas].sort((a, b) =>
    `${a.fecha}${a.horaInicio}`.localeCompare(`${b.fecha}${b.horaInicio}`),
  )
  const fechaHoy = fechaLarga(hoy(ahora))

  return (
    <div className={estilos.contenedorInicio}>
      <section className={estilos.portada} aria-labelledby="portada-responsable-titulo">
        <svg
          className={estilos.marca}
          viewBox="0 0 220 160"
          width="220"
          height="160"
          aria-hidden="true"
          focusable="false"
        >
          <path d="M60 10 100 33v46L60 102 20 79V33z" />
          <path d="M130 50 170 73v46l-40 23-40-23V73z" />
          <path d="M150 -10 190 13v46l-40 23-40-23V13z" />
        </svg>
        <div className={estilos.textoPortada}>
          <p className={estilos.fechaPortada}>{fechaHoy}</p>
          <h2 id="portada-responsable-titulo" className={estilos.tituloPortada}>
            Gestión de tus ambientes a cargo
          </h2>
          <p className={estilos.detallePortada}>
            {ordenadasHoy.length === 0
              ? 'No hay reservas para hoy. Revisa las próximas o consulta la disponibilidad.'
              : ordenadasHoy.length === 1
                ? '1 reserva programada para hoy en tus ambientes.'
                : `${ordenadasHoy.length} reservas programadas para hoy en tus ambientes.`}
          </p>
        </div>
        <Button
          variante="secundario"
          className={estilos.accionPortada}
          onClick={() => navigate('/disponibilidad')}
        >
          Ver disponibilidad
        </Button>
      </section>

      <section className={estilos.indicadores} aria-label="Indicadores">
        <CardIndicador
          valor={ordenadasHoy.length}
          descripcion="Reservas para hoy"
          detalle="En tus ambientes a cargo"
          icono="calendario"
          tono="info"
        />
        <CardIndicador
          valor={ordenadasProximas.length}
          descripcion="Próximas reservas"
          detalle="Días posteriores"
          icono="reloj"
          tono="aviso"
        />
        <CardIndicador
          valor={ambientes.length}
          descripcion="Ambientes a cargo"
          detalle="Asignados a tu usuario"
          icono="ambientes"
          tono="exito"
          href="/mi-ambiente"
        />
      </section>

      <section className={estilos.seccion} aria-labelledby="hoy-responsable">
        <div className={estilos.cabeceraSeccion}>
          <h2 id="hoy-responsable">Hoy en tu ambiente</h2>
          {ordenadasHoy.length > 0 && (
            <span className={estilos.contadorSeccion}>{ordenadasHoy.length} reservas</span>
          )}
        </div>
        {ordenadasHoy.length === 0 ? (
          <div className={estilos.vacio}>
            <Icono nombre="calendario" tamano={32} />
            <p>No hay reservas para hoy.</p>
          </div>
        ) : (
          <ol className={estilos.agendaResponsable}>
            {ordenadasHoy.map((reserva) => (
              <li key={reserva.id}>
                <strong className={estilos.horaDestacada}>
                  <Icono nombre="reloj" tamano={16} />
                  {reserva.horaInicio}–{reserva.horaFin}
                </strong>
                <span className={estilos.nombreAmbiente}>{reserva.ambienteNombre}</span>
                <span className={estilos.nombreSolicitante}>{reserva.solicitanteNombre}</span>
                <Insignia tipo={tipoInsignia(reserva.estado)}>{reserva.estado}</Insignia>
                <Button
                  variante="secundario"
                  className={estilos.botonDetalle}
                  onClick={() => alVerDetalle(reserva.id)}
                >
                  Ver detalle
                </Button>
              </li>
            ))}
          </ol>
        )}
      </section>

      <section className={estilos.seccion} aria-labelledby="proximas-responsable">
        <div className={estilos.cabeceraSeccion}>
          <h2 id="proximas-responsable">Próximas reservas</h2>
          {ordenadasProximas.length > 0 && (
            <span className={estilos.contadorSeccion}>{ordenadasProximas.length} reservas</span>
          )}
        </div>
        {ordenadasProximas.length === 0 ? (
          <p>No hay próximas reservas.</p>
        ) : (
          <ul className={estilos.listaResponsable}>
            {ordenadasProximas.map((reserva) => (
              <li key={reserva.id}>
                <strong className={estilos.fechaProxima}>
                  <Icono nombre="calendario" tamano={16} />
                  {isoAFecha(reserva.fecha)}
                </strong>
                <span className={estilos.horaProxima}>
                  {reserva.horaInicio}–{reserva.horaFin}
                </span>
                <span className={estilos.nombreAmbiente}>{reserva.ambienteNombre}</span>
                <span className={estilos.nombreSolicitante}>{reserva.solicitanteNombre}</span>
                <Insignia tipo={tipoInsignia(reserva.estado)}>{reserva.estado}</Insignia>
                <Button
                  variante="secundario"
                  className={estilos.botonDetalle}
                  onClick={() => alVerDetalle(reserva.id)}
                >
                  Ver detalle
                </Button>
              </li>
            ))}
          </ul>
        )}
      </section>
    </div>
  )
}
