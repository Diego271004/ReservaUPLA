import { TEXTOS } from '../constants/messages.js'

/** Las cuatro tarjetas por estado del Dashboard y de Mi ambiente: el total, pendientes, aprobadas y rechazadas. */
export const indicadoresDeEstado = ({ total, pendientes, aprobadas, rechazadas }) => [
  { clave: 'total', valor: total, descripcion: TEXTOS.indicadorTotal },
  { clave: 'pendientes', valor: pendientes, descripcion: TEXTOS.indicadorPendientes },
  { clave: 'aprobadas', valor: aprobadas, descripcion: TEXTOS.indicadorAprobadas },
  { clave: 'rechazadas', valor: rechazadas, descripcion: TEXTOS.indicadorRechazadas },
]
