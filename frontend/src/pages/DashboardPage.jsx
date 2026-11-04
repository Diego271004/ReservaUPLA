import { Link, useNavigate } from 'react-router-dom'
import AvisoDeError from '../components/AvisoDeError/AvisoDeError.jsx'
import AlertMessage from '../components/ui/AlertMessage.jsx'
import Button from '../components/ui/Button.jsx'
import CardIndicador from '../components/ui/CardIndicador.jsx'
import ModalConfirmacion from '../components/ui/ModalConfirmacion.jsx'
import TableList from '../components/ui/TableList.jsx'
import { TEXTOS, textoMostrando } from '../constants/messages.js'
import { useCarga } from '../hooks/useCarga.js'
import { useDecisionDeReserva } from '../hooks/useDecisionDeReserva.js'
import { obtenerDashboard } from '../services/recursosService.js'
import { isoAFecha } from '../utils/fechas.js'
import { ambienteMasUtilizado } from '../utils/filtrosDeReservas.js'
import { MODALES, resumenDe } from '../utils/modalesDeReserva.js'
import estilos from './DashboardPage.module.css'

const DASHBOARD_VACIO = Object.freeze({
  indicadores: { total: 0, pendientes: 0, aprobadas: 0, rechazadas: 0 },
  ambientesMasUtilizados: [],
  pendientesMasAntiguas: { elementos: [], total: 0, pagina: 1, tamano: 5 },
})

/**
 * Dashboard del Administrador (RF-08): cinco indicadores y las solicitudes pendientes más antiguas, que se aprueban o
 * rechazan desde aquí con el mismo modal de confirmación del detalle. Al decidir, la pantalla vuelve a pedir sus datos.
 */
export default function DashboardPage() {
  const navigate = useNavigate()
  const { datos, cargando, error, recargar } = useCarga(obtenerDashboard, DASHBOARD_VACIO)
  const decision = useDecisionDeReserva(recargar)

  const { indicadores, ambientesMasUtilizados, pendientesMasAntiguas } = datos
  const masUtilizado = ambienteMasUtilizado(ambientesMasUtilizados)
  const modal = decision.decision ? MODALES[decision.decision.accion] : null

  const columnas = [
    { clave: 'fecha', titulo: TEXTOS.columnaFecha, render: (reserva) => isoAFecha(reserva.fecha) },
    {
      clave: 'horario',
      titulo: TEXTOS.columnaHorario,
      render: (reserva) => `${reserva.horaInicio} – ${reserva.horaFin}`,
    },
    { clave: 'ambienteNombre', titulo: TEXTOS.columnaAmbiente },
    { clave: 'solicitanteNombre', titulo: TEXTOS.columnaSolicitante },
    {
      clave: 'acciones',
      titulo: TEXTOS.columnaAcciones,
      render: (reserva) => {
        const de = `${reserva.ambienteNombre}, ${isoAFecha(reserva.fecha)}`
        return (
          <div className={estilos.acciones}>
            <Button
              variante="secundario"
              aria-label={`${TEXTOS.verDetalle}: ${de}`}
              onClick={() =>
                navigate(`/reservas/${reserva.id}`, { state: { volverA: '/dashboard' } })
              }
            >
              {TEXTOS.verDetalle}
            </Button>
            <Button
              variante="rechazar"
              aria-label={`${TEXTOS.rechazar}: ${de}`}
              onClick={() => decision.abrir('rechazar', reserva)}
            >
              {TEXTOS.rechazar}
            </Button>
            <Button
              aria-label={`${TEXTOS.aprobar}: ${de}`}
              onClick={() => decision.abrir('aprobar', reserva)}
            >
              {TEXTOS.aprobar}
            </Button>
          </div>
        )
      },
    },
  ]

  return (
    <>
      <h1>{TEXTOS.tituloDashboard}</h1>
      {decision.alerta && (
        <AlertMessage tipo={decision.alerta.tipo}>{decision.alerta.mensaje}</AlertMessage>
      )}
      {error && <AvisoDeError mensaje={error} alReintentar={recargar} />}
      {cargando && <p role="status">{TEXTOS.cargando}</p>}
      {!error && (
        <>
          <section className={estilos.indicadores} aria-label="Indicadores">
            <CardIndicador valor={indicadores.total} descripcion={TEXTOS.indicadorTotal} />
            <CardIndicador
              valor={indicadores.pendientes}
              descripcion={TEXTOS.indicadorPendientes}
            />
            <CardIndicador valor={indicadores.aprobadas} descripcion={TEXTOS.indicadorAprobadas} />
            <CardIndicador
              valor={indicadores.rechazadas}
              descripcion={TEXTOS.indicadorRechazadas}
            />
            <CardIndicador
              valor={masUtilizado.valor}
              descripcion={TEXTOS.indicadorMasUtilizado}
              detalle={masUtilizado.detalle}
            />
          </section>
          <div className={estilos.pendientes}>
            <TableList
              titulo={TEXTOS.solicitudesPendientes}
              columnas={columnas}
              filas={pendientesMasAntiguas.elementos}
              textoVacio={cargando ? TEXTOS.cargando : TEXTOS.sinPendientes}
            />
            {pendientesMasAntiguas.total > 0 && (
              <div className={estilos.pie}>
                <p role="status">
                  {textoMostrando(
                    pendientesMasAntiguas.elementos.length,
                    pendientesMasAntiguas.total,
                  )}
                </p>
                <Link to="/reservas?estado=Pendiente" className={estilos.verTodas}>
                  {TEXTOS.verTodas}
                </Link>
              </div>
            )}
          </div>
        </>
      )}
      <ModalConfirmacion
        abierto={modal !== null}
        titulo={modal?.titulo ?? ''}
        resumen={decision.decision ? resumenDe(decision.decision.reserva) : []}
        advertencia={modal?.irreversible ? TEXTOS.advertenciaIrreversible : undefined}
        textoConfirmar={modal?.confirmar ?? ''}
        variante={modal?.variante}
        cargando={decision.ejecutando}
        onConfirmar={decision.confirmar}
        onVolver={decision.cerrar}
      />
    </>
  )
}
