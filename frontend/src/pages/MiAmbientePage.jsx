import { useCallback } from 'react'
import { useNavigate, useSearchParams } from 'react-router-dom'
import GrupoDeIndicadores from '../components/GrupoDeIndicadores/GrupoDeIndicadores.jsx'
import PieDeLista from '../components/PieDeLista/PieDeLista.jsx'
import AvisoDeError from '../components/AvisoDeError/AvisoDeError.jsx'
import AlertMessage from '../components/ui/AlertMessage.jsx'
import PageHeader from '../components/ui/PageHeader.jsx'
import Button from '../components/ui/Button.jsx'
import EstadoVacio from '../components/ui/EstadoVacio.jsx'
import SelectInput from '../components/ui/SelectInput.jsx'
import TableList from '../components/ui/TableList.jsx'
import { TEXTOS } from '../constants/messages.js'
import { useCarga } from '../hooks/useCarga.js'
import { obtenerMiAmbiente } from '../services/recursosService.js'
import { isoAFecha } from '../utils/fechas.js'
import { indicadoresDeEstado } from '../utils/indicadores.js'
import { columnasDeReservas } from './columnasDeReservas.jsx'
import estilos from './MiAmbientePage.module.css'

const PANEL_VACIO = Object.freeze({
  ambiente: null,
  ambientes: [],
  indicadores: { total: 0, pendientes: 0, aprobadas: 0, rechazadas: 0 },
  reservas: { elementos: [], total: 0, pagina: 1, tamano: 10 },
})

/**
 * Mi ambiente (Responsable): su ambiente, cuatro indicadores acotados a él y sus reservas, solo para consultar (sin
 * aprobar ni rechazar). Si tiene más de un ambiente a cargo puede elegir cuál mira. Los indicadores en esta pantalla son
 * una extensión del diseño 08 (decisión del planificador) que se revisa con los usuarios.
 */
export default function MiAmbientePage() {
  const [buscar, setBuscar] = useSearchParams()
  const clave = buscar.toString()
  const navigate = useNavigate()

  const cargar = useCallback(() => {
    const consulta = new URLSearchParams(clave)
    return obtenerMiAmbiente({
      ambienteId: consulta.get('ambienteId') ?? '',
      pagina: Number.parseInt(consulta.get('pagina') ?? '1', 10) || 1,
    })
  }, [clave])
  const { datos, cargando, error, recargar } = useCarga(cargar, PANEL_VACIO)
  const { ambiente, ambientes, indicadores, reservas } = datos

  // «Ver detalle» recuerda esta pantalla (ambiente y página) para que el detalle vuelva a ella.
  const columnas = columnasDeReservas(['fecha', 'horario', 'solicitante', 'estado'], (reserva) => (
    <Button
      variante="secundario"
      aria-label={`${TEXTOS.verDetalle}: ${reserva.ambienteNombre}, ${isoAFecha(reserva.fecha)}`}
      onClick={() =>
        navigate(`/reservas/${reserva.id}`, {
          state: { volverA: clave ? `/mi-ambiente?${clave}` : '/mi-ambiente' },
        })
      }
    >
      {TEXTOS.verDetalle}
    </Button>
  ))

  const elegir = (evento) => setBuscar({ ambienteId: evento.target.value })
  const irAPagina = (pagina) => {
    const siguiente = new URLSearchParams(clave)
    if (pagina > 1) siguiente.set('pagina', String(pagina))
    else siguiente.delete('pagina')
    setBuscar(siguiente)
  }

  return (
    <>
      <PageHeader titulo={TEXTOS.tituloMiAmbiente} />
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
          <GrupoDeIndicadores indicadores={indicadoresDeEstado(indicadores)} />
          <div className={estilos.uso}>
            {reservas.elementos.length === 0 ? (
              <EstadoVacio mensaje={TEXTOS.sinReservas} />
            ) : (
              <>
                <TableList
                  titulo={TEXTOS.usoDelAmbiente}
                  columnas={columnas}
                  filas={reservas.elementos}
                  textoVacio={TEXTOS.sinReservas}
                />
                <PieDeLista pagina={{ ...reservas, alCambiar: irAPagina }} />
              </>
            )}
          </div>
        </>
      )}
    </>
  )
}
