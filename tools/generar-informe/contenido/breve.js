import { readFileSync } from 'node:fs'
import path from 'node:path'
import { Paragraph, ShadingType, TextRun } from 'docx'
import { figura, h1, h2, p, tabla, vinetas } from '../lib/word.js'
import { RAIZ } from '../lib/codigo.js'
import { BUILD, DUPLICACION, PRUEBAS } from '../lib/datos.js'

const fig = (id, titulo, archivo) => figura(id, titulo, { tipo: 'App', que: titulo, pasos: [], archivo, seccion: '' })

let numeroCodigo = 0
/**
 * Fragmento de código REAL del repositorio: se busca la línea ancla y se copian `n` líneas desde ella.
 * Si el ancla no existe el informe no se genera (así el código citado nunca queda desactualizado).
 */
function codigo(ruta, ancla, n, titulo) {
  const lineas = readFileSync(path.join(RAIZ, ruta), 'utf8').split(/\r?\n/)
  const ini = lineas.findIndex((l) => l.includes(ancla))
  if (ini < 0) throw new Error(`Ancla no encontrada en ${ruta}: ${ancla}`)
  const fin = Math.min(lineas.length, ini + n)
  numeroCodigo += 1
  const bloque = lineas.slice(ini, fin).map(
    (linea) =>
      new Paragraph({
        spacing: { after: 0, line: 240 },
        shading: { type: ShadingType.CLEAR, color: 'auto', fill: 'F2F2F2' },
        children: [new TextRun({ text: linea.replaceAll('\t', '  ') || ' ', font: 'Consolas', size: 17 })],
      }),
  )
  return [
    p(`**Código ${numeroCodigo}.** ${titulo} (\`${ruta}\`, líneas ${ini + 1}–${fin}).`, { size: 20 }),
    ...bloque,
    new Paragraph({ spacing: { after: 160 } }),
  ]
}

/** Informe técnico breve (~15 páginas): cada tema con su explicación, la captura o el código que la respalda. */
export function cuerpoBreve() {
  return [
    p('**Repositorio del proyecto (GitHub):** [COMPLETAR POR EL ESTUDIANTE: enlace del repositorio, por ejemplo https://github.com/usuario/ReservaUPLA]. Rama de trabajo: `feature/diseno-final`. El README explica cómo crear la base de datos por terminal, configurar los secretos y ejecutar backend, frontend y pruebas.'),
    h1('1. Problema, actores y alcance'),
    p('Las reservas de laboratorios, auditorios y salas de la UPLA se hacían por mensajes, llamadas y papel: había duplicidad de reservas, solicitudes perdidas y ninguna trazabilidad. ReservaUPLA centraliza el flujo: el solicitante pide un ambiente, el sistema comprueba la disponibilidad, el administrador aprueba o rechaza y cada cambio queda registrado con quién lo hizo y cuándo.'),
    ...vinetas([
      '**Actores:** Administrador (decide y gestiona ambientes y usuarios), Solicitante (pide y consulta sus reservas) y Responsable de ambiente (solo consulta).',
      '**Alcance:** registro, validación, aprobación, consulta, disponibilidad diaria y dashboard. Fuera de alcance: correos, reservas recurrentes, calendario mensual, exportación y recuperación de contraseña.',
      '**Reglas del caso:** RN-01 dos reservas aprobadas del mismo ambiente no se cruzan; RN-02 todos los datos son obligatorios; RN-03 la hora de fin es posterior a la de inicio; RN-04 el horario permitido es de 07:00 a 22:00; RN-05 solo el Administrador aprueba o rechaza; RN-06 una reserva aprobada, rechazada o cancelada no cambia de estado.',
    ]),

    h1('2. Ciclo de vida y estándares de construcción'),
    p('Se eligió un modelo **incremental e iterativo**: los requisitos del caso son estables, pero el valor se entrega por incrementos (reservar, decidir, consultar y visualizar), cada uno cerrado con su prueba. Se descartó la cascada porque no da retroalimentación temprana, y la espiral porque su gestión de riesgos es excesiva para un equipo de una persona.'),
    h2('2.1 Estándares'),
    ...vinetas([
      '**Nombres:** dominio en español (Reserva, Ambiente, Usuario) y términos técnicos en inglés cuando son convención (Service, Repository, Validator).',
      '**Carpetas:** backend en cuatro capas (Domain, Application, Infrastructure, API) y frontend por pages, components, hooks, services y utils.',
      '**Dependencias:** Application nunca referencia Infrastructure; Application define las interfaces e Infrastructure las implementa.',
      '**Commits y ramas:** «tipo: descripción» en español y una rama por tema.',
    ]),
    p('Un estándar que nadie comprueba se olvida, así que los más importantes son pruebas automáticas. Por ejemplo, esta prueba falla si Application referencia Infrastructure:'),
    ...codigo('backend/ReservaUPLA.Application.Tests/ArquitecturaTests.cs', 'public void Application_no_referencia_Infrastructure', 6, 'Prueba de arquitectura'),

    h1('3. Estructura: backend, frontend y base de datos'),
    p('El backend usa ASP.NET Core (.NET 8) con Clean Architecture; el frontend, React con Vite. La base de datos PostgreSQL se crea **por terminal con scripts SQL numerados** (carpeta `database/`, del 00 al 07), sin migraciones ni tablas creadas desde el código: el esquema queda legible, revisable y reproducible desde cero.'),
    ...tabla(
      ['Capa', 'Responsabilidad', 'Depende de'],
      [
        ['Domain', 'Entidades y reglas del negocio (Reserva, Ambiente, Usuario)', 'Nada'],
        ['Application', 'Casos de uso, validadores, interfaces y mensajes', 'Domain'],
        ['Infrastructure', 'EF Core, repositorios, BCrypt y JWT', 'Application y Domain'],
        ['API', 'Controladores delgados, autenticación, límite de intentos y CORS', 'Application e Infrastructure'],
      ],
      [0.2, 0.55, 0.25],
    ),
    p('La API se conecta con un rol de PostgreSQL de **mínimo privilegio** (no con `postgres`), las contraseñas se guardan solo como hash BCrypt y los secretos viven en `user-secrets`, nunca en archivos versionados. El inicio de sesión permite cinco intentos por minuto y responde con el mismo mensaje si el correo no existe, está inactivo o la contraseña es incorrecta.'),
    ...fig('b-login', 'Pantalla de inicio de sesión', '01-login.png'),

    h1('4. Formularios de entrada de datos'),
    p('Los formularios (nueva reserva, registrar ambiente, registrar usuario e inicio de sesión) siguen las mismas reglas: etiqueta siempre visible, ayuda con ejemplo bajo el campo, error junto al campo con icono y texto (nunca solo color), foco en el primer campo con error y manejo completo con teclado. Todos se construyen con los mismos componentes reutilizables.'),
    ...fig('b-reserva', 'Formulario «Nueva reserva» con ambiente, horario y resumen en vivo', '22-nueva-reserva-completa.png'),
    ...fig('b-ambiente', 'Formulario «Registrar ambiente» con un error de validación', '24-ambiente-nuevo-errores.png'),

    h1('5. Validaciones en frontend, backend y base de datos'),
    p('Cada regla se valida en **tres capas**, con los mismos mensajes. El frontend guía al usuario mientras escribe; el backend decide, porque nunca se confía en lo que llega del cliente; y la base de datos es la última barrera. Así una regla se cumple aunque alguien se salte el formulario.'),
    h2('5.1 Frontend'),
    p('Funciones puras, fáciles de probar, que normalizan el dato y devuelven el mensaje de error o `null`:'),
    ...codigo('frontend/src/utils/validators.js', 'export function validarCorreo', 12, 'Validación del correo en el frontend'),
    ...fig('b-errores', 'Enviar «Nueva reserva» vacía: un mensaje junto a cada campo y el foco en el primero', '21-nueva-reserva-errores.png'),
    h2('5.2 Backend'),
    p('FluentValidation separa las reglas de entrada de la lógica del caso de uso. Los textos salen de una sola clase de mensajes:'),
    ...codigo('backend/ReservaUPLA.Application/Validators/CrearReservaValidator.cs', 'public CrearReservaValidator()', 12, 'Validador de la reserva (RN-02, RN-03 y RN-04)'),
    p('Las reglas que consultan datos, como el cruce de horarios (RN-01), las evalúa el servicio y responden con un conflicto explicado:'),
    ...codigo('backend/ReservaUPLA.Application/Services/ReservaService.cs', 'private async Task<ResultadoOperacion<ReservaDetalleDto>?> ComprobarSinCruceAsync', 10, 'Comprobación de cruce al aprobar (RN-01)'),
    p('El dominio protege además las transiciones de estado (RN-06): una reserva que ya salió de «Pendiente» no se puede aprobar ni rechazar de nuevo.'),
    ...codigo('backend/ReservaUPLA.Domain/Entities/Reserva.cs', '/// <summary>Pendiente → Aprobada', 13, 'Transiciones de estado en la entidad'),
    h2('5.3 Base de datos'),
    p('La restricción de exclusión de PostgreSQL garantiza RN-01 aunque dos personas aprueben a la vez: la segunda aprobación falla en la base de datos.'),
    ...codigo('database/03_crear_tablas.sql', '-- RN-01: dos reservas Aprobadas', 5, 'Restricción de exclusión que impide el cruce de reservas aprobadas'),
    ...fig('b-usuario', 'Formulario «Registrar usuario» con errores de validación junto a cada campo', '25-usuario-nuevo-errores.png'),
    ...fig('b-ocupado','RN-01: aviso de disponibilidad con un tramo ocupado marcado «Choque»', '23-nueva-reserva-ocupado.png'),
    ...fig('b-login-error', 'Credenciales incorrectas: mensaje genérico que no revela si el correo existe', '04-login-error.png'),

    h1('6. Reutilización de componentes'),
    p(`Se construyeron los nueve componentes mínimos del caso (TextInput, SelectInput, DateInput, TimeInput, Button, AlertMessage, ModalConfirmacion, TableList y CardIndicador) y hooks compartidos. Cada pantalla los usa en lugar de escribir su propio botón, campo o tabla. La duplicación medida con ${DUPLICACION.herramienta} bajó de ${DUPLICACION.antes} a ${DUPLICACION.despues}.`),
    p('Un ejemplo: el botón único del sistema decide sus variantes, el estado de carga y el bloqueo de doble clic en un solo lugar, así que todas las pantallas que lo usan se comportan igual.'),
    ...codigo('frontend/src/components/ui/Button.jsx', 'const alHacerClic', 8, 'Bloqueo de doble envío en el botón reutilizable'),
    p('Todos los colores, radios y sombras salen de un solo archivo de tokens. Gracias a eso, el modo oscuro se agregó al final redefiniendo los tokens, sin tocar ningún componente:'),
    ...codigo('frontend/src/styles/tokens.css', '--color-primario: #0063a8', 6, 'Tokens de color (tema claro)'),
    ...fig('b-oscuro', 'El mismo Inicio del Administrador en modo oscuro', '08-inicio-admin-oscuro.png'),

    h1('7. Refinamiento de código'),
    p('El refinamiento se hizo con una red de pruebas que permite cambiar sin miedo y, sobre todo, **mirando el sistema funcionando con datos reales**. Eso reveló defectos que ninguna prueba cubría, y cada uno quedó corregido con su prueba:'),
    ...vinetas([
      '«Tu próxima reserva» mostraba una reserva cancelada: ahora prefiere la aprobada y luego la pendiente.',
      'Las listas del Responsable incluían reservas vencidas: se filtran las vigentes.',
      'El menú lateral contraído quedaba de 80 píxeles de alto por una regla de CSS: se corrigió y se añadió una prueba.',
      'Textos recortados en la línea de tiempo de disponibilidad: el texto visible depende del ancho del tramo.',
    ]),

    h1('8. Salida de datos y dashboard'),
    p('El Administrador ve lo que debe decidir, la agenda de hoy y los indicadores; el Solicitante, su próxima reserva y el estado de sus solicitudes; y el Responsable solo consulta, sin acciones de decisión (RN-05).'),
    ...fig('b-dashboard', 'Inicio del Administrador: decisiones pendientes, agenda de hoy e indicadores', '05-inicio-admin.png'),
    ...fig('b-indicadores', 'Indicadores por estado, ambiente más utilizado e indicadores de gestión', '06-inicio-admin-indicadores.png'),
    ...fig('b-listado', 'Listado de reservas con pestañas por estado, filtros y tabla', '12-reservas.png'),
    ...fig('b-choque', 'Reserva pendiente que choca con una aprobada: «Aprobar» queda deshabilitado y se explica por qué', '16-detalle-con-choque.png'),
    ...fig('b-modal', 'Confirmación antes de decidir: el modal dice lo que se va a hacer', '17-modal-aprobar.png'),
    ...fig('b-disponibilidad', 'Vista diaria de disponibilidad por ambiente', '14-disponibilidad.png'),
    ...fig('b-solicitante', 'Inicio del Solicitante', '09-inicio-solicitante.png'),

    h1('9. Calidad, pruebas y límites'),
    ...tabla(
      ['Medida', 'Resultado', 'Fecha y entorno'],
      [
        ['Pruebas del frontend', `${PRUEBAS.frontend.total} en ${PRUEBAS.frontend.archivos} archivos`, `${PRUEBAS.frontend.fecha}, ${PRUEBAS.frontend.comando}`],
        ['Pruebas de Application', `${PRUEBAS.backendAplicacion.total}`, `${PRUEBAS.backendAplicacion.fecha}, ${PRUEBAS.backendAplicacion.entorno}`],
        ['Pruebas de Infrastructure', `${PRUEBAS.backendInfraestructura.total}`, `${PRUEBAS.backendInfraestructura.fecha}, ${PRUEBAS.backendInfraestructura.entorno}`],
        ['Pruebas de la API', `${PRUEBAS.backendApi.total} de ${PRUEBAS.backendApi.total}`, `${PRUEBAS.backendApi.fecha}, ${PRUEBAS.backendApi.entorno}`],
        ['Peso del build (gzip)', `JS ${BUILD.js}, CSS ${BUILD.css}`, `${BUILD.fecha}`],
      ],
      [0.3, 0.3, 0.4],
    ),
    p('También se verificó accesibilidad (axe, contraste AA, objetivos táctiles de al menos 44 píxeles, foco visible y teclado) y el uso en pantallas de 375 píxeles sin desplazamiento horizontal.'),
    p('**Límites declarados:** la última ejecución completa de las pruebas de la API, del extremo a extremo y de la accesibilidad automatizada es del 7 de noviembre (desde entonces Windows bloquea ejecutar el backend compilado localmente y se probó en WSL); no se midió el rendimiento con carga.'),

    h1('10. Reflexión final'),
    p('«¿Cómo contribuye la aplicación de estándares, la validación de datos, la reutilización de componentes y el refinamiento de código a mejorar la calidad, la mantenibilidad y la evolución del sistema?»'),
    p('Antes pensaba que calidad era que «funcione»; aquí aprendí que es poder **cambiar sin miedo**. Los **estándares** dieron orden y, convertidos en pruebas automáticas, se respetan solos. La **validación en tres capas** da confianza: el frontend ayuda, el backend decide y la base de datos garantiza, como se vio con la restricción que impide cruzar reservas. La **reutilización** hace que cada cambio se haga una sola vez, como el modo oscuro. El **refinamiento** con pruebas y con datos reales encuentra lo que las pruebas no ven.'),
    ...vinetas([
      '**Calidad:** las reglas se cumplen aunque alguien se salte el formulario, y los mensajes son iguales en las tres capas.',
      '**Mantenibilidad:** capas con dependencias en una dirección, una sola fuente de textos y colores, y una red de pruebas que avisa si algo se rompe.',
      '**Evolución:** la vista de disponibilidad, los indicadores de gestión, la actividad reciente y el modo oscuro se añadieron sin reescribir lo anterior.',
    ]),
    p('Pendiente: [COMPLETAR POR EL ESTUDIANTE: resultados de la prueba de usabilidad con compañeros].'),
  ]
}
