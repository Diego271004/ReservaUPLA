import { Link } from 'react-router-dom'
import Button from '../components/ui/Button.jsx'
import CardIndicador from '../components/ui/CardIndicador.jsx'
import AvisoDeError from '../components/AvisoDeError/AvisoDeError.jsx'
import EsqueletoDeInicio from '../components/ui/EsqueletoDeInicio.jsx'
import PortadaDeInicio from '../components/ui/PortadaDeInicio.jsx'
import { Icono } from '../components/ui/Icono.jsx'
import Insignia from '../components/ui/Insignia.jsx'
import { isoAFecha, hoy } from '../utils/fechas.js'
import { TIPO_INSIGNIA_DE_ESTADO } from '../utils/reservas.js'
import { fechaLarga } from '../utils/resumenDeSolicitud.js'
import { useCarga } from '../hooks/useCarga.js'
import { obtenerDashboard } from '../services/recursosService.js'
import portada from '../components/ui/PortadaDeInicio.module.css'
import estilos from './InicioResponsable.module.css'

const VACIO = Object.freeze({ inicioResponsable: null })

const textoHoy = (cantidad) =>
  cantidad === 0
    ? 'No hay reservas para hoy. Revisa las próximas o consulta la disponibilidad.'
    : cantidad === 1
      ? '1 reserva programada para hoy en tus ambientes.'
      : `${cantidad} reservas programadas para hoy en tus ambientes.`

function FilaDeReserva({ reserva, destacado, alVerDetalle }) {
  return (
    <li>
      {destacado}
      <span className={estilos.nombreAmbiente}>{reserva.ambienteNombre}</span>
      <span className={estilos.nombreSolicitante}>{reserva.solicitanteNombre}</span>
      <Insignia tipo={TIPO_INSIGNIA_DE_ESTADO[reserva.estado] ?? 'neutro'}>
        {reserva.estado}
      </Insignia>
      <Button
        variante="secundario"
        className={estilos.botonDetalle}
        onClick={() => alVerDetalle(reserva.id)}
      >
        Ver detalle
      </Button>
    </li>
  )
}

function SeccionDeReservas({ id, titulo, cantidad, children }) {
  return (
    <section className={estilos.seccion} aria-labelledby={id}>
      <div className={estilos.cabeceraSeccion}>
        <h2 id={id}>{titulo}</h2>
        {cantidad > 0 && <span className={estilos.contadorSeccion}>{cantidad} reservas</span>}
      </div>
      {children}
    </section>
  )
}

export default function InicioResponsable({ ahora = new Date(), alVerDetalle }) {
  const { datos, cargando, error, recargar } = useCarga(obtenerDashboard, VACIO)

  if (error) return <AvisoDeError mensaje={error} alReintentar={recargar} />
  if (cargando) return <EsqueletoDeInicio />

  const inicio = datos.inicioResponsable
  const ordenadasHoy = [...(inicio?.hoy ?? [])].sort((a, b) =>
    `${a.horaInicio}`.localeCompare(b.horaInicio),
  )
  const ordenadasProximas = [...(inicio?.proximas ?? [])].sort((a, b) =>
    `${a.fecha}${a.horaInicio}`.localeCompare(`${b.fecha}${b.horaInicio}`),
  )
  const ambientes = inicio?.ambientes ?? []

  return (
    <div className={estilos.contenedorInicio}>
      <PortadaDeInicio
        id="portada-responsable-titulo"
        fecha={fechaLarga(hoy(ahora))}
        titulo="Gestión de tus ambientes a cargo"
        detalle={textoHoy(ordenadasHoy.length)}
      >
        <Link className={portada.accion} to="/disponibilidad">
          Ver disponibilidad
        </Link>
      </PortadaDeInicio>

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

      <SeccionDeReservas
        id="hoy-responsable"
        titulo="Hoy en tu ambiente"
        cantidad={ordenadasHoy.length}
      >
        {ordenadasHoy.length === 0 ? (
          <div className={estilos.vacio}>
            <Icono nombre="calendario" tamano={32} />
            <p>No hay reservas para hoy.</p>
          </div>
        ) : (
          <ol className={estilos.agendaResponsable}>
            {ordenadasHoy.map((reserva) => (
              <FilaDeReserva
                key={reserva.id}
                reserva={reserva}
                alVerDetalle={alVerDetalle}
                destacado={
                  <strong className={estilos.horaDestacada}>
                    <Icono nombre="reloj" tamano={16} />
                    {reserva.horaInicio}–{reserva.horaFin}
                  </strong>
                }
              />
            ))}
          </ol>
        )}
      </SeccionDeReservas>

      <SeccionDeReservas
        id="proximas-responsable"
        titulo="Próximas reservas"
        cantidad={ordenadasProximas.length}
      >
        {ordenadasProximas.length === 0 ? (
          <p>No hay próximas reservas.</p>
        ) : (
          <ul className={estilos.listaResponsable}>
            {ordenadasProximas.map((reserva) => (
              <FilaDeReserva
                key={reserva.id}
                reserva={reserva}
                alVerDetalle={alVerDetalle}
                destacado={
                  <>
                    <strong className={estilos.fechaProxima}>
                      <Icono nombre="calendario" tamano={16} />
                      {isoAFecha(reserva.fecha)}
                    </strong>
                    <span className={estilos.horaProxima}>
                      {reserva.horaInicio}–{reserva.horaFin}
                    </span>
                  </>
                }
              />
            ))}
          </ul>
        )}
      </SeccionDeReservas>
    </div>
  )
}
