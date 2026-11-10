# Experiencia: qué cambió, para quién y por qué

Rediseño integral de la interfaz de ReservaUPLA para consolidar un sistema institucional moderno, accesible y eficiente: cada pantalla orienta, muestra el estado del sistema en tiempo real y reduce la carga cognitiva. Cada decisión está fundamentada en principios de usabilidad (Nielsen N1–N10, Shneiderman S1–S8, Norman, ISO 9241-11 y ISO 9241-210).

## Cabecera común (`PageHeader`)
Título semántico (`h1`), línea de contexto dinámico («6 reservas · 2 pendientes») y bloque de acciones principales alineado arriba a la derecha, uniforme en todas las pantallas.
- **Principios:** Consistencia y estándares (Nielsen 4, Shneiderman 1), visibilidad del estado (Nielsen 1).

## Inicio por rol (`/dashboard`)
- **Administrador:** Banner de bienvenida institucional con saludo dinámico según la hora de Lima, tarjetas de indicadores con icono y tono de estado (`CardIndicador`), sección prioritaria «Requieren tu decisión» con advertencia de solapamiento en reservas pendientes, agenda cronológica de hoy con eje horario y línea «Ahora», y gráfico/tabla accesible de ocupación por ambientes.
  - **Indicadores de gestión (extra sobre RF-08):** *tasa de aprobación* (aprobadas ÷ aprobadas + rechazadas; las pendientes y canceladas no cuentan) y *ocupación de hoy* (horas aprobadas ÷ horas disponibles de los ambientes que hoy no están en mantenimiento). Ambas se calculan en `utils/gestion.js` con pruebas de borde y no inventan un porcentaje cuando no hay datos («—»).
  - **Accesos rápidos:** Nueva reserva, Ver disponibilidad, Nuevo ambiente y Nuevo usuario, a un clic (Shneiderman 2 y 8).
  - **Actividad reciente:** los últimos 6 cambios de estado de cualquier reserva con quién los hizo y cuándo («Carla Rojas aprobó la reserva de Ana Torres · hace 2 h»), cada uno enlazado al detalle. Es la trazabilidad que el caso señala como problema. El backend la expone solo al Administrador (`DashboardDto.ActividadReciente`, consulta `ActividadRecienteAsync`, probada con la base real).
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
- **Login a pantalla partida:** fotografía institucional del campus con velo marino que garantiza contraste > 4.5:1; el panel termina en **punta de hexágono** (eco del logo) y no lleva franja dorada. Movimiento decorativo, finito y apagado con `prefers-reduced-motion`: la foto se asienta al cargar (6 s) y se desplaza hasta 12 px con el puntero, tres hexágonos de la marca flotan a distinta profundidad y los textos y campos entran escalonados (600 ms). Chips con los tipos de espacio (Laboratorios, Auditorios, Salas). Tarjeta blanca con logo oficial y controles de 48 px, alternancia de contraseña accesible, detector de Bloq Mayús y estado «Verificando credenciales…». En móvil queda la franja con el nombre y la tarjeta, sin foto ni adornos.
## 403 y 404
- Ilustración institucional sobria en `EstadoVacio`, redacción en lenguaje humano comprensible y enlace de retorno «Volver al inicio» con objetivo táctil >= 44 px y foco visible de 3 px.

---

## Pulido visual y refinamiento (`feature/pulido-visual`)

1. **Escala tipográfica de 4 niveles**: Erradicación de tamaños arbitrarios mediante tokens CSS (`--tipo-titulo-pagina` 24 px / Poppins 600, `--tipo-seccion` 18 px / Poppins 600, `--tipo-etiqueta` 14 px / Montserrat 600, `--tipo-cuerpo` 16 px / Montserrat 400-500). En entradas de texto, los 16 px evitan zoom indeseado en dispositivos móviles.
2. **Selector de ambientes táctil refinado**: Cada tarjeta incorpora un indicador radial de 24 px (`indicadorRadial`) con icono de marca (`marca`) al ser elegida, borde primario de 2 px y microinteracción de elevación sutil.
3. **Resumen de solicitud vivo**: Transición fluida de 150 ms (`--transicion-corta`) entre los estados pendientes y los valores elegidos, eliminando saltos visuales bruscos.
4. **Línea de tiempo diaria con franjas alternas**: Bandas alternas sutiles (`--fondo-fila-alterna`) que guían la lectura horizontal de múltiples ambientes, tramos libres en verde suave accesible (`--fondo-libre`), horas pasadas sombreadas y distintivo «Ahora HH:MM» en fila superior independiente sin solapar etiquetas horarias.
5. **Métricas destacadas y empates accesibles**: En el inicio de los tres roles, las cifras clave se presentan a 40 px en Poppins SemiBold con espaciado tabular (`tabular-nums`). El indicador de «Ambiente más utilizado» soporta empates ordenados con chips accesibles (`aria-label="Ambientes en empate"`).
6. **Ilustración institucional en estados vacíos**: Componente `EstadoVacio` con la silueta de un edificio institucional ilustrativo (frontón con isotipo hexagonal y filete dorado `#EAA658`), accesible (`aria-hidden="true"`), ligero e integrado en Reservas, Usuarios, Ambientes y Mi Ambiente.
7. **Topbar contextual y microinteracciones**: Título de sección en rutas raíz, migas de pan en vistas de detalle, y transiciones respetuosas de `@media (prefers-reduced-motion: reduce)`.

---

## Refinamiento Taste y Sistemas de Diseño (`feature/taste`)

1. **Equal edges y contención simétrica de formularios**: Guía de alineación compartida entre cabeceras institucionales y tarjetas de formulario (`FormularioTarjeta` con ancho máximo de 760 px). En métricas, grilla de 4 columnas en desktop y 2 en tablet sin huecos asimétricos.
2. **Microinteracciones tangibles y sobrias**: Estados `:active` con pulsación física de 1 px (`translateY(1px)`) en botones (`Button`), tramos libres interactivos (`DisponibilidadPage`), atajos de duración (`AtajosDeDuracion`) y selector de ambientes. Elevación de tarjetas contenida a $\le 2$ px.
3. **Ordenación Bento orientada a la toma de decisiones**: En el Inicio del Administrador, jerarquía adaptada a la urgencia operativa: primero lo que requiere decisión (solicitudes pendientes con solapamiento advertido), luego la agenda operativa en tiempo real, seguido de los indicadores clave y el desglose analítico.
4. **Densidad de datos y alineación tabular**: Tablas institucionales con resalte interactivo sutil al pasar el cursor (`--fondo-fila-alterna`), columnas numéricas alineadas a la derecha (`data-alineacion="derecha"`) y números tabulares `tabular-nums`.
5. **Proporción de login editorial y estados vacíos compactos**: Pantalla de acceso en proporción 58% (visual institucional) / 42% (formulario) con supresión de animaciones bajo `prefers-reduced-motion`. Ilustración de edificio UPLA escalada a proporciones compactas (100x72 px base y 64x46 px en modo compacto).

## Modo oscuro (`data-tema="oscuro"`)
Botón con luna (claro) o sol (oscuro) en la barra superior y en el login, con el nombre «Cambiar a modo oscuro/claro» (sin `aria-pressed`: el nombre ya cambia con el estado) y objetivo de 44 px. La elección se recuerda entre visitas y se aplica antes de pintar. En el login el botón va al final del documento (se ve arriba a la derecha) para no cambiar el orden de Tab (correo, contraseña…). Detalle de la paleta y de las comprobaciones en `DESIGN.md`.
- **Principios:** flexibilidad y eficiencia de uso (Nielsen 7), control del usuario (Nielsen 3, Shneiderman 7), usabilidad universal (Shneiderman 2: menos fatiga visual con poca luz).

