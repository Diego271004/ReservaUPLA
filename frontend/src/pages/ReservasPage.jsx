import { useCallback, useId } from 'react'
import { useLocation, useNavigate, useSearchParams } from 'react-router-dom'
import FiltrosDeReservas from '../components/FiltrosDeReservas/FiltrosDeReservas.jsx'
import PestanasDeEstado from '../components/ui/PestanasDeEstado.jsx'
import PieDeLista from '../components/PieDeLista/PieDeLista.jsx'
import AvisoDeError from '../components/AvisoDeError/AvisoDeError.jsx'
import Button from '../components/ui/Button.jsx'
import EstadoVacio from '../components/ui/EstadoVacio.jsx'
import PageHeader from '../components/ui/PageHeader.jsx'
import TableList from '../components/ui/TableList.jsx'
import { TEXTOS } from '../constants/messages.js'
import { ROLES } from '../constants/navegacion.js'
import { useAuth } from '../context/AuthContext.jsx'
import { useCarga } from '../hooks/useCarga.js'
import { useConteoPorEstado } from '../hooks/useConteoPorEstado.js'
import { listarAmbientes, listarReservas } from '../services/recursosService.js'
import { isoAFecha } from '../utils/fechas.js'
import { consultaDeFiltros, filtrosDeBusqueda, hayFiltros } from '../utils/filtrosDeReservas.js'
import { resumenDeReservas } from '../utils/reservas.js'
import { columnasDeReservas } from './columnasDeReservas.jsx'
import estilos from './ReservasPage.module.css'

const PAGINA_VACIA = Object.freeze({ elementos: [], total: 0, pagina: 1, tamano: 10 })

/**
 * Lista de Reservas (RF-05): cada rol ve lo suyo (lo decide la API), con pestañas por estado (cada una con su número),
 * filtros y páginas. Los filtros y la página viven en la dirección (?estado=Pendiente&pagina=2): se puede volver con
 * «atrás», compartir el enlace, y «Volver a Reservas» del detalle regresa a la misma lista.
 */
export default function ReservasPage() {
  const navigate = useNavigate()
  const { search } = useLocation()
  const { sesion } = useAuth()
  const [buscar, setBuscar] = useSearchParams()
  const idPanel = useId()
  const clave = buscar.toString()
  const filtros = filtrosDeBusqueda(buscar)

  const cargar = useCallback(
    () => listarReservas(filtrosDeBusqueda(new URLSearchParams(clave))),
    [clave],
  )
  const { datos, cargando, error, recargar } = useCarga(cargar, PAGINA_VACIA)
  const ambientes = useCarga(listarAmbientes)

  const conteos = useConteoPorEstado(clave)

  const opcionesAmbiente = ambientes.datos.map((ambiente) => ({
    valor: String(ambiente.id),
    etiqueta: ambiente.nombre,
  }))

  const aplicar = (nuevos) => setBuscar(consultaDeFiltros({ ...nuevos, pagina: 1 }))
  const limpiar = () => setBuscar(new URLSearchParams())
  const irAPagina = (pagina) => setBuscar(consultaDeFiltros({ ...filtros, pagina }))
  const elegirEstado = (estado) => aplicar({ ...filtros, estado })

  const verDetalle = (reserva) =>
    navigate(`/reservas/${reserva.id}`, { state: { volverA: `/reservas${search}` } })

  const columnas = columnasDeReservas(
    [
      'fecha',
      'horario',
      'ambiente',
      ...(sesion.rol === ROLES.solicitante ? [] : ['solicitante']),
      'estado',
    ],
    // La Solicitante solo ve las suyas: su propio nombre en cada fila sería ruido (por eso no lleva la columna Solicitante).
    (reserva) => (
      <Button
        variante="enlace"
        aria-label={`${TEXTOS.verDetalle}: ${reserva.ambienteNombre}, ${isoAFecha(reserva.fecha)}`}
        onClick={() => verDetalle(reserva)}
      >
        {TEXTOS.verDetalle}
      </Button>
    ),
  )

  const puedeReservar = sesion.rol !== ROLES.responsable
  const irANueva = () => navigate('/reservas/nueva')
  const vacio = hayFiltros(filtros) ? (
    <EstadoVacio mensaje={TEXTOS.sinReservasConFiltros}>
      <Button variante="secundario" onClick={limpiar}>
        {TEXTOS.limpiarFiltros}
      </Button>
    </EstadoVacio>
  ) : (
    <EstadoVacio mensaje={TEXTOS.sinReservas}>
      {puedeReservar && <Button onClick={irANueva}>{TEXTOS.reservarUnAmbiente}</Button>}
    </EstadoVacio>
  )

  return (
    <>
      <PageHeader
        titulo={TEXTOS.tituloReservas}
        subtitulo={resumenDeReservas(conteos.datos)}
        acciones={
          puedeReservar ? <Button onClick={irANueva}>{TEXTOS.reservarUnAmbiente}</Button> : null
        }
      />
      <PestanasDeEstado
        activa={filtros.estado}
        conteos={conteos.datos}
        alElegir={elegirEstado}
        idPanel={idPanel}
      />
      <FiltrosDeReservas
        key={consultaDeFiltros({ ...filtros, pagina: 1 }).toString()}
        aplicados={filtros}
        ambientes={opcionesAmbiente}
        alAplicar={aplicar}
        alLimpiar={limpiar}
      />
      <div id={idPanel} role="tabpanel">
        {error && <AvisoDeError mensaje={error} alReintentar={recargar} />}
        {cargando && <p role="status">{TEXTOS.cargandoReservas}</p>}
        {!cargando && !error && (
          <div className={estilos.resultado}>
            <TableList
              titulo={TEXTOS.tituloReservas}
              columnas={columnas}
              filas={datos.elementos}
              textoVacio={vacio}
              alActivarFila={verDetalle}
            />
            <PieDeLista pagina={{ ...datos, alCambiar: irAPagina }} />
          </div>
        )}
      </div>
    </>
  )
}
