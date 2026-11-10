import { codigoVs } from './codigo-vscode.js'
import { ev } from '../lib/codigo.js'
import { h1, h2, p, tabla, vinetas } from '../lib/word.js'

const SQL = 'database/03_crear_tablas.sql'

export function seccionEstructura() {
  return [
    h1('4. Estructura inicial: backend, frontend y base de datos (semana 04)'),
    h2('4.1 Arquitectura por capas'),
    ...codigoVs('inyeccion-application'),
    p(
      'El backend sigue Clean Architecture: el negocio no depende de la base de datos ni del framework web, y las dependencias apuntan siempre hacia adentro. Cada capa es un proyecto de C# propio, de modo que el compilador impide referencias indebidas.',
    ),
    ...tabla(
      ['Capa (proyecto)', 'Qué contiene', 'Depende de'],
      [
        ['`ReservaUPLA.Domain`', 'Entidades (`Reserva`, `Ambiente`, `Usuario`, `HistorialReserva`) y sus reglas: las transiciones de estado viven en la propia entidad', 'Nada'],
        ['`ReservaUPLA.Application`', 'Servicios de caso de uso, validadores (FluentValidation), DTOs, interfaces de repositorio y reglas de negocio', 'Domain'],
        ['`ReservaUPLA.Infrastructure`', 'Entity Framework Core con Npgsql, repositorios, BCrypt y generación del token JWT', 'Application y Domain'],
        ['`ReservaUPLA.API`', 'Controladores delgados (traducen resultados a HTTP), autenticación JWT, límite de intentos, CORS y manejo de errores', 'Application e Infrastructure'],
        ['Pruebas', '`Application.Tests` (repositorios falsos), `Infrastructure.Tests` y `API.Tests` (base real)', '—'],
      ],
      [0.27, 0.5, 0.23],
    ),
    p(
      `La regla «Application nunca referencia Infrastructure» se aprecia en las referencias de proyecto (\`${ev('backend/ReservaUPLA.Application/ReservaUPLA.Application.csproj', 'ProjectReference')}\`, que solo apunta a Domain) y se verifica con la prueba \`ArquitecturaTests.cs\`.`,
    ),
    p(
      'Las reglas que más importan viven en el dominio y no en el controlador. Por ejemplo, una reserva solo puede aprobarse si está pendiente, y el propio objeto lo exige:',
    ),
    p(
      `\`${ev('backend/ReservaUPLA.Domain/Entities/Reserva.cs', 'public void Aprobar', 'CambiarEstado(EstadoReserva.Aprobada', { mas: 1 })}\`: \`Aprobar\`, \`Rechazar\` y \`Cancelar\` llaman a \`ExigirPendiente\` o \`ExigirNoFinal\` antes de cambiar el estado y registran el evento de historial en la misma operación.`,
    ),
    h2('4.2 Base de datos por terminal'),
    ...codigoVs('sql-permisos'),
    p(
      'La base de datos, las tablas, los permisos y los datos de prueba se crean **por terminal con psql** y scripts SQL versionados en `database/`. No se usan migraciones ni se crean tablas desde el código: el esquema queda legible, revisable y reproducible desde cero.',
    ),
    ...tabla(
      ['Script', 'Qué hace'],
      [
        ['`00_eliminar_bd.sql`', 'Reinicio opcional: borra la base y el rol'],
        ['`01_crear_bd.sql`', 'Crea `ReservaUPLADB` en UTF-8'],
        ['`02_crear_rol.sql`', 'Crea el rol `reservaupla_app` con mínimo privilegio (la clave llega como variable de `psql`)'],
        ['`03_crear_tablas.sql`', 'Tablas, restricciones, índices y disparadores'],
        ['`04_permisos.sql`', 'Concede al rol solo lo necesario (leer, insertar y actualizar donde corresponde)'],
        ['`05_datos_prueba.sql`', 'Tres usuarios, tres ambientes y reservas de prueba con contraseñas en BCrypt'],
        ['`06_verificacion.sql`', 'Comprueba el esquema y que las tildes estén bien codificadas'],
        ['`07_pruebas_reglas.sql`', 'Intenta romper RN-01 a RN-07 y termina en ROLLBACK: si una regla no se rechaza, el script falla'],
        ['`07_datos_demo.sql`', 'Opcional: reservas con fechas relativas a hoy para una demostración completa'],
      ],
      [0.3, 0.7],
    ),
    p('La aplicación se conecta con el rol `reservaupla_app`, no con `postgres`. Los comandos exactos para crear la base están en el Anexo A.'),
    h2('4.3 Modelo de datos'),
    ...codigoVs('sql-tabla-reservas'),
    p(
      'Se partió de las tres entidades del enunciado y se amplió lo justificado. Las diferencias con el modelo «sugerido» del caso son deliberadas y se explican a continuación.',
    ),
    ...tabla(
      ['Entidad', 'Del enunciado', 'Ampliación', 'Motivo'],
      [
        ['Usuario', 'Id, NombreCompleto, Correo, Rol, Activo', '`contrasena_hash`', 'Iniciar sesión para que RN-05 se cumpla de verdad'],
        ['Ambiente', 'Id, Nombre, Tipo, Capacidad, Ubicacion, Estado', '`responsable_id` (opcional)', 'El responsable consulta «su» ambiente'],
        ['Reserva', 'Id, Fecha, HoraInicio, HoraFin, Motivo, Estado, UsuarioId, AmbienteId', '`fecha_creacion`', 'Ordenar por antigüedad las solicitudes pendientes'],
        ['HistorialReserva (nueva)', '—', 'reserva, estado anterior y nuevo, quién y cuándo', 'Responde al problema de «falta de trazabilidad»'],
      ],
      [0.18, 0.3, 0.24, 0.28],
    ),
    h3Decision(),
    h2('4.4 Integridad en la base de datos'),
    ...codigoVs('sql-pruebas-reglas'),
    p(
      'La base de datos también protege las reglas (defensa en profundidad): aunque alguien llame a la API sin pasar por el frontend o escriba directamente en las tablas, los datos inválidos se rechazan.',
    ),
    ...tabla(
      ['Protección', 'Dónde'],
      [
        ['Restricción de exclusión: dos reservas aprobadas del mismo ambiente no pueden cruzarse (RN-01)', ev(SQL, 'ex_reservas_aprobadas_sin_cruce')],
        ['Fin mayor que inicio (RN-03)', ev(SQL, 'ck_reservas_fin_mayor_que_inicio')],
        ['Horario permitido de 07:00 a 22:00 (RN-04)', ev(SQL, 'ck_reservas_horario_permitido')],
        ['Campos obligatorios (RN-02): `NOT NULL` en fecha, horas, motivo, usuario y ambiente', ev(SQL, 'motivo         varchar(300) NOT NULL')],
        ['Solo se guarda un hash BCrypt, nunca texto plano', ev(SQL, 'ck_usuarios_hash_bcrypt')],
        ['Transiciones de estado válidas (RN-06): Rechazada y Cancelada son finales', ev(SQL, 'CREATE OR REPLACE FUNCTION fn_reservas_validar_transicion')],
        ['No se reserva en un ambiente en mantenimiento ni en una fecha pasada (RN-07)', ev(SQL, 'CREATE OR REPLACE FUNCTION fn_reservas_validar_ambiente')],
      ],
      [0.7, 0.3],
    ),
    h2('4.5 Estructura del frontend'),
    ...codigoVs('apiclient'),
    p(
      'El frontend usa React con Vite y se organiza por responsabilidad: `components/ui` (los componentes compartidos), `components/<Pantalla>` (piezas de una pantalla), `pages` (una por ruta), `hooks` (estado y envío de formularios), `services` (llamadas a la API), `utils` (funciones puras de validación y formato) y `constants` (los textos). La separación obligatoria es **validadores puros ↔ hooks ↔ presentación**: la lógica de validar se prueba sin dibujar nada.',
    ),
  ]
}

function h3Decision() {
  return p(
    '**Decisión sobre los tipos.** El enunciado sugiere `UUID` para los identificadores y longitudes como `VARCHAR(150)`. Se usaron identificadores enteros autoincrementales (`integer GENERATED ALWAYS AS IDENTITY`) y longitudes ajustadas a los límites reales de cada campo (por ejemplo, nombre de 120 y motivo de 300 caracteres). El caso dice que el tipo es «sugerido» y que el modelo se puede ampliar. La razón es que no hay ninguna necesidad de generar identificadores fuera de la base de datos y los enteros hacen las consultas y las claves foráneas más simples y rápidas. Si el sistema creciera a varias sedes con bases distintas, cambiar a UUID sería una decisión a tomar entonces.',
  )
}
