# Experiencia: qué cambió, para quién y por qué

Rediseño integral de la interfaz de ReservaUPLA para consolidar un sistema institucional moderno, accesible y eficiente: cada pantalla orienta, muestra el estado del sistema en tiempo real y reduce la carga cognitiva. Cada decisión está fundamentada en principios de usabilidad (Nielsen N1–N10, Shneiderman S1–S8, Norman, ISO 9241-11 y ISO 9241-210).

## Cabecera común (`PageHeader`)
Título semántico (`h1`), línea de contexto dinámico («6 reservas · 2 pendientes») y bloque de acciones principales alineado arriba a la derecha, uniforme en todas las pantallas.
- **Principios:** Consistencia y estándares (Nielsen 4, Shneiderman 1), visibilidad del estado (Nielsen 1).

## Inicio por rol (`/dashboard`)
- **Administrador:** Banner de bienvenida institucional con saludo dinámico según la hora de Lima, tarjetas de indicadores con icono y tono de estado (`CardIndicador`), sección prioritaria «Requieren tu decisión» con advertencia de solapamiento en reservas pendientes, agenda cronológica de hoy con eje horario y línea «Ahora», y gráfico/tabla accesible de ocupación por ambientes.
- **Solicitante:** Portada personalizada con isotipo hexagonal UPLA, tarjeta destacada «Tu próxima reserva» con acceso directo a detalle o cancelación, tres tarjetas de resumen con conteo por estado (Aprobadas, Pendientes, Rechazadas/Canceladas) con enlace a filtros automáticos, y lista de últimas solicitudes.
- **Responsable:** Portada institucional con el nombre del ambiente a cargo, tres tarjetas de métricas diarias (Hoy aprobadas, Pendientes de decisión, Ocupación de hoy), agenda cronológica del día con botones de acción directa de 44 px, y lista de próximas reservas programadas.
- **Principios:** Lo urgente arriba (eficiencia e ISO 9241-11), prevención de errores (Nielsen 5), relevancia de la información.

## Vista de disponibilidad (`/disponibilidad`)
Línea de tiempo diaria interactiva (07:00–22:00) por ambiente con bloques consolidados:
- **Eje horario y marcador temporal:** Eje con marcas cada 30 min y línea vertical «Ahora» dentro del carril.
- **Carriles para solapamientos:** Las solicitudes pendientes que se cruzan se organizan en sub-carriles sin truncar texto.
- **Interacción accesible:** Un tramo libre precarga el ambiente, fecha y horario directamente en Nueva reserva mediante tarjetas de selección.
- **Privacidad estricta:** El Solicitante visualiza el tramo ocupado pero no los nombres ni motivos ajenos; el Administrador y Responsable sí acceden al detalle.
- **Principios:** Mapeo natural (Norman), visibilidad del estado (Nielsen 1), no depender solo del color (WCAG 1.4.1).

## Nueva reserva (`/reservas/nueva`)
Experiencia de selección y confirmación:
- **Selector de ambientes con tarjetas:** Tarjetas seleccionables accesibles (`role="radiogroup"`), navegables con flechas de cursor y Espacio/Enter, con icono por tipo, capacidad, ubicación, avatar del responsable y estado de mantenimiento deshabilitado con motivo visible.
- **Atajos de duración:** Fila simétrica de 3 botones (1 h, 2 h, 3 h) de 44 px que calculan y fijan automáticamente la hora de fin.
- **Comprobación proactiva y un solo mensaje de choque:** Al cruzar un horario con una reserva aprobada se muestra un único mensaje de advertencia del sistema; la franja conserva la etiqueta «Choque».
- **Resumen vivo:** Panel lateral (y barra adherida en dispositivos móviles) que actualiza en tiempo real ambiente, fecha en texto largo, horario y duración.
- **Principios:** Reconocimiento antes que recuerdo (Nielsen 6), prevención de errores (Nielsen 5), retroalimentación continua (Norman).

## Detalle de la reserva (`/reservas/:id`)
- **Cabecera informativa:** Ambiente, horario y duración destacada con insignia de estado (icono + texto).
- **Línea de tiempo del historial:** Historial de eventos estructurado con `<time>` para fechas y tiempos relativos accesibles; paso actual destacado con `aria-current="step"`.
- **Detección de conflictos:** Alerta proactiva en pantalla de detalle si una reserva pendiente colisiona con una reserva aprobada existente, deshabilitando el botón de aprobación para prevenir errores concurrentes.
- **Principios:** Retroalimentación informativa (Shneiderman 3), prevención de errores (Nielsen 5).

## Ambientes y Usuarios (`/ambientes`, `/usuarios`)
- **Ambientes:** Alternador de vista entre tarjetas responsivas y tabla tabular (`localStorage`), mostrando avatar del responsable, barra de ocupación de hoy y estado con insignias accesibles.
- **Usuarios:** Campo de búsqueda en vivo que filtra en tiempo real por nombre, correo institucional o rol, manteniendo el estado de tabla vacía estándar («Todavía no hay registros.») cuando la colección no posee registros.
- **Formularios:** Validación reactiva al desenfocar (`onBlur`), contadores de caracteres (`X de Y caracteres`) conectados mediante `aria-describedby` y requisitos de contraseña visibles antes de escribir.
- **Principios:** Flexibilidad y eficiencia de uso (Nielsen 7), prevención y recuperación de errores (Nielsen 5 y 9).

## Login y Páginas de Error (`/login`, 403 y 404)
- **Login a pantalla partida:** Fotografía institucional del campus con degradado lateral marino oscuro que garantiza contraste > 4.5:1; tarjeta blanca con logo oficial de la UPLA y controles de 48 px. Alternancia de contraseña accesible con `aria-pressed`, detector de Bloq Mayús no invasivo y estado de carga «Verificando credenciales…».
- **403 y 404:** Ilustración sobria en `EstadoVacio`, redacción en lenguaje humano comprensible y enlace de retorno «Volver al inicio» con objetivo táctil >= 44 px y foco visible de 3 px.
