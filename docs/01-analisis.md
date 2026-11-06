# 01. Análisis del problema, actores y alcance (Semana 01)

## 1. Problema

La Universidad Peruana Los Andes administra laboratorios de cómputo, auditorios, salas de reuniones y laboratorios especializados. Hoy las reservas se piden por mensajes, llamadas o documentos físicos. El caso identifica cuatro consecuencias y cada una se atiende con una parte concreta del sistema:

| Consecuencia reportada | Causa | Cómo lo atiende ReservaUPLA |
|---|---|---|
| Duplicidad de reservas | Nadie comprueba que el ambiente esté libre a esa hora | RF-04 y RN-01: se valida la disponibilidad y la base impide dos reservas aprobadas que se crucen |
| Pérdida de solicitudes | La solicitud vive en un mensaje o un papel | RF-03 y RF-05: toda solicitud queda registrada y se puede listar |
| Falta de trazabilidad | No se sabe quién pidió, quién aprobó ni cuándo | RF-06 y RF-07: detalle de la reserva con su estado e historial de cambios (propuesta) |
| Dificultad para conocer la disponibilidad real | No hay una vista única | RF-05 y RF-08: listado con filtros y dashboard |

## 2. Actores

| Actor | Responsabilidad (según el caso) | Qué necesita del sistema |
|---|---|---|
| Solicitante | Registra solicitudes de reserva | Pedir un ambiente, saber si está libre, ver el estado de sus solicitudes y cancelarlas |
| Administrador | Aprueba o rechaza reservas | Ver las solicitudes pendientes, aprobar o rechazar con seguridad de que no habrá cruces, y ver el panorama general |
| Responsable de ambiente | Consulta el uso del ambiente asignado | Ver las reservas de su ambiente, sin poder aprobarlas |

El caso habla de "ambiente asignado", pero el modelo mínimo no dice a quién está asignado un ambiente. Por eso el modelo se amplía con `ResponsableId` en Ambiente (sección 6).

## 3. Alcance

**Incluye:** registro de usuarios, ambientes y reservas; validación de disponibilidad; listado y detalle de reservas; cambio de estado; dashboard con los cinco indicadores; roles y control de permisos.

**No incluye (queda fuera por no ser parte del reto):** notificaciones por correo, reservas recurrentes, calendario visual, exportación a PDF o Excel, recuperación de contraseña y varias sedes.

### Decisión de la vista de disponibilidad (Sub-fase C)
La vista diaria de disponibilidad apoya RF-04 (validar disponibilidad antes de registrar) y RF-08 (información de uso y ocupación), pero **no** es el calendario visual excluido del alcance original. Es una cuadrícula diaria y una agenda móvil, acotada al día elegido; el Calendario visual excluido quedó fuera.

## 4. Requerimientos funcionales

| Código | Requerimiento | Pantalla o módulo | Actor |
|---|---|---|---|
| RF-01 | Registrar usuarios solicitantes | Usuarios | Administrador |
| RF-02 | Registrar ambientes | Ambientes | Administrador |
| RF-03 | Registrar solicitudes de reserva | Nueva reserva | Solicitante |
| RF-04 | Validar disponibilidad antes de registrar | Nueva reserva (aviso inmediato y validación al guardar) | Solicitante |
| RF-05 | Listar reservas | Listado con filtros | Todos (cada rol ve lo que le corresponde) |
| RF-06 | Consultar el detalle de una reserva | Detalle | Todos |
| RF-07 | Cambiar el estado: Pendiente, Aprobada, Rechazada o Cancelada | Detalle, con confirmación | Administrador y solicitante (ver 5) |
| RF-08 | Dashboard con indicadores | Dashboard | Administrador y responsable |

## 5. Reglas de negocio y dónde se aplican

Una regla importante nunca se valida en un solo sitio: el frontend ayuda al usuario, el backend decide y la base de datos es la última barrera.

| Regla | Frontend | Backend | Base de datos |
|---|---|---|---|
| RN-01 Una sola reserva aprobada por ambiente, fecha y horario | Avisa si el horario ya está ocupado | Comprueba al aprobar y al registrar | Restricción que impide dos reservas aprobadas con horarios que se crucen |
| RN-02 Fecha, inicio, fin, ambiente, solicitante y motivo obligatorios | Campos requeridos con mensaje | Validación del DTO | `NOT NULL` |
| RN-03 Fin mayor que inicio | Mensaje junto al campo | Validación del DTO | `CHECK` |
| RN-04 Solo entre 07:00 y 22:00 | Límites en el selector de hora y mensaje | Validación del DTO | `CHECK` |
| RN-05 Solo el administrador aprueba o rechaza | Oculta los botones a otros roles | Autorización por rol (devuelve 403) | No aplica |
| RN-06 Una reserva rechazada no se modifica | Deshabilita las acciones | Rechaza el cambio con un mensaje claro | No aplica |
| RN-07 propuesta: no se reserva para una fecha anterior a hoy (regla agregada, como la de mantenimiento) | Mensaje junto al campo; la fecha mínima es hoy | Validación al registrar: 400 con el mismo mensaje | Disparador solo en `INSERT` (no en el cambio de estado, para no romper aprobaciones antiguas) |

**Transiciones de estado (propuesta):**

| Desde | Hacia | Quién |
|---|---|---|
| Pendiente | Aprobada | Administrador, solo si no hay cruce con otra aprobada (RN-01) |
| Pendiente | Rechazada | Administrador |
| Pendiente o Aprobada | Cancelada | El solicitante dueño de la reserva o el administrador |
| Rechazada | (ninguna) | Estado final por RN-06 |
| Cancelada | (ninguna) | Estado final (decisión propia) |

## 6. Modelo de datos

Se parte de las tres entidades del enunciado y se amplía lo justificado:

| Entidad | Campos del enunciado | Ampliación propuesta | Motivo |
|---|---|---|---|
| Usuario | Id, NombreCompleto, Correo, Rol, Activo | `ContrasenaHash` | Iniciar sesión para que RN-05 se cumpla de verdad |
| Ambiente | Id, Nombre, Tipo, Capacidad, Ubicacion, Estado | `ResponsableId` (opcional) | El responsable consulta "su" ambiente |
| Reserva | Id, Fecha, HoraInicio, HoraFin, Motivo, Estado, UsuarioId, AmbienteId | `FechaCreacion` | Trazabilidad |
| HistorialReserva (nueva) | | ReservaId, EstadoAnterior, EstadoNuevo, UsuarioId, Fecha | Responde al problema de "falta de trazabilidad" |

## 7. Decisiones de análisis (propuestas, por confirmar)

1. **Inicio de sesión mínimo con rol.** El caso no lo pide, pero sin identificar al usuario no se puede cumplir RN-05 en el backend.
2. **La disponibilidad se valida solo contra reservas aprobadas**, que es lo que dice RN-01. Las pendientes pueden coexistir y el administrador aprueba una y rechaza la otra.
3. **"Ambiente más utilizado"** es el que tiene más reservas aprobadas; en caso de empate se muestran todos los empatados.
4. **Un ambiente que no está disponible** (por ejemplo, en mantenimiento) no admite reservas nuevas.
5. **RN-07 propuesta: no se reserva para una fecha anterior a hoy.** No venía en el caso; se agrega como la regla de mantenimiento. "Hoy" es la fecha de Lima. Se controla solo al registrar, nunca al cambiar de estado, para que las reservas ya existentes puedan seguir aprobándose, rechazándose o cancelándose. Por confirmar con el docente.
