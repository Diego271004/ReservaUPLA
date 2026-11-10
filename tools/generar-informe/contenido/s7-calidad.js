import { figura, h1, h2, p, tabla, vinetas } from '../lib/word.js'
import { ACCESIBILIDAD, BUILD, E2E, PRUEBAS } from '../lib/datos.js'

export function seccionCalidad() {
  const backend = PRUEBAS.backendAplicacion.total + PRUEBAS.backendInfraestructura.total
  return [
    h1('10. Calidad: pruebas, accesibilidad, usabilidad y mantenibilidad'),
    h2('10.1 Pruebas automáticas'),
    p('Cada cifra lleva su fecha, su comando y el entorno donde se obtuvo. Las que no pudieron repetirse tras los últimos cambios se dicen aparte.'),
    ...tabla(
      ['Conjunto', 'Resultado', 'Fecha', 'Entorno y comando'],
      [
        ['Frontend (Vitest)', `${PRUEBAS.frontend.total} aprobadas en ${PRUEBAS.frontend.archivos} archivos, 0 fallos`, PRUEBAS.frontend.fecha, `\`${PRUEBAS.frontend.comando}\``],
        ['Backend: aplicación (xUnit)', `${PRUEBAS.backendAplicacion.total} aprobadas`, PRUEBAS.backendAplicacion.fecha, PRUEBAS.backendAplicacion.entorno],
        ['Backend: infraestructura con base real', `${PRUEBAS.backendInfraestructura.total} aprobadas`, PRUEBAS.backendInfraestructura.fecha, PRUEBAS.backendInfraestructura.entorno],
        ['Backend: API con base real', `${PRUEBAS.backendApi.total} aprobadas`, PRUEBAS.backendApi.fecha, PRUEBAS.backendApi.entorno],
        ['Herramientas de usabilidad (Node)', `${PRUEBAS.usabilidad.total} aprobadas`, PRUEBAS.usabilidad.fecha, `\`${PRUEBAS.usabilidad.comando}\``],
        ['Extremo a extremo', `${E2E.fases} fases`, E2E.fecha, `\`${E2E.comando}\``],
        ['Compilación del frontend', `JavaScript ${BUILD.js} y CSS ${BUILD.css} (gzip)`, BUILD.fecha, `\`${BUILD.comando}\``],
      ],
      [0.27, 0.3, 0.14, 0.29],
    ),
    p(
      `**Limitación declarada.** En la última etapa del proyecto, Windows activó Smart App Control en el equipo de desarrollo y bloqueó los programas compilados localmente (la API y las pruebas de .NET). Las pruebas de backend de ${backend} casos se ejecutaron entonces en WSL (Linux) con un PostgreSQL propio, incluidas las que usan base real. Las ${PRUEBAS.backendApi.total} pruebas del proyecto API y los guiones de extremo a extremo y de accesibilidad automatizada necesitan levantar la API en Windows, así que su **última ejecución completa es del ${PRUEBAS.backendApi.fecha}**, antes de agregar los indicadores de gestión, la actividad reciente, el login renovado y el modo oscuro. Esos cambios se verificaron con pruebas unitarias, el contraste medido y revisión en pantalla con datos reales, pero no con una nueva corrida completa.`,
    ),
    h2('10.2 Accesibilidad medida'),
    p(`Última medición completa de la interfaz con el navegador real (${ACCESIBILIDAD.fecha}, \`${ACCESIBILIDAD.comando}\`):`),
    ...vinetas([
      `axe-core: ${ACCESIBILIDAD.axe}.`,
      `Contraste (WCAG 2.2 AA): ${ACCESIBILIDAD.contraste}.`,
      `${ACCESIBILIDAD.objetivos}.`,
      `Teclado: ${ACCESIBILIDAD.foco}.`,
      `Zoom del 200 %: ${ACCESIBILIDAD.zoom}.`,
      `Movimiento: ${ACCESIBILIDAD.movimiento}.`,
    ]),
    p(
      'Además, la herramienta de contraste del proyecto mide cada par de colores que declaran las hojas de estilo, en el tema claro y en el oscuro (0 pares por debajo del umbral en ambos).',
    ),
    h2('10.3 Usabilidad: principios aplicados'),
    p(
      'Las decisiones de interfaz siguen la ISO 9241-11 (eficacia, eficiencia y satisfacción), las heurísticas de Nielsen y las reglas de oro de Shneiderman. Algunos ejemplos concretos, cada uno comprobado con una prueba:',
    ),
    ...tabla(
      ['Principio', 'Decisión en ReservaUPLA'],
      [
        ['Visibilidad del estado (Nielsen 1)', 'Insignias con icono y texto; avisos tras cada acción («Reserva rechazada.»); esqueletos de carga con la forma de la tabla'],
        ['Prevención de errores (Nielsen 5, Shneiderman 5)', 'Horas como lista cerrada, aviso de disponibilidad antes de enviar, botones deshabilitados con su razón visible'],
        ['Control y libertad (Nielsen 3)', 'Confirmación antes de aprobar o rechazar, «Volver» en todo formulario y modo claro u oscuro a elección'],
        ['Reconocimiento antes que recuerdo (Nielsen 6)', 'Etiquetas siempre visibles, ejemplos bajo los campos y el resumen en vivo de la solicitud'],
        ['Diseño minimalista (Nielsen 8)', 'Cada pantalla tiene una acción principal; el Inicio dice una vez las solicitudes por decidir'],
        ['Reducir la carga de memoria (Shneiderman 8)', 'Accesos rápidos, filtros recordados en la dirección de la página y atajos de duración'],
      ],
      [0.35, 0.65],
    ),
    p(
      '**Pendiente de la estudiante:** la prueba de usabilidad con tres a cinco compañeros (tareas, tiempos, errores y satisfacción) tiene su plantilla en `docs/usabilidad/plan-prueba-usuarios.md` y su hoja de resultados vacía en `docs/usabilidad/resultados-prueba.csv`. No se inventaron resultados: [COMPLETAR POR EL ESTUDIANTE: resultados de la prueba con compañeros].',
    ),
    h2('10.4 Modo claro y oscuro'),
    p(
      'Al final del proyecto se agregó un modo oscuro, y fue posible gracias a los estándares de la sección 3: como todos los colores viven en `tokens.css`, el tema oscuro es un bloque que redefine superficies, textos, bordes y estados sin tocar un solo componente. Se separó el color de texto del de relleno para poder aclarar solo los textos; cada par de colores del tema oscuro tiene una prueba de contraste (AA). El botón con luna o sol está en la barra superior y en el login, recuerda la elección y se aplica antes de pintar, sin parpadeo.',
    ),
    ...figura('f-oscuro', 'El mismo Inicio del Administrador en modo oscuro', {
      tipo: 'App',
      que: 'El Inicio con fondo oscuro, textos claros y la marca conservada.',
      pasos: ['Pulsa el botón de la luna en la barra superior.'],
      archivo: '08-inicio-admin-oscuro.png',
      seccion: '10',
    }),
    ...figura('f-login', 'Pantalla de inicio de sesión (claro): foto del campus, tipos de ambiente y formulario', {
      tipo: 'App',
      que: 'El login a pantalla partida con el panel que termina en punta de hexágono.',
      pasos: ['Abre la aplicación sin sesión.'],
      archivo: '01-login.png',
      seccion: '10',
    }),
    ...figura('f-movil', 'Inicio del Administrador en un teléfono (375 px): una columna, sin desplazamiento horizontal', {
      tipo: 'App',
      que: 'El Inicio en una sola columna.',
      pasos: ['Abre el Inicio con una ventana de 375 px de ancho.'],
      archivo: '11-inicio-admin-movil.png',
      seccion: '10',
    }),
    h2('10.5 Mantenibilidad y escalabilidad: qué se puede afirmar'),
    p(
      '**Mantenibilidad (medida o comprobable):** las capas del backend dependen en una sola dirección y una prueba lo verifica; los textos, colores y formas tienen una sola fuente cada uno; ningún archivo de código (JavaScript, JSX o C#) supera las 300 líneas; la duplicación de código es menor de 1 %; y hay una red de seguridad de más de 1 500 pruebas automáticas que avisa si un cambio rompe algo. La prueba más práctica es el cambio realizado al final: agregar un modo oscuro tocó los tokens y no los componentes.',
    ),
    p(
      '**Escalabilidad (con límites):** hay pistas buenas: la autenticación JWT no guarda sesión en el servidor (permite varias instancias), la paginación y el alcance por rol se resuelven en la base, y los índices cubren las consultas por ambiente y fecha. Pero **no se midió con carga**: no hay una prueba con miles de reservas ni con usuarios simultáneos. Por eso el informe afirma que el sistema está *preparado* para escalar, no que ya se haya demostrado a escala.',
    ),
  ]
}
