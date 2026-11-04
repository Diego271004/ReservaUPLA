# Evaluación de la v1

Cada fila sale de mirar la imagen real de `docs/diseno/v1/`. Principios: Nielsen (N1 visibilidad del estado, N2 correspondencia con el mundo real, N3 control y libertad, N4 consistencia y estándares, N5 prevención de errores, N6 reconocimiento antes que recuerdo, N7 flexibilidad y eficiencia de uso (no se evalúa), N8 diseño estético y minimalista, N9 ayuda para reconocer, diagnosticar y recuperarse de errores), Shneiderman (S1 consistencia, S2 usabilidad universal, S3 retroalimentación, S4 cierre, S5 prevenir errores, S6 reversión, S7 usuario en control, S8 memoria corta) e ISO 9241-11 (eficacia, eficiencia, satisfacción).

## Hallazgos

| Id | Pantalla | Hallazgo | Principio afectado | Corrección propuesta |
|---|---|---|---|---|
| L0 | `_intentos/01-login-intento-1…` | Con prompt abreviado, Stitch añadió icono de puerta, "GESTIÓN DE AMBIENTES", "Sistema Institucional Activo", párrafo y viñetas ("Notificaciones instantáneas", "Disponibilidad en tiempo real"), "Huancayo, Perú", aviso azul repetido, "Requerido", pie con Soporte/Términos/Privacidad y una "Oficina de Tecnologías de la Información" inventada. **Ya corregido en `01-login.png`**; se cuenta aparte. | N8 minimalista; N2 mundo real (no prometer funciones inexistentes) | Regenerado con el bloque de reglas; sin extras |
| L1 | 01-login | El mensaje "Comunícate con Soporte TI de la universidad" (al pulsar "¿Olvidaste tu contraseña?") no se ve en ninguna imagen | N9 ayuda; S3 retroalimentación | Agregar variante `01g` con el mensaje visible |
| L2 | 01d-login-carga | Durante "Verificando credenciales…" no hay forma de cancelar la verificación | N3 control y libertad; S7 | Agregar enlace "Cancelar" bajo el botón en carga |
| D1 | 02-dashboard | "Aprobar" y "Rechazar" están en cada fila, pero la imagen no muestra el modal de confirmación; la regla pide confirmar toda acción irreversible | N5; S5; S6 | Agregar variante `02c` con el ModalConfirmacion sobre el Dashboard |
| D2 | 02-dashboard | Los CardIndicador quedan desalineados: "48" aparece más abajo que "7", "31" y "10" porque su descripción ocupa una línea | N4; S1 | Alinear los números a la misma línea base en las cinco tarjetas |
| D3 | 02, 02b | El indicador dice 7 pendientes pero la tabla muestra 5 (3 en móvil) sin indicar que hay más ni cómo verlas | N1 visibilidad del estado; eficacia | Texto "Mostrando 5 de 7" y enlace "Ver todas" hacia Reservas |
| D4 | 02, 03 | "Ver detalle" es botón con borde en el Dashboard y enlace en Reservas: el mismo componente se ve distinto | N4; S1 | Un solo estilo de acción de tabla |
| D5 | 02b-dashboard-movil | "Aprobar" y "Rechazar" quedan apilados y casi pegados: riesgo de toque equivocado | N5; S5 | Separar los botones y poner "Rechazar" aparte de "Aprobar" |
| R1 | 03-reservas | El DateInput muestra "mm/dd/yyyy" (formato en inglés); la tabla usa dd/mm/aaaa; en `03b` el mismo campo se ve distinto (texto "20/11/2026") | N2; N4 | Formato "dd/mm/aaaa" y un solo aspecto del DateInput |
| R2 | 03 vs 03b | En el estado vacío los botones "Aplicar filtros" y "Limpiar" pasan a una segunda fila; en 03 están en la misma fila | N4; S1 | Misma disposición de filtros en las dos variantes |
| R3 | 03b-reservas-vacio | El estado vacío dice "limpia los filtros" pero no ofrece el botón ahí mismo | N9; eficiencia | Agregar botón "Limpiar filtros" dentro del bloque vacío |
| R4 | 03-reservas | En la página 1, "Anterior" se ve igual que un enlace activo | N5; N1 | Mostrar "Anterior" deshabilitado en la primera página |
| N1 | 04-nueva-reserva | DateInput y TimeInput parecen campos de texto libre (sin icono ni lista de horas). La imagen `04b` muestra que acepta 23:00. El diseño no previene horas fuera de 07:00–22:00 | N5; S5; eficacia | TimeInput con lista cerrada de horas 07:00–22:00 (cada 30 min) y fin solo posterior al inicio; iconos de calendario y reloj |
| N2 | 04d-nueva-reserva-movil | El Ambiente aparece cortado ("Laboratorio de Cómputo 2 · 30 pe"): se pierde capacidad y ubicación | N6 reconocimiento; S8 | Permitir salto de línea en el SelectInput móvil |
| N3 | 04b-nueva-reserva-errores | Se muestran a la vez 23:00 (fuera de rango), fin menor que inicio y un conflicto "reserva aprobada de 10:00 a 12:00": mensajes que no pueden darse juntos | N9; S3 | Separar: `04b` solo errores de campo y `04e` solo conflicto de disponibilidad con horas válidas |
| N4 | 04c-nueva-reserva-exito | El cierre no resume lo registrado (ambiente, fecha, horario) | S4 cierre; S8 | Mostrar el resumen de la solicitud junto con la insignia "Pendiente" |
| N5 | 04d vs 04 | En móvil el botón primario va arriba; en escritorio va a la derecha | N4; regla "primario siempre en el mismo lugar" | Definir una sola posición del primario por tamaño y aplicarla en todas las pantallas |
| E1 | 05-detalle-reserva | "Aprobar" (primario) está a la izquierda; en los formularios el primario está a la derecha | N4; S1 | Primario siempre en el mismo extremo |
| E2 | 05, 05b, 05c | No hay botón ni enlace para volver al listado | N3; S7 | Enlace "Volver a Reservas" arriba del título |
| E3 | 05-detalle-reserva | "Rechazar" (rojo sólido) y "Cancelar reserva" son vecinos y de peso parecido; "Cancelar reserva" puede leerse como "cancelar esta pantalla" | N2; N5 | Separar "Cancelar reserva" del par Aprobar/Rechazar y dejar clara su diferencia |
| E4 | 05, 05b, 05c | El mismo detalle cambia entre variantes: insignia a la izquierda (05) y a la derecha (05b, 05c); orden de datos y etiquetas distintos (MAYÚSCULAS en 05c) | N4; S1 | Una sola plantilla de detalle |
| E5 | 05 (variantes) | Solo existe el modal de "Aprobar"; no hay modal para "Rechazar" ni "Cancelar reserva" | N5; S5; S6 | Agregar variantes `05d` y `05e` con esos modales |
| E6 | 05c-detalle-rechazada | La explicación "Una reserva rechazada no se puede modificar." está en letra pequeña bajo los botones grises | N1; S3 | Ponerla como AlertMessage informativo encima de los botones deshabilitados |
| A1 | 06-ambientes | La columna "Acciones" queda cortada ("ACCIONES", "Edita"): la tabla se desborda a la derecha | Eficacia; N9 | Reducir columnas o ajustar anchos para que "Editar" se vea completo |
| A2 | 06 vs 07, 08 | Encabezados en MAYÚSCULAS en Ambientes y en minúscula en Usuarios y Mi ambiente | N4; S1 | Un solo estilo de encabezado de TableList |
| A3 | 06-ambientes | La insignia "En mantenimiento" se parte en dos líneas | N4; N8 | Ancho mínimo de insignia o texto en una línea |
| A4 | 06b, 07b | Los SelectInput (Tipo, Estado, Responsable, Rol) aparecen vacíos, sin "Selecciona…" ni indicio de las opciones | N6; N5 | Texto "Selecciona…" y mostrar la lista abierta en una variante |
| A5 | 06b-ambientes-formulario | No se ve ninguna validación (nombre repetido, capacidad no numérica) | N9; S3 | Variante `06c` con errores bajo cada campo |
| U1 | 07b-usuarios-formulario | El interruptor "Activo" queda lejos de su etiqueta y no dice su estado en texto; en `07c` está pegado | N4; S2 usabilidad universal (no solo color) | Etiqueta junto al interruptor con el texto "Activo" / "Inactivo" |
| U2 | 07b | "Contraseña inicial" no indica los requisitos | N6; N5 | Ayuda bajo el campo con los requisitos (se confirma con la política real) |
| U3 | 07c vs 04b | El icono del error es de contorno en `07c` y relleno en `04b` | N4; S1 | Un solo icono de error en el AlertMessage y en los campos |
| G1 | 02–08 | El ítem activo del menú se ve distinto en cada pantalla (azul sólido en 02, 03, 07b y 08; gris translúcido en 04 y 05; con franja celeste en 05b, 06 y 07c; franja completa sin esquinas en 07); el ancho del menú también varía (400 a 438 px) | N4; S1 | Un solo estilo de ítem activo (azul `#0063A8`) y un solo ancho |
| G2 | 03, 06, 07, 08 | Las insignias de estado cambian de forma (cápsula en 03 y 06; rectángulo en 07 y 08) y de tamaño de icono | N4; S1 | Un solo estilo de insignia |

**Total: 32 hallazgos** (2 en login, 5 en Dashboard, 4 en Reservas, 5 en Nueva reserva, 6 en Detalle, 5 en Ambientes, 3 en Usuarios, 2 globales), más L0 (ya corregido).

## Pantallas sin hallazgos propios

- `01-login`, `01b`, `01c`, `01e`, `01f`: cumplen la lista de contenido, sin extras, con etiquetas visibles, errores bajo el campo con icono, texto y borde, foco celeste en `01e` y sin desplazamiento horizontal en móvil. Los dos hallazgos de login (L1, L2) son de cobertura.
- `04-nueva-reserva` (aparte de N1) y `08-mi-ambiente`: el rol responsable ve solo "Mi ambiente" y la tabla es de solo lectura, sin botones de aprobar ni rechazar. Solo le alcanzan los globales G1 y G2.

## Lista de revisión (resumen)

| Pregunta | Resultado v1 |
|---|---|
| Etiquetas visibles y errores bajo el campo con icono, texto y borde | Sí en 01c, 04b, 07c. Falta mostrar el estado de error en 06b (A5) |
| Estado del sistema visible (carga, éxito, estado, disponibilidad) | Sí en 01d, 04, 04c, insignias. Falta en D3 (5 de 7) |
| Volver o cancelar y modal antes de aprobar, rechazar o cancelar | Parcial: solo modal de aprobar; sin "Volver" en el detalle (E2, E5, D1) |
| Datos inválidos posibles (horas fuera de 07:00–22:00, ambiente no disponible) | Sí se pueden escribir (N1); la disponibilidad se avisa (04, 04b) |
| Los 9 componentes iguales en todas las pantallas | No: menú activo, insignias, "Ver detalle", DateInput, encabezados (G1, G2, D4, R1, A2) |
| El usuario debe recordar algo de otra pantalla | Poco: selects vacíos (A4) y contraseña sin requisitos (U2) |
| Cada rol ve solo lo que puede usar | Sí en el menú de Solicitante y de Responsable (decisión de esta entrega, ver `pendientes.md`) |
| Contraste AA, controles de 44 px, foco visible, móvil sin desplazamiento horizontal | Contraste y móvil sin desplazamiento: sí. Foco visible: solo comprobable en 01e y 04. Tabla de Ambientes se desborda (A1) |
| Paleta y tipografía del sistema de diseño | Sí: botón primario azul `#0063A8`, menú `#1F365C`, Montserrat |
