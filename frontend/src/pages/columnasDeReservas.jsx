import Insignia from '../components/ui/Insignia.jsx'
import { TEXTOS } from '../constants/messages.js'
import { isoAFecha } from '../utils/fechas.js'
import { TIPO_INSIGNIA_DE_ESTADO } from '../utils/reservas.js'

const CATALOGO = {
  fecha: {
    clave: 'fecha',
    titulo: TEXTOS.columnaFecha,
    render: (reserva) => isoAFecha(reserva.fecha),
  },
  horario: {
    clave: 'horario',
    titulo: TEXTOS.columnaHorario,
    render: (reserva) => `${reserva.horaInicio} – ${reserva.horaFin}`,
  },
  ambiente: { clave: 'ambienteNombre', titulo: TEXTOS.columnaAmbiente },
  solicitante: { clave: 'solicitanteNombre', titulo: TEXTOS.columnaSolicitante },
  estado: {
    clave: 'estado',
    titulo: TEXTOS.columnaEstado,
    render: (reserva) => (
      <Insignia tipo={TIPO_INSIGNIA_DE_ESTADO[reserva.estado]}>{reserva.estado}</Insignia>
    ),
  },
}

export function columnasDeReservas(claves, acciones = null) {
  const columnas = claves.map((clave) => CATALOGO[clave])
  return acciones
    ? [...columnas, { clave: 'acciones', titulo: TEXTOS.columnaAcciones, render: acciones }]
    : columnas
}
