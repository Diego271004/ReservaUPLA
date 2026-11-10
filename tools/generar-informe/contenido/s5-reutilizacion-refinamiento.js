import { ev } from '../lib/codigo.js'
import { h1, h2, p, tabla, vinetas } from '../lib/word.js'
import { DUPLICACION, usoDeComponentes } from '../lib/datos.js'

const FRONT = 'frontend/src'
const MINIMOS = [
  ['TextInput', 'Campo de texto con etiqueta, ayuda, contador y error'],
  ['SelectInput', 'Lista cerrada con etiqueta y error (también la usan las horas)'],
  ['DateInput', 'Fecha con formato dd/mm/aaaa y selector de calendario'],
  ['TimeInput', 'Hora como lista cerrada de 07:00 a 22:00 cada 30 minutos'],
  ['Button', 'Botón único con variantes (primario, secundario, rechazar, enlace…) y estado de carga'],
  ['AlertMessage', 'Mensajes de éxito, error, aviso e información, con icono y texto'],
  ['ModalConfirmacion', 'Confirmación con foco atrapado, Esc para salir y el verbo exacto en el botón'],
  ['TableList', 'Tabla con encabezado, columnas y filas para Reservas, Ambientes, Usuarios y Dashboard'],
  ['CardIndicador', 'Tarjeta de indicador con icono, número y descripción'],
]

export function seccionReutilizacion() {
  const uso = usoDeComponentes(MINIMOS.map(([n]) => n))
  return [
    h1('7. Reutilización de componentes (semana 07)'),
    p(
      'El caso pide componentes reutilizables para formularios y mensajes, y enumera nueve. Los nueve existen en `frontend/src/components/ui` y se usan en las pantallas; la columna de uso se **cuenta al generar este informe** recorriendo los `import` del código (no se escribe a mano).',
    ),
    h2('7.1 Los nueve componentes mínimos'),
    ...tabla(
      ['Componente', 'Qué resuelve', 'Archivos de la aplicación que lo usan', 'Ejemplos'],
      MINIMOS.map(([nombre, descripcion], i) => [
        `\`${nombre}\``,
        descripcion,
        String(uso[i].archivos),
        uso[i].ejemplos.map((e) => `\`${e}\``).join(', ') || '—',
      ]),
      [0.18, 0.34, 0.14, 0.34],
    ),
    h2('7.2 Más allá de los nueve'),
    p(
      'Al reutilizar se fueron extrayendo piezas que se repetían: `FormularioTarjeta` (la misma tarjeta en los tres formularios), `GrupoDeIndicadores` y `PageHeader` (cabecera común de todas las pantallas), `EstadoVacio` y `EsqueletoDeLista` (estado vacío y carga), `Insignia` (estado con icono y texto), `PasswordInput`, `Avatar` y `Paginacion`. En lógica, `useFormulario` (campos, validación y envío), `useAccion` (estado «ejecutando» y avisos de éxito o error) y `mensajesDeResultado.js` (la traducción de cada código HTTP a un mensaje).',
    ),
    h2('7.3 Cómo se evita que la duplicación vuelva'),
    ...vinetas([
      `**Medición de duplicación.** Con ${DUPLICACION.herramienta}, la duplicación pasó de **${DUPLICACION.antes}** (antes de la semana 07) a **${DUPLICACION.despues}** (con todas las pantallas terminadas). El frontend quedó en 0 bloques duplicados; lo que queda es de C# y son encabezados de archivo (\`using\`, \`namespace\`) que el lenguaje obliga a repetir. Los informes completos están en \`docs/evidencias/fase7-duplicacion-*.txt\` y \`docs/reutilizacion.md\`.`,
      `**Prueba de arquitectura.** \`${ev(`${FRONT}/arquitectura.test.js`, "describe('las pantallas (src/pages) usan")}\` falla si una pantalla escribe \`<input>\`, \`<select>\`, \`<textarea>\` o \`<button>\` en lugar de usar los componentes de \`components/ui\`. Se comprobó que falla poniendo un \`<button>\` suelto.`,
      '**Prueba de mensajes.** `messages.test.js` falla si un mensaje de la interfaz no existe idéntico en el backend (o al revés).',
      '**Colores y formas en un solo archivo.** `tokens.css` es la única fuente de colores, radios y sombras, y `identidad.test.js` falla si una hoja de estilo escribe un color suelto.',
    ]),
  ]
}

export function seccionRefinamiento() {
  return [
    h1('8. Refinamiento de código (semana 08)'),
    p(
      'Refinar es mejorar la estructura sin cambiar lo que el sistema hace, y comprobarlo con pruebas. Se hizo en dos momentos: la reorganización de servicios y formularios de la semana 08, y las correcciones que salieron de probar el sistema con datos reales al final del proyecto.',
    ),
    h2('8.1 Refactorizaciones'),
    ...tabla(
      ['Zona', 'Antes', 'Ahora'],
      [
        ['Backend: cambiar de estado', 'Aprobar, rechazar y cancelar repetían buscar, comprobar permiso, comprobar estado y guardar', `Un solo método \`TransicionarAsync\` con la comprobación y la transición como parámetros (\`${ev('backend/ReservaUPLA.Application/Services/ReservaService.cs', 'private async Task<ResultadoOperacion<ReservaDetalleDto>> TransicionarAsync')}\`)`],
        ['Backend: de resultado a HTTP', 'Cada acción de los controladores traducía el resultado a mano', '`ControllerBaseExtensions` (`Traducir`, `Creado`, `DatosInvalidos`): los controladores quedaron delgados'],
        ['Backend: contraseña', 'La regla de 8 a 72 caracteres con letra y número estaba en dos validadores', 'Una sola `ReglasDeContrasena` usada por el alta de usuario y el login'],
        ['Frontend: mensajes de error de la API', 'Cada hook y página traducía 400, 401, 403, 404, 409, 429, 5xx y falta de red por su cuenta', '`services/mensajesDeResultado.js`'],
        ['Frontend: formularios', 'Cada formulario armaba sus campos y su envío', '`useFormulario` y `useFormularioDeRegistro`'],
        ['Frontend: pantallas de lista', 'Usuarios y Ambientes repetían la misma estructura', '`ListadoPage` compartida'],
      ],
      [0.2, 0.38, 0.42],
    ),
    h2('8.2 Defectos hallados al probar con datos reales'),
    p(
      'Las pruebas unitarias pasaban, y aun así, al levantar el sistema completo con los datos de demostración aparecieron defectos que ninguna prueba cubría. Cada uno se corrigió y quedó una prueba que lo impide:',
    ),
    ...tabla(
      ['Defecto observado en pantalla', 'Causa', 'Corrección y prueba'],
      [
        [
          'En el Inicio del Solicitante, «Tu próxima reserva» mostraba una reserva **cancelada**',
          'El backend tomaba la primera reserva del solicitante sin mirar su estado',
          'Ahora elige la aprobada más cercana y, si no hay, la pendiente (`ConsultaService`); dos pruebas nuevas',
        ],
        [
          'El Inicio del Responsable listaba reservas canceladas y rechazadas como «próximas»',
          'No se filtraba por estado vigente',
          'Solo aprobadas y pendientes; prueba nueva',
        ],
        [
          'Con el menú lateral contraído, la columna quedaba de 80 px de alto con los iconos recortados y una barra de desplazamiento',
          'Un `flex: 0 0 72px` dentro de una columna se aplicaba al alto y no al ancho',
          'Se quitó la regla; prueba de CSS que impide que vuelva',
        ],
        [
          'Un tramo de la línea de tiempo se leía «9–12 h · Aproba…» (texto cortado)',
          'La regla de texto decidía por duración y no por el ancho disponible',
          'Los tramos muestran solo el horario; el estado lo dice el icono; pruebas de borde y comprobación en navegador',
        ],
        [
          'En «Próximas reservas» del Responsable, el botón «Ver detalle» caía en una fila aparte',
          'La fila tenía seis datos en una rejilla de cinco columnas',
          'Rejilla de seis columnas',
        ],
      ],
      [0.35, 0.3, 0.35],
    ),
    p(
      'Todos los hallazgos del proyecto, con su corrección y la prueba que los cubre, están en `docs/bitacora-evaluacion.md`. La lección del refinamiento: una prueba unitaria demuestra lo que alguien pensó probar; probar el sistema completo con datos reales encuentra lo que nadie pensó.',
    ),
  ]
}
