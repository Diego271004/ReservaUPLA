import { ev } from '../lib/codigo.js'
import { h1, h2, p, tabla, vinetas } from '../lib/word.js'

const CTRL = 'backend/ReservaUPLA.API/Controllers'
const SQL = 'database/03_crear_tablas.sql'

export function seccionAnalisis() {
  return [
    h1('1. Análisis del problema, actores y alcance (semana 01)'),
    h2('1.1 Problema'),
    p(
      'La Universidad Peruana Los Andes administra laboratorios de cómputo, auditorios, salas de reuniones y laboratorios especializados. Hoy las reservas se piden por mensajes, llamadas o documentos físicos. El caso identifica cuatro consecuencias, y cada una se atiende con una parte concreta del sistema.',
    ),
    ...tabla(
      ['Consecuencia reportada', 'Causa', 'Cómo la atiende ReservaUPLA'],
      [
        ['Duplicidad de reservas', 'Nadie comprueba que el ambiente esté libre a esa hora', 'RF-04 y RN-01: se valida la disponibilidad y la base de datos impide dos reservas aprobadas que se crucen'],
        ['Pérdida de solicitudes', 'La solicitud vive en un mensaje o un papel', 'RF-03 y RF-05: toda solicitud queda registrada y se puede listar y filtrar'],
        ['Falta de trazabilidad', 'No se sabe quién pidió, quién aprobó ni cuándo', 'RF-06 y RF-07: detalle con su historial de estados, y «Actividad reciente» en el dashboard'],
        ['Dificultad para conocer la disponibilidad real', 'No hay una vista única', 'RF-05 y RF-08: listado con filtros, dashboard y vista diaria de disponibilidad'],
      ],
      [0.25, 0.3, 0.45],
    ),
    h2('1.2 Actores'),
    ...tabla(
      ['Actor', 'Responsabilidad (según el caso)', 'Qué necesita del sistema'],
      [
        ['Solicitante', 'Registra solicitudes de reserva', 'Pedir un ambiente, saber si está libre, ver el estado de sus solicitudes y cancelarlas'],
        ['Administrador', 'Aprueba o rechaza reservas', 'Ver las solicitudes pendientes, decidir con la seguridad de que no habrá cruces y ver el panorama general'],
        ['Responsable de ambiente', 'Consulta el uso del ambiente asignado', 'Ver las reservas de su ambiente, sin poder aprobarlas'],
      ],
      [0.22, 0.3, 0.48],
    ),
    p(
      'El caso habla de «ambiente asignado», pero el modelo mínimo no dice a quién está asignado un ambiente. Por eso el modelo se amplía con `ResponsableId` en Ambiente (sección 4.3).',
    ),
    h2('1.3 Alcance'),
    p(
      '**Incluye:** registro de usuarios, ambientes y reservas; validación de disponibilidad; listado y detalle de reservas; cambio de estado; dashboard con los cinco indicadores; roles y control de permisos.',
    ),
    p(
      '**No incluye** (queda fuera por no ser parte del reto): notificaciones por correo, reservas recurrentes, calendario semanal o mensual, exportación a PDF o Excel, recuperación de contraseña y varias sedes. La vista diaria de disponibilidad apoya RF-04 y RF-08, pero no es el calendario excluido: es una línea de tiempo acotada al día elegido.',
    ),
    h2('1.4 Requerimientos funcionales y su evidencia'),
    p('Cada requerimiento del caso con el archivo y la línea donde se implementa (comprobados al generar este informe).'),
    ...tabla(
      ['Código', 'Requerimiento', 'Backend', 'Frontend'],
      [
        ['RF-01', 'Registrar usuarios solicitantes', ev(`${CTRL}/UsuariosController.cs`, '[HttpPost]'), ev('frontend/src/pages/UsuarioFormPage.jsx', 'export default function UsuarioFormPage')],
        ['RF-02', 'Registrar ambientes universitarios', ev(`${CTRL}/AmbientesController.cs`, '[HttpPost]'), ev('frontend/src/pages/AmbienteFormPage.jsx', 'export default function AmbienteFormPage')],
        ['RF-03', 'Registrar solicitudes de reserva', ev(`${CTRL}/ReservasController.cs`, '[HttpPost]'), ev('frontend/src/pages/NuevaReservaPage.jsx', 'export default function NuevaReservaPage')],
        ['RF-04', 'Validar disponibilidad antes de registrar', ev(`${CTRL}/ReservasController.cs`, '[HttpGet("disponibilidad")]'), ev('frontend/src/hooks/useDisponibilidad.js', 'export function useDisponibilidad')],
        ['RF-05', 'Listar reservas registradas', ev(`${CTRL}/ReservasController.cs`, '[HttpGet]'), ev('frontend/src/pages/ReservasPage.jsx', 'export default function ReservasPage')],
        ['RF-06', 'Consultar detalle de una reserva', ev(`${CTRL}/ReservasController.cs`, '[HttpGet("{id:int}")]'), ev('frontend/src/pages/DetalleReservaPage.jsx', 'export default function DetalleReservaPage')],
        ['RF-07', 'Cambiar el estado: Pendiente, Aprobada, Rechazada o Cancelada', ev(`${CTRL}/ReservasController.cs`, '[HttpPost("{id:int}/aprobar")]'), ev('frontend/src/pages/DetalleReservaPage.jsx', 'export default function DetalleReservaPage')],
        ['RF-08', 'Mostrar indicadores básicos en un dashboard', ev(`${CTRL}/PanelesController.cs`, '[HttpGet("api/dashboard")]'), ev('frontend/src/pages/InicioAdministrador.jsx', 'export default function InicioAdministrador')],
      ],
      [0.09, 0.31, 0.3, 0.3],
    ),
    h2('1.5 Reglas de negocio'),
    p(
      'Una regla importante nunca se valida en un solo sitio: el frontend ayuda al usuario, el backend decide y la base de datos es la última barrera. La sección 6 detalla cada regla con su prueba. El caso pide RN-01 a RN-06; se agregaron dos reglas razonadas y se dejaron registradas en el análisis.',
    ),
    ...tabla(
      ['Regla', 'Enunciado'],
      [
        ['RN-01', 'No más de una reserva aprobada para el mismo ambiente, fecha y horario'],
        ['RN-02', 'Toda reserva registra fecha, hora de inicio, hora de fin, ambiente, solicitante y motivo'],
        ['RN-03', 'La hora de fin es mayor que la de inicio'],
        ['RN-04', 'Solo entre las 07:00 y las 22:00'],
        ['RN-05', 'Solo el administrador aprueba o rechaza'],
        ['RN-06', 'Una reserva rechazada no se modifica (también es final la cancelada, decisión propia)'],
        ['RN-07 (agregada)', 'No se reserva para una fecha anterior a hoy (hoy es la fecha de Lima); solo se controla al registrar, nunca al cambiar de estado'],
        ['Mantenimiento (agregada)', 'Un ambiente en mantenimiento no admite reservas nuevas'],
      ],
      [0.22, 0.78],
    ),
    p('Transiciones de estado permitidas:'),
    ...tabla(
      ['Desde', 'Hacia', 'Quién'],
      [
        ['Pendiente', 'Aprobada', 'Administrador, solo si no hay cruce con otra aprobada (RN-01)'],
        ['Pendiente', 'Rechazada', 'Administrador'],
        ['Pendiente o Aprobada', 'Cancelada', 'El solicitante dueño de la reserva o el administrador'],
        ['Rechazada, Cancelada', '(ninguna)', 'Estados finales (RN-06)'],
      ],
      [0.25, 0.2, 0.55],
    ),
    h2('1.6 Decisiones de análisis'),
    ...vinetas([
      '**Inicio de sesión mínimo con rol.** El caso no lo pide, pero sin identificar al usuario no se puede cumplir RN-05 en el backend.',
      '**La disponibilidad se valida solo contra reservas aprobadas**, que es lo que dice RN-01. Las pendientes pueden coexistir y el administrador aprueba una y rechaza la otra.',
      '**«Ambiente más utilizado»** es el que tiene más reservas aprobadas; si hay empate se muestran todos los empatados.',
      '**RN-07 y mantenimiento** se agregaron por sentido común del dominio. Se documentó que su cumplimiento está en las tres capas y que RN-07 no se aplica al cambiar de estado para no bloquear reservas antiguas.',
    ]),
    p(
      `La restricción de RN-01 en la base de datos está en \`${ev(SQL, 'ex_reservas_aprobadas_sin_cruce')}\` y se explica en la sección 6.`,
    ),
  ]
}
