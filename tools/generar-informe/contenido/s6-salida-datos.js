import { codigoVs } from './codigo-vscode.js'
import { ev } from '../lib/codigo.js'
import { figura, h1, h2, p, tabla, vinetas } from '../lib/word.js'

const CS = 'backend/ReservaUPLA.Application/Services/ConsultaService.cs'
const REPO = 'backend/ReservaUPLA.Infrastructure/Repositories/ReservaRepository.cs'
const FRONT = 'frontend/src'

export function seccionSalida() {
  return [
    h1('9. Módulos de salida de datos y dashboard (semana 09)'),
    p(
      'Los módulos de salida muestran lo que el sistema sabe: el listado de reservas (RF-05), el detalle con su historial y el cambio de estado (RF-06 y RF-07) y el dashboard (RF-08). Cada rol ve solo lo que le corresponde: el Solicitante sus reservas, el Responsable las de su ambiente y el Administrador todas.',
    ),
    h2('9.1 Listado de reservas (RF-05)'),
    p(
      'El listado tiene pestañas por estado con su cantidad, filtros por ambiente y rango de fechas, tabla con insignias de estado (icono más texto, nunca solo color) y paginación del lado del servidor. El alcance por rol se aplica en la consulta a la base, no en pantalla: lo que no le corresponde al rol nunca sale de la base de datos.',
    ),
    ...figura('f-listado', 'Listado de reservas con pestañas por estado, filtros y tabla (Administrador)', {
      tipo: 'App',
      que: 'Las pestañas Todas, Pendientes, Aprobadas, Rechazadas y Canceladas con su número, los filtros y la tabla.',
      pasos: ['Inicia sesión como Carla Rojas.', 'Abre «Reservas».'],
      archivo: '12-reservas.png',
      seccion: '9',
    }),
    p(`Implementación: \`${ev(`${FRONT}/pages/ReservasPage.jsx`, 'export default function ReservasPage')}\` (pantalla) y \`${ev(REPO, 'public async Task<PaginaDeReservasDto> ListarAsync')}\` (consulta con el alcance del rol).`),
    h2('9.2 Detalle y cambio de estado (RF-06 y RF-07)'),
    ...codigoVs('controlador', 'modal'),
    p(
      'El detalle muestra el ambiente, el horario en letras con su duración, el estado destacado y el historial como una línea de tiempo: quién hizo cada cambio y cuándo. Las acciones dependen del rol y del estado. Aprobar y rechazar piden confirmación con el verbo exacto («Sí, aprobar»), y si aprobar causaría un choque, el botón queda deshabilitado y una tarjeta explica el choque y enlaza a la reserva que lo causa.',
    ),
    ...figura('f-detalle', 'Detalle de una reserva pendiente con su historial y acciones (Administrador)', {
      tipo: 'App',
      que: 'El encabezado con el estado, los datos, el historial y los botones.',
      pasos: ['Abre una reserva pendiente desde «Reservas» → «Ver detalle».'],
      archivo: '15-detalle-pendiente.png',
      seccion: '9',
    }),
    ...figura('f-choque', 'Reserva pendiente que choca con una aprobada: «Aprobar» queda deshabilitado y se explica por qué', {
      tipo: 'App',
      que: 'La tarjeta de conflicto con el enlace a la reserva aprobada y el botón Aprobar deshabilitado.',
      pasos: ['Abre la solicitud que muestra «Choca con una reserva ya aprobada» en el Inicio.'],
      archivo: '16-detalle-con-choque.png',
      seccion: '9',
    }),
    ...figura('f-modal', 'Confirmación antes de decidir: el modal dice lo que se va a hacer', {
      tipo: 'App',
      que: 'El modal con el título, el resumen de la reserva y los botones «Volver» y el verbo de la acción.',
      pasos: ['Pulsa «Rechazar» (o «Aprobar») en el detalle.'],
      archivo: '17-modal-aprobar.png',
      seccion: '9',
    }),
    h2('9.3 Dashboard (RF-08)'),
    ...codigoVs('actividad-reciente'),
    p('El caso pide cinco indicadores como mínimo. Los cinco están, y se calculan en el servidor con consultas a la base de datos, no con datos de ejemplo.'),
    ...tabla(
      ['Indicador del caso', 'Cómo se calcula', 'Dónde'],
      [
        ['Total de reservas', 'Cantidad de reservas registradas (incluye las canceladas, y la tarjeta lo dice)', ev(REPO, 'public async Task<IndicadoresDto> ContarAsync')],
        ['Reservas pendientes', 'Cantidad en estado Pendiente', ev(REPO, 'public async Task<IndicadoresDto> ContarAsync')],
        ['Reservas aprobadas', 'Cantidad en estado Aprobada', ev(REPO, 'public async Task<IndicadoresDto> ContarAsync')],
        ['Reservas rechazadas', 'Cantidad en estado Rechazada', ev(REPO, 'public async Task<IndicadoresDto> ContarAsync')],
        ['Ambiente más utilizado', 'El de más reservas aprobadas; si hay empate se muestran todos', ev(REPO, 'public async Task<IReadOnlyList<AmbienteUsoDto>> AmbientesMasUtilizadosAsync')],
      ],
      [0.25, 0.5, 0.25],
    ),
    p(
      `El servicio que arma todo el dashboard está en \`${ev(CS, 'public async Task<DashboardDto> ObtenerDashboardAsync')}\` y la pantalla del Administrador en \`${ev(`${FRONT}/pages/InicioAdministrador.jsx`, 'export default function InicioAdministrador')}\`.`,
    ),
    ...figura('f-dashboard', 'Inicio del Administrador: decisiones pendientes, agenda de hoy e indicadores', {
      tipo: 'App',
      que: 'El banner con las solicitudes por decidir, los accesos rápidos y la lista «Requieren tu decisión».',
      pasos: ['Inicia sesión como Carla Rojas.'],
      archivo: '05-inicio-admin.png',
      seccion: '9',
    }),
    ...figura('f-indicadores', 'Los cuatro indicadores por estado, el ambiente más utilizado y los indicadores de gestión', {
      tipo: 'App',
      que: 'Las tarjetas Total, Pendientes, Aprobadas y Rechazadas, el ambiente más utilizado (con empate) y la tasa de aprobación y la ocupación de hoy.',
      pasos: ['Desplázate en el Inicio hasta los indicadores.'],
      archivo: '06-inicio-admin-indicadores.png',
      seccion: '9',
    }),
    h2('9.4 Más allá del mínimo'),
    ...vinetas([
      '**Dos indicadores de gestión:** la tasa de aprobación (aprobadas ÷ aprobadas más rechazadas; las pendientes y canceladas no cuentan) y la ocupación de hoy (horas aprobadas ÷ horas disponibles de los ambientes que hoy no están en mantenimiento). Si no hay datos muestran «—» en vez de inventar un número. Cálculo en `frontend/src/utils/gestion.js`, con pruebas de borde.',
      '**Actividad reciente:** los últimos seis cambios de estado de cualquier reserva con quién los hizo y cuándo. Es la respuesta visible a la «falta de trazabilidad» del caso; el backend la expone solo al Administrador.',
      '**Accesos rápidos** a las cuatro tareas más frecuentes del Administrador.',
      '**Inicio del Solicitante y del Responsable**, cada uno con lo que necesita: su próxima reserva y el estado de sus solicitudes, o la agenda de su ambiente.',
      '**Vista diaria de disponibilidad** con tramos libres, aprobados, pendientes y en mantenimiento, que lleva a «Nueva reserva» con el ambiente, la fecha y la hora ya elegidos.',
    ]),
    ...figura('f-actividad', 'Actividad reciente: quién cambió el estado de qué reserva y cuándo', {
      tipo: 'App',
      que: 'La lista de cambios recientes junto al uso por ambiente.',
      pasos: ['Desplázate hasta el final del Inicio del Administrador.'],
      archivo: '07-inicio-admin-actividad.png',
      seccion: '9',
    }),
    ...figura('f-solicitante', 'Inicio del Solicitante: su próxima reserva vigente y sus solicitudes por estado', {
      tipo: 'App',
      que: 'La próxima reserva aprobada y las tarjetas por estado.',
      pasos: ['Inicia sesión como Ana Torres.'],
      archivo: '09-inicio-solicitante.png',
      seccion: '9',
    }),
    ...figura('f-responsable', 'Inicio del Responsable de ambiente: solo consulta, sin acciones de decisión', {
      tipo: 'App',
      que: 'Sus ambientes, las reservas de hoy y las próximas.',
      pasos: ['Inicia sesión como Mario Huamán.'],
      archivo: '10-inicio-responsable.png',
      seccion: '9',
    }),
    ...figura('f-disponibilidad', 'Vista diaria de disponibilidad por ambiente', {
      tipo: 'App',
      que: 'La línea de tiempo de 07:00 a 22:00 con tramos libres, aprobados, pendientes y mantenimiento.',
      pasos: ['Abre «Disponibilidad» en el menú.'],
      archivo: '14-disponibilidad.png',
      seccion: '9',
    }),
  ]
}
