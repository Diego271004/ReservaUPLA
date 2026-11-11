import { TEXTOS } from '../constants/messages.js'

export const indicadoresDeEstado = ({ total, pendientes, aprobadas, rechazadas }) => [
  {
    clave: 'total',
    valor: total,
    descripcion: TEXTOS.indicadorTotal,
    detalle: TEXTOS.incluyeCanceladas,
    icono: 'reservas',
    tono: 'info',
  },
  {
    clave: 'pendientes',
    valor: pendientes,
    descripcion: TEXTOS.indicadorPendientes,
    icono: 'reloj',
    tono: 'aviso',
  },
  {
    clave: 'aprobadas',
    valor: aprobadas,
    descripcion: TEXTOS.indicadorAprobadas,
    icono: 'marca',
    tono: 'exito',
  },
  {
    clave: 'rechazadas',
    valor: rechazadas,
    descripcion: TEXTOS.indicadorRechazadas,
    icono: 'equis',
    tono: 'error',
  },
]
