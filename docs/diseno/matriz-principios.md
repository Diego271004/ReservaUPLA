# Matriz de principios de usabilidad (v2)

Cada fila cita un elemento que **se ve en la imagen v2** indicada. "Directa" significa que el principio se cumple con ese elemento; "parcial" significa que se cumple solo en parte. Las figuras están en `docs/diseno/v2/`.

## ISO 9241-11

| Principio | Elemento de la interfaz | Decisión | Justificación para el usuario | Figura (v2) | Aplica |
|---|---|---|---|---|---|
| Eficacia | Aviso verde "Disponible: no hay reservas aprobadas en ese horario" y aviso rojo de conflicto | La disponibilidad se muestra antes de enviar, y el conflicto aparece solo, sin otros errores | Sabe si su solicitud va a funcionar antes de registrarla | `04-nueva-reserva.png`, `04e-nueva-reserva-conflicto.png` | Directa |
| Eficiencia | Botones "Ver detalle", "Rechazar" y "Aprobar" en cada fila; "Mostrando 5 de 7" con "Ver todas" | Aprobar o rechazar desde el Dashboard, con confirmación en modal | Resuelve las solicitudes sin cambiar de pantalla | `02-dashboard.png`, `02c-dashboard-modal-aprobar.png` | Directa |
| Eficiencia | Fecha de hoy ya escrita (03/11/2026) y listas de ambiente con capacidad y ubicación | Valores por defecto y opciones con datos | Escribe menos y no recuerda la capacidad | `04-nueva-reserva.png`, `04f-nueva-reserva-ambientes.png` | Directa |
| Satisfacción | Menú lateral con el ítem activo en azul sólido; insignias de estado iguales en todas las tablas | Un solo estilo visual en todas las pantallas | Reconoce dónde está y qué significa cada estado | `03-reservas.png`, `06-ambientes.png`, `08-mi-ambiente.png` | Directa (con la salvedad de E4 en `05*`) |

## Heurísticas de Nielsen

| Principio | Elemento de la interfaz | Decisión | Justificación para el usuario | Figura (v2) | Aplica |
|---|---|---|---|---|---|
| N1 Visibilidad del estado | Botón "Verificando credenciales…" con spinner | El botón muestra la carga y los campos quedan de solo lectura | Sabe que el sistema está trabajando | `01d-login-carga.png` | Directa |
| N1 | Insignias Pendiente, Aprobada, Rechazada, Cancelada; "Mostrando 5 de 7" | Estado con icono y texto; total visible | Ve el estado de cada reserva y cuántas faltan | `03-reservas.png`, `02-dashboard.png` | Directa |
| N1 | Mensaje verde "Reserva aprobada." con el nuevo evento del historial | Confirmación y trazabilidad tras aprobar | Comprueba que la acción se hizo y quién la hizo | `05g-detalle-aprobada.png` | Directa |
| N2 Correspondencia con el mundo real | Fechas dd/mm/aaaa con icono de calendario; ambientes con nombre, capacidad y ubicación | Formato peruano y lenguaje de la universidad | Lee las fechas como las escribe | `03-reservas.png`, `04f-nueva-reserva-ambientes.png` | Directa |
| N3 Control y libertad | "Cancelar" bajo el botón en carga; "Volver a Reservas"; "Volver" en los modales | Siempre hay una salida | Puede arrepentirse sin perder el trabajo | `01d-login-carga.png`, `05-detalle-reserva.png`, `05d-detalle-modal-rechazar.png` | Directa |
| N4 Consistencia y estándares | Ítem activo azul sólido; "Ver detalle" siempre botón secundario; primario a la derecha en escritorio y arriba en móvil | Reglas de `componentes.md` | Aprende un componente y lo reconoce en todas partes | `02-dashboard.png`, `03-reservas.png`, `02b-dashboard-movil.png` | Directa. Parcial en E4 (disposición del detalle), G1 (relleno del menú en `04` y `05`) y U3 (icono de `01c`) |
| N5 Prevención de errores | Lista de Ambiente con "Sala de Reuniones A · En mantenimiento (no disponible)" deshabilitada; "Anterior" deshabilitado en la primera página; listas cerradas de Tipo y Rol | No se puede elegir lo que no corresponde | No llega a cometer el error | `04f-nueva-reserva-ambientes.png`, `03-reservas.png`, `06d-ambientes-tipo-abierto.png`, `07d-usuarios-rol-abierto.png` | Directa |
| N5 | Campos de hora con icono de reloj | Horas elegidas de una lista de 07:00 a 22:00 | No escribe horas fuera de horario | `04-nueva-reserva.png`, `09-componentes.png` (lista de inicio) | Parcial (la lista de fin no se ve en ninguna imagen) |
| N5 | Modales de aprobar, rechazar y cancelar con resumen | Confirmación antes de la acción | Confirma la reserva correcta antes de actuar | `05b`, `05d`, `05e`, `02c` | Directa |
| N6 Reconocimiento antes que recuerdo | Etiquetas siempre visibles y ayuda "Ejemplo: nombre.apellido@upla.edu.pe"; "Selecciona…" en las listas | Nada vive solo en la memoria | No recuerda el formato ni las opciones | `01-login.png`, `06b-ambientes-formulario.png` | Directa |
| N8 Diseño estético y minimalista | Login con solo "ReservaUPLA", la frase, "Universidad Peruana Los Andes" y el formulario | Sin textos de marketing ni funciones inventadas | Va directo a la tarea | `01-login.png` | Directa |
| N9 Ayuda ante errores | "Ingresa el motivo de la reserva."; "Ya existe un ambiente con ese nombre."; "Ese correo ya está registrado."; aviso de Soporte TI | El error dice qué corregir, con icono y borde rojo | Sabe qué hacer para recuperarse | `04b`, `06c-ambientes-errores.png`, `07c-usuarios-error-correo.png`, `01g-login-soporte.png` | Directa |
| N9 | Aviso informativo "Una reserva rechazada no se puede modificar." | Explica por qué los botones están deshabilitados | No cree que el sistema falló | `05c-detalle-rechazada.png` | Directa |

N7 (flexibilidad y eficiencia de uso) no se evalúa.

## Reglas de oro de Shneiderman

| Regla | Elemento de la interfaz | Decisión | Justificación para el usuario | Figura (v2) | Aplica |
|---|---|---|---|---|---|
| S1 Consistencia | Menú, insignias, botones y encabezados de tabla con un solo estilo | Reglas de `componentes.md` | Menos cosas que aprender | `02`, `03`, `06`, `07`, `08` | Directa. Parcial en E4 y G1 |
| S2 Usabilidad universal | Foco celeste de 3 px en campo y botón; interruptor con el texto "Activo"; iconos y texto en las insignias | El estado nunca depende solo del color | Funciona con teclado y sin distinguir colores | `01h-login-foco.png`, `02d-dashboard-foco.png`, `04g-nueva-reserva-foco.png`, `07b-usuarios-formulario.png` | Directa |
| S3 Retroalimentación informativa | "Reserva aprobada."; "Solicitud registrada. Quedó Pendiente de aprobación." | Cada acción termina con un mensaje | Sabe qué pasó | `05g`, `04c-nueva-reserva-exito.png` | Directa |
| S4 Diálogos con cierre | Cierre con resumen (ambiente, fecha, horario), insignia "Pendiente" y botones "Ver detalle" y "Nueva reserva" | El proceso termina y propone el siguiente paso | Sabe que terminó y qué puede hacer | `04c-nueva-reserva-exito.png` | Directa |
| S5 Prevenir errores | Modales con resumen; lista con opción deshabilitada | Igual que N5 | No actúa sobre la reserva equivocada | `05d`, `05e`, `04f` | Directa |
| S6 Reversión sencilla | "Volver" en los modales y "Cancelar" en el login | Se puede dar marcha atrás antes de confirmar | Corrige a tiempo | `05b`, `01d` | Parcial: Rechazada y Cancelada son estados finales, y `05c` muestra los botones deshabilitados |
| S7 Usuario en control | Filtros que se aplican con "Aplicar filtros"; "Limpiar"; "Volver a Reservas" | El usuario decide cuándo | No se mueve nada sin que lo pida | `03-reservas.png`, `05-detalle-reserva.png` | Directa |
| S8 Reducir la carga de memoria | Resumen en el modal y en el cierre; historial en el detalle | Los datos viajan con la acción | No tiene que recordar qué aprobó | `02c`, `04c`, `05g` | Directa |

## Evidencia visual de las reglas de negocio

| Regla | Qué se ve en la v2 | Figura (v2) | Cobertura |
|---|---|---|---|
| RN-01 Una sola reserva aprobada por ambiente y horario | Aviso verde de disponibilidad y aviso rojo "Ese ambiente ya tiene una reserva aprobada de 10:00 a 12:00. Elige otro horario u otro ambiente." | `04-nueva-reserva.png`, `04e-nueva-reserva-conflicto.png` | Directa |
| RN-03 Fin mayor que inicio | La lista de horas de fin con solo horas posteriores está en `componentes.md`, pero no se ve en ninguna imagen v2 | `09-componentes.png` (solo lista de inicio) | Parcial: falta evidencia visual |
| RN-04 Solo entre 07:00 y 22:00 | Ayuda "Horario permitido: 07:00 a 22:00" bajo las horas y lista de inicio desde 07:00 | `04-nueva-reserva.png`, `09-componentes.png` | Parcial: la lista completa hasta 22:00 no se ve |
| RN-05 Solo el administrador aprueba o rechaza | La Solicitante solo ve "Cancelar solicitud"; la Responsable solo ve "Mi ambiente" sin botones; el Administrador ve Aprobar y Rechazar | `05f-detalle-solicitante.png`, `08-mi-ambiente.png`, `05-detalle-reserva.png` | Directa |
| RN-06 Una reserva rechazada no se modifica | Botones deshabilitados y el aviso "Una reserva rechazada no se puede modificar." | `05c-detalle-rechazada.png` | Directa |
