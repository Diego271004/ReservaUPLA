import { useCallback } from 'react'
import { useSearchParams } from 'react-router-dom'
import Paginacion from '../components/Paginacion/Paginacion.jsx'
import AvisoDeError from '../components/AvisoDeError/AvisoDeError.jsx'
import AlertMessage from '../components/ui/AlertMessage.jsx'
import CardIndicador from '../components/ui/CardIndicador.jsx'
import Insignia from '../components/ui/Insignia.jsx'
import SelectInput from '../components/ui/SelectInput.jsx'
import TableList from '../components/ui/TableList.jsx'
import { TEXTOS, textoMostrando } from '../constants/messages.js'
import { useCarga } from '../hooks/useCarga.js'
import { obtenerMiAmbiente } from '../services/recursosService.js'
import { isoAFecha } from '../utils/fechas.js'
import { TIPO_INSIGNIA_DE_ESTADO } from '../utils/reservas.js'
import estilos from './MiAmbientePage.module.css'

const PANEL_VACIO = Object.freeze({
  ambiente: null,
  ambientes: [],
  indicadores: { total: 0, pendientes: 0, aprobadas: 0, rechazadas: 0 },
  reservas: { elementos: [], total: 0, pagina: 1, tamano: 10 },
})

const COLUMNAS = [
  { clave: 'fecha', titulo: TEXTOS.columnaFecha, render: (reserva) => isoAFecha(reserva.fecha) },
  {
    clave: 'horario',
    titulo: TEXTOS.columnaHorario,
    render: (reserva) => `${reserva.horaInicio} – ${reserva.horaFin}`,
  },
  { clave: 'solicitanteNombre', titulo: TEXTOS.columnaSolicitante },
  {
    clave: 'estado',
    titulo: TEXTOS.columnaEstado,
    render: (reserva) => (
      <Insignia tipo={TIPO_INSIGNIA_DE_ESTADO[reserva.estado]}>{reserva.estado}</Insignia>
    ),
  },
]

/**
 * Mi ambiente (Responsable): su ambiente, cuatro indicadores acotados a él y sus reservas, solo para consultar (sin
 * aprobar ni rechazar). Si tiene más de un ambiente a cargo puede elegir cuál mira. Los indicadores en esta pantalla son
 * una extensión del diseño 08 (decisión del planificador) que se revisa con los usuarios.
 */
export default function MiAmbientePage() {
  const [buscar, setBuscar] = useSearchParams()
  const clave = buscar.toString()

  const cargar = useCallback(() => {
    const consulta = new URLSearchParams(clave)
    return obtenerMiAmbiente({
      ambienteId: consulta.get('ambienteId') ?? '',
      pagina: Number.parseInt(consulta.get('pagina') ?? '1', 10) || 1,
    })
  }, [clave])
  const { datos, cargando, error, recargar } = useCarga(cargar, PANEL_VACIO)
  const { ambiente, ambientes, indicadores, reservas } = datos

  const elegir = (evento) => setBuscar({ ambienteId: evento.target.value })
  const irAPagina = (pagina) => {
    const siguiente = new URLSearchParams(clave)
    if (pagina > 1) siguiente.set('pagina', String(pagina))
    else siguiente.delete('pagina')
    setBuscar(siguiente)
  }

  return (
    <>
      <h1>{TEXTOS.tituloMiAmbiente}</h1>
      {error && <AvisoDeError mensaje={error} alReintentar={recargar} />}
      {cargando && <p role="status">{TEXTOS.cargando}</p>}
      {!cargando && !error && ambiente === null && (
        <AlertMessage tipo="info">{TEXTOS.sinAmbienteAsignado}</AlertMessage>
      )}
      {!cargando && !error && ambiente !== null && (
        <>
          <section className={estilos.ambiente} aria-label={ambiente.nombre}>
            <div>
              <h2>{ambiente.nombre}</h2>
              <p>
                <strong>{TEXTOS.etiquetaUbicacion}:</strong> {ambiente.ubicacion}
                <span className={estilos.separador} aria-hidden="true" />
                <strong>{TEXTOS.etiquetaCapacidad}:</strong> {ambiente.capacidad} {TEXTOS.personas}
              </p>
            </div>
            {ambientes.length > 1 && (
              <SelectInput
                id="mi-ambiente-elegir"
                nombre="ambienteId"
                etiqueta={TEXTOS.etiquetaFiltroAmbiente}
                valor={String(ambiente.id)}
                opciones={ambientes.map((propio) => ({
                  valor: String(propio.id),
                  etiqueta: propio.nombre,
                }))}
                textoVacio={null}
                onChange={elegir}
              />
            )}
          </section>
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
          </section>
          <div className={estilos.uso}>
            <TableList
              titulo={TEXTOS.usoDelAmbiente}
              columnas={COLUMNAS}
              filas={reservas.elementos}
              textoVacio={TEXTOS.sinReservas}
            />
            {reservas.total > 0 && (
              <p role="status" className={estilos.resumen}>
                {textoMostrando(reservas.elementos.length, reservas.total)}
              </p>
            )}
            <Paginacion
              pagina={reservas.pagina}
              total={reservas.total}
              tamano={reservas.tamano}
              alCambiar={irAPagina}
            />
          </div>
        </>
      )}
    </>
  )
}
