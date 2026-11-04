import { MENSAJES } from '../constants/messages.js'
import { fechaAIso, isoAFecha, parsearFecha } from './fechas.js'

/** Los filtros de la lista de Reservas. Las fechas se escriben dd/mm/aaaa; en la dirección y en la API van aaaa-mm-dd. */
export const FILTROS_VACIOS = Object.freeze({ estado: '', ambienteId: '', desde: '', hasta: '' })

export const hayFiltros = (filtros) =>
  Boolean(filtros.estado || filtros.ambienteId || filtros.desde || filtros.hasta)

/** Los filtros y la página que dice la dirección (?estado=&ambienteId=&desde=&hasta=&pagina=). */
export function filtrosDeBusqueda(buscar) {
  const pagina = Number.parseInt(buscar.get('pagina') ?? '', 10)
  return {
    estado: buscar.get('estado') ?? '',
    ambienteId: buscar.get('ambienteId') ?? '',
    desde: isoAFecha(buscar.get('desde')),
    hasta: isoAFecha(buscar.get('hasta')),
    pagina: Number.isInteger(pagina) && pagina >= 1 ? pagina : 1,
  }
}

/** La dirección (y la consulta a la API) de unos filtros: solo lo que tiene valor; la página 1 no se escribe. */
export function consultaDeFiltros({ estado, ambienteId, desde, hasta, pagina = 1 }) {
  const consulta = new URLSearchParams()
  if (estado) consulta.set('estado', estado)
  if (ambienteId) consulta.set('ambienteId', ambienteId)
  if (fechaAIso(desde)) consulta.set('desde', fechaAIso(desde))
  if (fechaAIso(hasta)) consulta.set('hasta', fechaAIso(hasta))
  if (pagina > 1) consulta.set('pagina', String(pagina))
  return consulta
}

const errorDeFecha = (valor) =>
  valor && !parsearFecha(valor) ? MENSAJES.fechaFormatoInvalido : null

/**
 * Valida las dos fechas del filtro. Pueden estar vacías y pueden ser pasadas (se consulta lo que ya pasó);
 * la final no puede ser anterior a la inicial.
 */
export function validarFiltros({ desde, hasta }) {
  const errores = { desde: errorDeFecha(desde), hasta: errorDeFecha(hasta) }
  if (!errores.desde && !errores.hasta && desde && hasta && fechaAIso(hasta) < fechaAIso(desde)) {
    errores.hasta = MENSAJES.rangoDeFechasInvalido
  }
  return errores
}

/** Lo que muestra la tarjeta «Ambiente más utilizado»: el nombre (o los nombres, si empatan) y cuántas reservas aprobadas. */
export function ambienteMasUtilizado(ambientes) {
  if (ambientes.length === 0) return { valor: '—', detalle: 'Todavía no hay reservas aprobadas' }
  const cantidad = ambientes[0].reservasAprobadas
  const unidad = cantidad === 1 ? 'reserva aprobada' : 'reservas aprobadas'
  return {
    valor: ambientes.map((ambiente) => ambiente.nombre).join(' y '),
    detalle: `${cantidad} ${unidad}${ambientes.length > 1 ? ' cada uno' : ''}`,
  }
}
