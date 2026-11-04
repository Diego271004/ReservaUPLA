import { useCallback } from 'react'
import { useLocation, useNavigate, useSearchParams } from 'react-router-dom'
import FiltrosDeReservas from '../components/FiltrosDeReservas/FiltrosDeReservas.jsx'
import Paginacion from '../components/Paginacion/Paginacion.jsx'
import AvisoDeError from '../components/AvisoDeError/AvisoDeError.jsx'
import Button from '../components/ui/Button.jsx'
import Insignia from '../components/ui/Insignia.jsx'
import TableList from '../components/ui/TableList.jsx'
import { TEXTOS, textoMostrando } from '../constants/messages.js'
import { ROLES } from '../constants/navegacion.js'
import { useAuth } from '../context/AuthContext.jsx'
import { useCarga } from '../hooks/useCarga.js'
import { listarAmbientes, listarReservas } from '../services/recursosService.js'
import { isoAFecha } from '../utils/fechas.js'
import { TIPO_INSIGNIA_DE_ESTADO } from '../utils/reservas.js'
import { consultaDeFiltros, filtrosDeBusqueda, hayFiltros } from '../utils/filtrosDeReservas.js'
import estilos from './ReservasPage.module.css'

const PAGINA_VACIA = Object.freeze({ elementos: [], total: 0, pagina: 1, tamano: 10 })

/**
 * Lista de Reservas (RF-05): cada rol ve lo suyo (lo decide la API), con filtros y páginas. Los filtros y la página viven
 * en la dirección (?estado=Pendiente&pagina=2): se puede volver con «atrás», compartir el enlace, y «Volver a Reservas»
 * del detalle regresa a la misma lista.
 */
export default function ReservasPage() {
  const navigate = useNavigate()
  const { search } = useLocation()
  const { sesion } = useAuth()
  const [buscar, setBuscar] = useSearchParams()
  const clave = buscar.toString()
  const filtros = filtrosDeBusqueda(buscar)

  const cargar = useCallback(
    () => listarReservas(filtrosDeBusqueda(new URLSearchParams(clave))),
    [clave],
  )
  const { datos, cargando, error, recargar } = useCarga(cargar, PAGINA_VACIA)
  const ambientes = useCarga(listarAmbientes)

  const opcionesAmbiente = ambientes.datos.map((ambiente) => ({
    valor: String(ambiente.id),
    etiqueta: ambiente.nombre,
  }))

  const aplicar = (nuevos) => setBuscar(consultaDeFiltros({ ...nuevos, pagina: 1 }))
  const limpiar = () => setBuscar(new URLSearchParams())
  const irAPagina = (pagina) => setBuscar(consultaDeFiltros({ ...filtros, pagina }))

  const columnas = [
    { clave: 'fecha', titulo: TEXTOS.columnaFecha, render: (reserva) => isoAFecha(reserva.fecha) },
    {
      clave: 'horario',
      titulo: TEXTOS.columnaHorario,
      render: (reserva) => `${reserva.horaInicio} – ${reserva.horaFin}`,
    },
    { clave: 'ambienteNombre', titulo: TEXTOS.columnaAmbiente },
    // La Solicitante solo ve las suyas: su propio nombre en cada fila sería ruido.
    ...(sesion.rol === ROLES.solicitante
      ? []
      : [{ clave: 'solicitanteNombre', titulo: TEXTOS.columnaSolicitante }]),
    {
      clave: 'estado',
      titulo: TEXTOS.columnaEstado,
      render: (reserva) => (
        <Insignia tipo={TIPO_INSIGNIA_DE_ESTADO[reserva.estado]}>{reserva.estado}</Insignia>
      ),
    },
    {
      clave: 'acciones',
      titulo: TEXTOS.columnaAcciones,
      render: (reserva) => (
        <Button
          variante="secundario"
          aria-label={`${TEXTOS.verDetalle}: ${reserva.ambienteNombre}, ${isoAFecha(reserva.fecha)}`}
          onClick={() =>
            navigate(`/reservas/${reserva.id}`, { state: { volverA: `/reservas${search}` } })
          }
        >
          {TEXTOS.verDetalle}
        </Button>
      ),
    },
  ]

  const vacio = hayFiltros(filtros) ? (
    <div className={estilos.vacio}>
      <p>{TEXTOS.sinReservasConFiltros}</p>
      <Button variante="secundario" onClick={limpiar}>
        {TEXTOS.limpiarFiltros}
      </Button>
    </div>
  ) : (
    TEXTOS.sinReservas
  )

  return (
    <>
      <h1>{TEXTOS.tituloReservas}</h1>
      <FiltrosDeReservas
        key={consultaDeFiltros({ ...filtros, pagina: 1 }).toString()}
        aplicados={filtros}
        ambientes={opcionesAmbiente}
        alAplicar={aplicar}
        alLimpiar={limpiar}
      />
      {error && <AvisoDeError mensaje={error} alReintentar={recargar} />}
      {cargando && <p role="status">{TEXTOS.cargandoReservas}</p>}
      {!cargando && !error && (
        <div className={estilos.resultado}>
          <TableList
            titulo={TEXTOS.tituloReservas}
            columnas={columnas}
            filas={datos.elementos}
            textoVacio={vacio}
          />
          {datos.total > 0 && (
            <p role="status" className={estilos.resumen}>
              {textoMostrando(datos.elementos.length, datos.total)}
            </p>
          )}
          <Paginacion
            pagina={datos.pagina}
            total={datos.total}
            tamano={datos.tamano}
            alCambiar={irAPagina}
          />
        </div>
      )}
    </>
  )
}
