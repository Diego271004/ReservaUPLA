import AvisoDeError from '../components/AvisoDeError/AvisoDeError.jsx'
import AlertMessage from '../components/ui/AlertMessage.jsx'
import AgendaDeHoy from '../components/InicioAdmin/AgendaDeHoy.jsx'
import GrupoDeIndicadores from '../components/GrupoDeIndicadores/GrupoDeIndicadores.jsx'
import ModalDeReserva from '../components/ModalDeReserva/ModalDeReserva.jsx'
import Portada from '../components/InicioAdmin/Portada.jsx'
import RequierenDecision from '../components/InicioAdmin/RequierenDecision.jsx'
import UsoYEstados from '../components/InicioAdmin/UsoYEstados.jsx'
import { TEXTOS } from '../constants/messages.js'
import { useCarga } from '../hooks/useCarga.js'
import { useDecisionDeReserva } from '../hooks/useDecisionDeReserva.js'
import { obtenerDashboard } from '../services/recursosService.js'
import { ambienteMasUtilizado } from '../utils/filtrosDeReservas.js'
import { horaEnLima } from '../utils/fechas.js'
import { indicadoresDeEstado } from '../utils/indicadores.js'

const DASHBOARD_VACIO = Object.freeze({
  indicadores: { total: 0, pendientes: 0, aprobadas: 0, rechazadas: 0 },
  ambientesMasUtilizados: [],
  pendientesMasAntiguas: { elementos: [], total: 0, pagina: 1, tamano: 5 },
  solicitudesRequierenDecision: [],
  hoyEnLosAmbientes: [],
  usoPorAmbiente: [],
})

const ESTADO_DE_INDICADOR = {
  total: null,
  pendientes: 'Pendiente',
  aprobadas: 'Aprobada',
  rechazadas: 'Rechazada',
}

const claveOrden = (item) =>
  `${item.reserva?.fecha ?? item.fecha ?? ''}T${item.reserva?.horaInicio ?? item.horaInicio ?? ''}`

/** Las solicitudes que requieren decisión, de la más próxima a la más lejana (con lo que dé la API o las pendientes más antiguas). */
function solicitudesPorAtender(datos) {
  const lista = datos.solicitudesRequierenDecision?.length
    ? datos.solicitudesRequierenDecision
    : (datos.pendientesMasAntiguas.elementos ?? []).map((reserva) => ({
        reserva,
        choqueAprobada: false,
        ambienteEnMantenimiento: false,
      }))
  return lista.slice().sort((a, b) => claveOrden(a).localeCompare(claveOrden(b)))
}

/** El inicio del Administrador: lo que requiere su decisión primero, los indicadores, la agenda de hoy y el uso por ambiente. */
export default function InicioAdministrador({ ahora = new Date() }) {
  const { datos, cargando, error, recargar } = useCarga(obtenerDashboard, DASHBOARD_VACIO)
  const decision = useDecisionDeReserva(recargar)
  const { indicadores, ambientesMasUtilizados, pendientesMasAntiguas } = datos
  const masUtilizado = ambienteMasUtilizado(ambientesMasUtilizados)
  const indicadoresConFiltros = indicadoresDeEstado(indicadores).map((indicador) => {
    const estado = ESTADO_DE_INDICADOR[indicador.clave]
    return { ...indicador, href: estado ? `/reservas?estado=${estado}` : '/reservas' }
  })
  const uso = datos.usoPorAmbiente?.length ? datos.usoPorAmbiente : ambientesMasUtilizados

  return (
    <>
      {decision.alerta && (
        <AlertMessage tipo={decision.alerta.tipo}>{decision.alerta.mensaje}</AlertMessage>
      )}
      {error && <AvisoDeError mensaje={error} alReintentar={recargar} />}
      {cargando && <p role="status">{TEXTOS.cargando}</p>}
      {!error && !cargando && (
        <>
          <Portada pendientes={pendientesMasAntiguas.total} ahora={ahora} />
          <GrupoDeIndicadores
            indicadores={[
              ...indicadoresConFiltros,
              {
                clave: 'uso',
                valor: masUtilizado.valor,
                descripcion: TEXTOS.indicadorMasUtilizado,
                detalle: masUtilizado.detalle,
                href: '/reservas?estado=Aprobada',
                icono: 'ambientes',
                tono: 'info',
                ancha: true,
              },
            ]}
          />
          <RequierenDecision
            solicitudes={solicitudesPorAtender(datos)}
            totalPendientes={pendientesMasAntiguas.total}
            alDecidir={decision.abrir}
          />
          <AgendaDeHoy ambientes={datos.hoyEnLosAmbientes} horaActual={horaEnLima(ahora)} />
          <UsoYEstados uso={uso} indicadores={indicadores} />
        </>
      )}
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
