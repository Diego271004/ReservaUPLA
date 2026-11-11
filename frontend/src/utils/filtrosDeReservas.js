import { MENSAJES, TEXTOS } from '../constants/messages.js'
import { fechaAIso, isoAFecha, parsearFecha } from './fechas.js'

export const FILTROS_VACIOS = Object.freeze({ estado: '', ambienteId: '', desde: '', hasta: '' })

export const hayFiltros = (filtros) =>
  Boolean(filtros.estado || filtros.ambienteId || filtros.desde || filtros.hasta)

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

export function validarFiltros({ desde, hasta }) {
  const errores = { desde: errorDeFecha(desde), hasta: errorDeFecha(hasta) }
  if (!errores.desde && !errores.hasta && desde && hasta && fechaAIso(hasta) < fechaAIso(desde)) {
    errores.hasta = MENSAJES.rangoDeFechasInvalido
  }
  return errores
}

export function ambienteMasUtilizado(ambientes) {
  if (!ambientes || ambientes.length === 0) {
    return {
      valor: '—',
      detalle: 'Todavía no hay reservas aprobadas',
      esEmpate: false,
      empatados: [],
    }
  }
  const cantidad = ambientes[0].reservasAprobadas
  const esEmpate = ambientes.length > 1
  if (esEmpate) {
    return {
      valor: TEXTOS.empateAmbientes(ambientes.length, cantidad),
      detalle: `${cantidad} ${cantidad === 1 ? 'reserva aprobada' : 'reservas aprobadas'} cada uno`,
      esEmpate: true,
      empatados: ambientes.map((ambiente) => ambiente.nombre),
    }
  }
  const unidad = cantidad === 1 ? 'reserva aprobada' : 'reservas aprobadas'
  return {
    valor: ambientes[0].nombre,
    detalle: `${cantidad} ${unidad}`,
    esEmpate: false,
    empatados: [ambientes[0].nombre],
  }
}

export const claveDeConteo = (filtros) =>
  consultaDeFiltros({ ...filtros, estado: '', pagina: 1 }).toString()
