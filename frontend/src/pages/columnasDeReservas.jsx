import Insignia from '../components/ui/Insignia.jsx'
import { TEXTOS } from '../constants/messages.js'
import { isoAFecha } from '../utils/fechas.js'
import { TIPO_INSIGNIA_DE_ESTADO } from '../utils/reservas.js'

/** Las columnas de las tablas de reservas, definidas una sola vez (Reservas, Dashboard y Mi ambiente eligen cuáles usan). */
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

/** `claves`: las columnas que se quieren, en orden ('fecha', 'horario', 'ambiente', 'solicitante', 'estado'); `acciones` es la última, propia de cada pantalla. */
export function columnasDeReservas(claves, acciones = null) {
  const columnas = claves.map((clave) => CATALOGO[clave])
  return acciones
    ? [...columnas, { clave: 'acciones', titulo: TEXTOS.columnaAcciones, render: acciones }]
    : columnas
}
