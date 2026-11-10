import { codigoVs } from './codigo-vscode.js'
import { ev } from '../lib/codigo.js'
import { figs, figura, h1, h2, p, tabla, vinetas } from '../lib/word.js'

const FRONT = 'frontend/src'
const BACK = 'backend/ReservaUPLA.Application'

export function seccionFormularios() {
  return [
    h1('5. Formularios de entrada de datos (semana 05)'),
    p(
      'Se construyeron tres formularios, uno por entidad del enunciado: registrar usuario (RF-01), registrar ambiente (RF-02) y registrar solicitud de reserva (RF-03). Los tres se arman con los mismos componentes reutilizables (sección 7), la misma tarjeta (`FormularioTarjeta`) y el mismo hook de envío, de modo que se ven y se comportan igual.',
    ),
    h2('5.1 Campos de cada formulario'),
    ...tabla(
      ['Formulario', 'Campos', 'Detalles de uso'],
      [
        [
          'Registrar usuario',
          'Nombre completo, correo institucional, rol, activo y contraseña inicial',
          'Ejemplo del correo bajo el campo, contador de caracteres, política de la contraseña visible antes de escribir y botón «Mostrar»',
        ],
        [
          'Registrar ambiente',
          'Nombre, tipo, capacidad, ubicación, estado y responsable',
          'Tipo y estado como listas cerradas; el responsable se elige entre los usuarios con ese rol',
        ],
        [
          'Nueva reserva',
          'Ambiente, fecha, hora de inicio, hora de fin y motivo',
          'Ambiente en tarjetas (con capacidad y ubicación), horas como lista cerrada de 07:00 a 22:00 cada 30 minutos, atajos de duración (1, 2 o 3 h), aviso inmediato de disponibilidad y resumen en vivo de lo que se va a enviar',
        ],
      ],
      [0.2, 0.34, 0.46],
    ),
    h2('5.2 Nueva reserva (el formulario principal)'),
    ...codigoVs('hook-formulario'),
    ...figura('f-reserva-vacia', 'Formulario «Nueva reserva» recién abierto (Solicitante)', {
      tipo: 'App',
      que: 'La pantalla Nueva reserva con las tres tarjetas de ambiente y el resumen vacío.',
      pasos: ['Inicia sesión como Ana Torres.', 'Abre «Nueva reserva» en el menú.'],
      archivo: '20-nueva-reserva.png',
      seccion: '5',
    }),
    p(
      `El ambiente que está en mantenimiento aparece deshabilitado y con su motivo visible. El selector es un grupo de opciones accesible (\`role="radiogroup"\`) que se maneja con las flechas del teclado (\`${ev(`${FRONT}/components/ui/SelectorDeAmbientes.jsx`, 'role="radiogroup"')}\`). Cuando se elige el ambiente, la fecha y las horas, el formulario consulta la disponibilidad y avisa antes de enviar.`,
    ),
    ...figura('f-reserva-completa', 'Formulario con un ambiente elegido, horario y resumen en vivo', {
      tipo: 'App',
      que: 'La tarjeta elegida, la hora de inicio y fin y el resumen con la duración.',
      pasos: ['Elige el Auditorio Principal.', 'Elige la hora de inicio 15:00 y el atajo «2 h».', 'Escribe un motivo.'],
      archivo: '22-nueva-reserva-completa.png',
      seccion: '5',
    }),
    h2('5.3 Registrar ambiente y registrar usuario'),
    ...figura('f-ambiente', 'Formulario «Registrar ambiente» con un error de validación (Administrador)', {
      tipo: 'App',
      que: 'El formulario de ambiente con un mensaje junto al campo Capacidad.',
      pasos: ['Inicia sesión como Carla Rojas.', 'Abre «Nuevo ambiente».', 'Escribe 0 en Capacidad y pulsa «Registrar ambiente».'],
      archivo: '24-ambiente-nuevo-errores.png',
      seccion: '5',
    }),
    ...figura('f-usuario', 'Formulario «Registrar usuario» con tres errores a la vez (Administrador)', {
      tipo: 'App',
      que: 'El formulario de usuario con mensajes bajo el correo, el rol y la contraseña.',
      pasos: ['Abre «Nuevo usuario».', 'Escribe un correo sin arroba y una contraseña corta.', 'Pulsa «Registrar usuario».'],
      archivo: '25-usuario-nuevo-errores.png',
      seccion: '5',
    }),
    h2('5.4 Decisiones de usabilidad en los formularios'),
    ...codigoVs('campo-formulario'),
    ...vinetas([
      'Cada campo tiene su etiqueta visible siempre (no solo un texto de ayuda dentro del campo) y un ejemplo o una nota bajo él.',
      'Se valida al salir del campo y, una vez tocado, mientras se escribe: el error desaparece apenas se corrige. Al enviar, el foco va al primer campo con error.',
      'Los errores van junto al campo que los origina, con icono, texto y borde (nunca solo color).',
      'La hora es una lista cerrada, de modo que es imposible escribir una hora fuera de horario (RN-04) o un fin anterior al inicio (RN-03): se previene el error en lugar de solo avisarlo.',
      'Los botones dicen lo que hacen: «Registrar solicitud», «Registrar usuario», «Limpiar formulario» y «Volver».',
      'Todo el formulario se puede usar con el teclado, y en pantallas de 375 px los controles miden al menos 44 px.',
    ]),
  ]
}

export function seccionValidaciones() {
  return [
    h1('6. Validaciones en frontend y backend (semana 06)'),
    h2('6.1 Tres capas, un mismo mensaje'),
    ...codigoVs('validador-correo', 'validador-reserva', 'mensajes'),
    p(
      'Una regla importante nunca se valida en un solo sitio. **El frontend ayuda** (avisa a tiempo y evita errores), **el backend decide** (es la única validación en la que se puede confiar, porque una llamada directa a la API se salta el formulario) y **la base de datos es la última barrera** (restricciones y disparadores). Los mensajes tienen una sola fuente en cada lado, y una prueba falla si un texto existe en un lado y no en el otro.',
    ),
    h2('6.2 Dónde se aplica cada regla'),
    ...codigoVs('auth-servicio', 'servicio-cruce', 'entidad-reserva'),
    ...tabla(
      ['Regla', 'Frontend', 'Backend', 'Base de datos'],
      [
        [
          'RN-01 una sola aprobada por ambiente, fecha y horario',
          `Aviso inmediato de «ocupado» (\`${ev(`${FRONT}/hooks/useDisponibilidad.js`, 'export function useDisponibilidad')}\`)`,
          `Comprueba al registrar y al aprobar (\`${ev(`${BACK}/Services/ReservaService.cs`, 'private async Task<ResultadoOperacion<ReservaDetalleDto>?> ComprobarSinCruceAsync')}\`)`,
          `Restricción de exclusión (\`${ev('database/03_crear_tablas.sql', 'ex_reservas_aprobadas_sin_cruce')}\`)`,
        ],
        [
          'RN-02 datos obligatorios',
          `Campos requeridos con mensaje (\`${ev(`${FRONT}/utils/validators.js`, 'export function validarMotivo')}\`)`,
          `Validadores de los DTO (\`${ev(`${BACK}/Validators/CrearReservaValidator.cs`, 'RuleFor(x => x.Motivo)')}\`)`,
          'Columnas `NOT NULL`',
        ],
        [
          'RN-03 fin mayor que inicio',
          `La lista de fin solo ofrece horas posteriores (\`${ev(`${FRONT}/utils/validators.js`, 'export function validarHoraFin')}\`)`,
          `\`${ev(`${BACK}/Validators/ReglasDeCamposDeReserva.cs`, '.Must((dto, fin) => EsPosteriorAlInicio')}\``,
          `\`${ev('database/03_crear_tablas.sql', 'ck_reservas_fin_mayor_que_inicio')}\``,
        ],
        [
          'RN-04 entre 07:00 y 22:00',
          'La lista cerrada solo ofrece de 07:00 a 22:00 cada 30 minutos',
          `\`${ev(`${BACK}/Validators/ReglasDeCamposDeReserva.cs`, '.Must(EstaDentroDelHorario).WithMessage(MensajesValidacion.HoraFueraDeHorario)')}\``,
          `\`${ev('database/03_crear_tablas.sql', 'ck_reservas_horario_permitido')}\``,
        ],
        [
          'RN-05 solo el administrador aprueba o rechaza',
          'Los botones no aparecen a otros roles',
          `\`${ev('backend/ReservaUPLA.API/Controllers/ReservasController.cs', '[HttpPost("{id:int}/aprobar")]', '[Authorize(Roles = Roles.Administrador)]')}\` (responde 403)`,
          'No aplica (la identidad se comprueba en la API)',
        ],
        [
          'RN-06 una rechazada no se modifica',
          'Acciones deshabilitadas con la razón a la vista',
          `\`${ev('backend/ReservaUPLA.Domain/Entities/Reserva.cs', 'public void Aprobar')}\` (el dominio exige estado pendiente; responde 409)`,
          `Disparador \`${ev('database/03_crear_tablas.sql', 'CREATE OR REPLACE FUNCTION fn_reservas_validar_transicion')}\``,
        ],
      ],
      [0.2, 0.24, 0.3, 0.26],
    ),
    h2('6.3 Evidencia de las validaciones'),
    p('Las figuras siguientes muestran las validaciones funcionando en la interfaz con el sistema real.'),
    ...figura('f-val-reserva', 'Enviar «Nueva reserva» vacía: un mensaje junto a cada campo y el foco en el primero', {
      tipo: 'App',
      que: 'Mensajes «Selecciona un ambiente.», «Selecciona la hora de inicio.» y «Ingresa el motivo de la reserva.».',
      pasos: ['Abre «Nueva reserva» como Solicitante.', 'Pulsa «Registrar solicitud» sin llenar nada.'],
      archivo: '21-nueva-reserva-errores.png',
      seccion: '6',
    }),
    ...figura('f-val-ocupado', 'RN-01: aviso de disponibilidad con un tramo ocupado marcado «Choque»', {
      tipo: 'App',
      que: 'La franja de disponibilidad con un tramo aprobado y la etiqueta Choque.',
      pasos: ['Elige el Auditorio Principal.', 'Escribe la fecha y el horario de una reserva ya aprobada.'],
      archivo: '23-nueva-reserva-ocupado.png',
      seccion: '6',
    }),
    ...figura('f-val-login', 'Credenciales incorrectas: mensaje genérico que no revela si el correo existe', {
      tipo: 'App',
      que: 'El login con la alerta «El correo o la contraseña no son correctos…».',
      pasos: ['Abre el login.', 'Escribe un correo válido y una contraseña equivocada.'],
      archivo: '04-login-error.png',
      seccion: '6',
    }),
    h2('6.4 Pruebas que rompen cada regla a propósito'),
    p(
      'Cada regla tiene, en cada capa, una prueba que intenta violarla. La matriz completa, con el nombre exacto de cada prueba, está en `docs/matriz-reglas.md`. Ejemplos de las más importantes:',
    ),
    ...vinetas([
      '**RN-01 con concurrencia y base real:** `ConcurrenciaAprobacionTests.RN01_dos_aprobaciones_simultaneas_que_se_cruzan_dan_un_200_y_un_409_y_una_sola_Aprobada` lanza dos aprobaciones a la vez; la base deja pasar una y rechaza la otra, y la API responde 409 con la hora ocupada.',
      '**RN-05:** `ReservasEndpointsTests.RN05_solo_el_Administrador_aprueba_o_rechaza_los_demas_reciben_403` (HTTP 403) y las pruebas del frontend que verifican que un Solicitante no ve «Aprobar».',
      '**RN-06:** `ReservaTests.RN06_los_estados_finales_no_admiten_ninguna_transicion` en el dominio y `07_pruebas_reglas.sql` en la base (intenta pasar una rechazada a aprobada y exige que falle).',
      '**RN-03 y RN-04:** `ReservaServiceTests.RN03_hora_de_fin_no_posterior_al_inicio_se_rechaza`, `RN04_hora_de_inicio_antes_de_las_0700_se_rechaza` y los límites exactos 07:00 y 22:00 como válidos.',
    ]),
    p(
      'Un límite honesto: el frontend **ayuda, no decide**. Ocultar un botón no impide una llamada directa a la API, por eso cada regla se prueba también en el backend y en la base. Y el aviso de RN-01 del frontend no impide enviar la solicitud: entre el aviso y el envío otra persona puede haber aprobado una reserva, así que la decisión final siempre la toma el servidor (y, en última instancia, la base).',
    ),
  ]
}
