import { codigoVs } from './codigo-vscode.js'
import { ev } from '../lib/codigo.js'
import { h1, h2, p, tabla, vinetas } from '../lib/word.js'
import { estadisticasDeGit, tamanoDelCodigo } from '../lib/datos.js'

export function seccionCiclo() {
  return [
    h1('2. Ciclo de vida del software (semana 02)'),
    h2('2.1 Modelo elegido: incremental e iterativo'),
    p(
      'El sistema se construyó en **incrementos**: cada uno entrega algo que funciona y se prueba, y después de cada incremento se revisa y se corrige antes de continuar. Las semanas 04 a 09 del caso ya están planteadas así: estructura, formularios, validaciones, reutilización, refinamiento y salida de datos.',
    ),
    h2('2.2 Por qué encaja con este caso'),
    ...tabla(
      ['Característica del caso', 'Qué implica', 'Por qué responde bien el modelo incremental'],
      [
        ['El enunciado pide desarrollar «progresivamente» durante nueve semanas', 'Hay entregas parciales con evidencia cada semana', 'Cada incremento es una entrega comprobable'],
        ['Los RF y las RN están definidos desde el inicio', 'No hace falta descubrirlos sobre la marcha', 'Se pueden planificar los incrementos con anticipación'],
        ['Hay dependencias claras: los formularios necesitan componentes y el dashboard necesita datos de reservas', 'El orden importa', 'Cada incremento se apoya en el anterior'],
        ['La regla más delicada (RN-01) afecta a todo el sistema', 'Un error aquí se descubriría tarde', 'Se aborda pronto y se vuelve a probar en cada incremento'],
        ['El proyecto lo desarrolla una sola persona', 'No hay equipo ni roles de gestión', 'Un modelo ligero evita ceremonias que no aportan'],
      ],
      [0.35, 0.28, 0.37],
    ),
    h2('2.3 Por qué no los otros modelos'),
    ...tabla(
      ['Modelo', 'Motivo para descartarlo'],
      [
        ['Cascada', 'Entrega todo al final: si un error de análisis aparece en el dashboard, obliga a rehacer lo anterior. Además contradice la evidencia semanal que pide el caso'],
        ['Espiral', 'Está pensado para proyectos con riesgos grandes y costosos; aquí el alcance es pequeño y conocido'],
        ['Scrum', 'Requiere equipo, roles (Product Owner, Scrum Master) y reuniones; una sola persona no puede aplicarlo con sentido'],
      ],
      [0.2, 0.8],
    ),
    h2('2.4 Incrementos y su prueba de cierre'),
    ...tabla(
      ['Incremento', 'Semana', 'Resultado que funciona', 'Prueba al cerrar'],
      [
        ['0. Análisis y estándares', '01 a 03', 'Documentos acordados', 'Revisión del alcance'],
        ['1. Estructura inicial', '04', 'Backend, frontend y base de datos que arrancan y se comunican', 'La base se crea desde cero con los scripts y la API responde'],
        ['2. Entrada de datos', '05', 'Formularios para usuarios, ambientes y reservas', 'Se puede registrar cada entidad'],
        ['3. Validación', '06', 'RN-01 a RN-06 en frontend, backend y base de datos', 'Cada regla tiene una prueba que la rompe a propósito'],
        ['4. Reutilización', '07', 'Los nueve componentes compartidos usados en todas las pantallas', 'Ninguna pantalla repite código de campos o mensajes'],
        ['5. Refinamiento', '08', 'Servicios, controladores y validaciones reorganizados', 'Las pruebas siguen en verde'],
        ['6. Salida de datos', '09', 'Listado, detalle y dashboard', 'Los números del dashboard coinciden con la base'],
      ],
      [0.22, 0.1, 0.38, 0.3],
    ),
    h2('2.5 Riesgos y cómo se controlaron'),
    ...tabla(
      ['Riesgo', 'Control aplicado'],
      [
        ['Dos solicitudes simultáneas se aprueban para el mismo horario', 'Restricción de exclusión en la base de datos, además de la validación en el backend; prueba de concurrencia con la base real'],
        ['Reglas distintas en frontend y backend', 'Mismos mensajes con una sola fuente en cada lado y una prueba que falla si difieren'],
        ['Que el dashboard muestre cifras que no coinciden con los datos', 'Pruebas del servicio de consulta y revisión con los datos reales de demostración'],
      ],
      [0.4, 0.6],
    ),
    p(
      'Una iteración posterior, ya terminado el incremento 6, agregó una segunda pasada de diseño y accesibilidad (rama `feature/experiencia`, `feature/pulido-visual`, `feature/taste` y `feature/diseno-final`), con sus propias mediciones. Es el modelo incremental aplicado de nuevo: se mejora sobre lo que ya funciona y cada pasada cierra con pruebas.',
    ),
  ]
}

export function seccionEstandares() {
  const git = estadisticasDeGit()
  const codigo = tamanoDelCodigo()
  const tipos = Object.entries(git.tipos)
    .sort((a, b) => b[1] - a[1])
    .map(([t, n]) => `\`${t}\` ${n}`)
    .join(', ')
  return [
    h1('3. Estándares de construcción (semana 03)'),
    p('El manual completo está en `docs/03-estandares.md`. Son reglas breves y comprobables; si una regla no se puede verificar, no está en el manual. Aquí se resumen y se muestra cómo se verifica cada una.'),
    h2('3.1 Nombres'),
    ...tabla(
      ['Elemento', 'Regla', 'Ejemplo real'],
      [
        ['Dominio', 'En español', '`Reserva`, `Ambiente`, `HoraInicio`'],
        ['Términos técnicos', 'En inglés cuando son convención', '`ReservaController`, `ReservaRepository`, `ReservaService`'],
        ['C#', 'PascalCase para clases y métodos; camelCase para variables; prefijo `I` en interfaces', '`IReservaRepository`, `TransicionarAsync`'],
        ['React', 'PascalCase, un componente por archivo; hooks `useXxx`', '`TextInput.jsx`, `useReservaForm.js`'],
        ['SQL', 'snake_case en minúsculas, tablas en plural', '`reservas`, `hora_inicio`'],
      ],
      [0.2, 0.42, 0.38],
    ),
    h2('3.2 Carpetas y dependencias entre capas'),
    ...codigoVs('arquitectura-test'),
    ...vinetas([
      '`backend/` (Domain, Application, Infrastructure, API y proyectos de pruebas), `frontend/` (`components/ui`, `pages`, `hooks`, `services`, `utils`, `constants`), `database/` (scripts SQL numerados) y `docs/`.',
      '**Application depende de Domain; Infrastructure depende de Application y Domain; API depende de Application e Infrastructure. Application nunca referencia Infrastructure.** Lo comprueba una prueba de arquitectura (`ArquitecturaTests.cs`).',
    ]),
    h2('3.3 Commits y ramas'),
    p(
      `Formato \`tipo: descripción en presente y en español\` (feat, fix, refactor, test, docs, chore), un cambio por commit y sin ámbito entre paréntesis. El repositorio tiene **${git.commits} commits**: ${tipos}. Las ramas son \`feature/<tema>\`: ${git.ramas.map((r) => `\`${r}\``).join(', ')}.`,
    ),
    h2('3.4 Calidad y cómo se verifica'),
    ...tabla(
      ['Verificación', 'Herramienta', 'Criterio', 'Resultado'],
      [
        ['Estilo del frontend', 'ESLint y Prettier', '`--max-warnings 0` y sin cambios pendientes', '0 advertencias; formato sin diferencias (2026-11-10)'],
        ['Pruebas', 'xUnit y Vitest', 'Todas aprobadas antes de unir a `main`', 'Sección 10.1'],
        ['Una sola cosa por archivo', 'Revisión y límite de 300 líneas', 'Ningún archivo de código (JavaScript, JSX o C#) supera 300 líneas', `El más largo es \`${codigo.masLargoJs.r.replace('frontend/src/', '')}\` con ${codigo.masLargoJs.n} líneas en frontend y \`${codigo.masLargoCs.r.split('/').pop()}\` con ${codigo.masLargoCs.n} en backend. Las hojas de estilo de pantalla sí pasan de 300 (la mayor tiene ${codigo.masLargoCss.n}): es una excepción conocida`],
        ['Sin HTML suelto', 'Prueba `arquitectura.test.js`', 'Ninguna pantalla escribe `<input>`, `<select>`, `<textarea>` o `<button>` fuera de `components/ui`', 'Aprobada'],
        ['Mensajes sin repetir', 'Prueba `messages.test.js`', 'Cada texto de interfaz está en `messages.js` y coincide con el backend', 'Aprobada'],
        ['Colores sin repetir', 'Prueba `identidad.test.js`', 'Ningún color, radio ni sombra fuera de `tokens.css`', 'Aprobada'],
      ],
      [0.2, 0.2, 0.35, 0.25],
    ),
    p(
      `La regla de «una sola fuente» para los colores es la que permitió agregar el **modo oscuro** al final del proyecto sin tocar los componentes: ver \`${ev('frontend/src/styles/tokens.css', "data-tema='oscuro'")}\`.`,
    ),
    h2('3.5 Seguridad y secretos'),
    ...codigoVs('ratelimit'),
    ...vinetas([
      'Contraseñas siempre como hash BCrypt (la base de datos rechaza un valor que no tenga ese formato), nunca en texto plano ni en los registros.',
      'Cadena de conexión y clave del token JWT en `dotnet user-secrets` o variables de entorno; nunca en el repositorio. Los scripts SQL reciben las claves como variables de `psql`.',
      'Los mensajes de error no revelan información interna; el login responde lo mismo para un usuario inexistente, inactivo o con contraseña errónea y limita los intentos (5 por minuto).',
    ]),
  ]
}
