# Auditoría de Diseño con Skills Especializadas (Taste & Design Systems)

**Documento**: `docs/diseno/auditoria-taste.md`  
**Rama**: `feature/taste`  
**Fecha**: 2026-11-07T15:46:00-05:00  
**Lupas metodológicas**: `design-taste-frontend` (anti-slop, microinteracciones, bordes y ritmo), `corporate` (grilla modular 8pt/4pt, jerarquía ejecutiva), `ant` (densidad operativa y legibilidad tabular), `bento` (ordenación modular por nivel de decisión).  
**Contrato rector**: Navy `#1F365C`, Primario `#0063A8`, Azul Títulos `#1E73BE`, Filete Dorado `#EAA658` (sin texto), Fondo `#F4F6FA`; Poppins (títulos) y Montserrat (cuerpo); WCAG 2.2 AA; Foco 3 px `#1E73BE`; 44 px táctiles; sin scroll horizontal a 375, 320 y 188 px; sin recortes de texto en navegador; `prefers-reduced-motion` respetado; sin dependencias nuevas; reglas de negocio RN-01 a RN-07 y mensajes de validación intactos.

---

## 1. Tabla de Hallazgos por Pantalla y Componente

| ID | Pantalla / Componente | Qué se ve actualmente | Principio de la Skill | Decisión | Por qué (Contrato / Usabilidad) | Severidad (0-4) |
| :--- | :--- | :--- | :--- | :--- | :--- | :--- |
| **H-01** | **Global** / `Button.module.css` | Los botones cambian color en `:hover`, pero al hacer click (`:active`) no tienen respuesta física ni movimiento táctil. | *taste-skill (Regla 5)*: «buttons step on hover and press on click». Feedback táctil tangible. | **ADOPTAR** | Mejora el feedback según Norman e ISO 9241-110 sin alterar colores ni tamaños. Se aplica `transform: translateY(1px)` en `:active:not(:disabled)` y se anula con `prefers-reduced-motion`. | 2 |
| **H-02** | **Inicio Administrador** / `InicioAdministrador.jsx` | `GrupoDeIndicadores` (resumen métrico) se ubica arriba de `RequierenDecision` (solicitudes pendientes que esperan acción urgente de Carla Rojas). | *bento*: Agrupación modular por nivel de decisión: urgente arriba, operativo al medio, resumen debajo. | **ADOPTAR** | Principio de Shneiderman (reducir carga cognitiva y priorizar la acción principal). Lo urgente debe verse primero sin necesidad de scroll. | 3 |
| **H-03** | **Global** / `GrupoDeIndicadores.module.css` | En tablet (768–1023 px) la rejilla usa `auto-fit minmax(180px, 1fr)`, produciendo 3 tarjetas en la primera fila y 1 tarjeta huérfana en la segunda (hueco asimétrico a la derecha). | *taste-skill (Regla 4)*: «Equal left and right content edges; no half-empty rows». | **ADOPTAR** | Elimina asimetría visual fijando 2 columnas en tablet y 4 en escritorio, manteniendo los bordes izquierdo y derecho perfectamente alineados con las guías. | 2 |
| **H-04** | **Global** / `CardIndicador.module.css` | Las tarjetas de métricas enlazadas tienen elevación en `:hover` (`translateY(-2px)`), pero al pulsar no tienen estado `:active` que confirme la pulsación. | *taste-skill (Regla 5)*: Microinteracciones reactivas en tarjetas clicables. | **ADOPTAR** | Asegura consistencia con los botones. Al pulsar (`:active`), la tarjeta retorna a `translateY(0)` proporcionando sensación física de presión. | 1 |
| **H-05** | **Nueva reserva** / `SelectorDeAmbientes.module.css` | Las tarjetas de selección de ambiente cambian sombra en hover, pero no tienen elevación de 2 px ni pulsación `:active` al seleccionarlas. | *taste-skill (Regla 5)*: Elevación sutil de 2 px en tarjetas interactivas y pulsación. | **ADOPTAR** | Retroalimentación física inmediata (Nielsen #1) para que el solicitante perciba con claridad la selección del ambiente antes de ver el borde azul. | 2 |
| **H-06** | **Nueva reserva** / `AtajosDeDuracion.module.css` | Los botones de duración rápida (1h, 1.5h, 2h) cambian de color pero no tienen estado activo `:active` ni microinteracción de clic. | *taste-skill (Regla 5)*: Botones interactivos con paso táctil. | **ADOPTAR** | Hace que los atajos se sientan como interruptores físicos ágiles y tangibles. | 1 |
| **H-07** | **Disponibilidad** / `DisponibilidadPage.module.css` | Los bloques de tramos libres (`.libre`) tienen hover con fondo tenue pero carecen de respuesta al click `:active` para ir a Nueva reserva. | *taste-skill (Regla 5)*: Bloques de acción interactivos con paso y pulsación. | **ADOPTAR** | Brinda certeza al usuario de que el tramo libre fue pulsado antes de navegar al formulario prerrellenado. | 2 |
| **H-08** | **Listados de datos** / `TableList.module.css` | Las filas de las tablas (`tbody tr`) no tienen cambio de fondo al pasar el cursor; en pantallas anchas cuesta seguir visualmente la fila hasta la columna de acciones. | *ant / corporate*: Densidad operativa corporativa con resaltado hover para trazabilidad visual. | **ADOPTAR** | Facilita el escaneo horizontal en tablas con 5 o 6 columnas (Nielsen #6: reconocimiento antes que recuerdo). Se usa `--fondo-fila-alterna: #f9fafc`. | 2 |
| **H-09** | **Listados de datos** / `TableList.module.css` | Las columnas numéricas (como Capacidad en Ambientes) están alineadas a la izquierda en lugar de alineación numérica a la derecha con cifras tabulares. | *ant*: Alta densidad de datos y alineación numérica a la derecha para comparación rápida de cantidades. | **ADOPTAR** | `font-variant-numeric: tabular-nums; text-align: right` permite comparar magnitudes de capacidad de ambientes de un solo vistazo. | 2 |
| **H-10** | **Login** / `LoginPage.module.css` | La división de pantalla es `64fr / 36fr`. En 1280 px la tarjeta del formulario queda algo ajustada frente a la foto; además, la animación `@keyframes entrada` no tiene guardián `prefers-reduced-motion`. | *taste-skill / corporate*: Proporción balanceada 58/42 y respeto estricto a accesibilidad en movimiento. | **ADAPTAR** | Calibrar proporción a `58fr / 42fr` (tarjeta más holgada) y añadir `@media (prefers-reduced-motion: reduce) { animation: none; }` para cumplir WCAG 2.3.3. No se cambia la foto ni el degradado. | 2 |
| **H-11** | **Estados vacíos** / `EstadoVacio.jsx` | La ilustración del edificio UPLA mide 140x100 px. En tablas vacías o filtros sin resultados en móvil (375/188 px), ocupa ~180 px empujando las acciones abajo del pliegue. | *taste-skill*: Rechazo a ilustraciones decorativas dominantes. *corporate*: Minimalismo funcional. | **ADAPTAR** | No se rechaza ni elimina a ciegas porque posee valor de identidad institucional UPLA. Se adapta a una escala más sobria (100x72 px) y modo compacto en tablas, garantizando que el texto y botón de acción siempre sean visibles sin scroll. | 2 |
| **H-12** | **Formularios** / `FormularioTarjeta.module.css` | En formularios individuales (`Registrar usuario`, `Registrar ambiente`), la tarjeta tiene `max-width: 760px` mientras el encabezado `PageHeader` ocupa el 100%, dejando bordes derechos asimétricos a 1280 px. | *taste-skill (Regla 4)*: «Equal left and right content edges». Alineación de guías estructurales. | **ADAPTAR** | Ajustar el contenedor de página del formulario para que el encabezado y el cuerpo compartan la misma guía máxima, o la tarjeta complete armónicamente la rejilla sin desconexión visual. | 2 |
| **H-13** | **Microcopy** / `messages.js` (sección `TEXTOS`) | Ciertos textos informativos y de ayuda usan tercera persona impersonal o estilo telegráfico («Vacía, no filtra», «Comunícate con Soporte TI de la universidad»). | *taste-skill / corporate*: Voz clara, segunda persona, verbos activos específicos y tono servicial sin relleno. | **ADAPTAR** | Se actualizan únicamente microcopys de ayuda, títulos secundarios y estados vacíos en `TEXTOS`. Los mensajes de validación y reglas de negocio (`MENSAJES`) se mantienen 100% intactos. | 1 |
| **H-14** | **Recomendaciones de skills externas** | Uso de tema oscuro, fuentes como Inter o Plus Jakarta Sans, colores morados/violetas, o partículas/shaders WebGL que proponen `taste-skill` y `ant`. | *Contrato Institucional UPLA*: Fondo `#F4F6FA`, Poppins/Montserrat autoalojadas, paleta fija institucional, MVP sin modo oscuro ni 3D. | **RECHAZAR** | El contrato institucional gana siempre. Las skills se usan como lupas de revisión y pulido, jamás para imponer estilos foráneos o incompatibles. | 0 |

---

## 2. Evaluación Detallada de los 9 Puntos de Revisión

### 1. Equal Edges (Bordes Simétricos y Alineación)
- **Diagnóstico**: Las páginas de listados (`AmbientesPage`, `UsuariosPage`, `ReservasPage`) y la vista de `DisponibilidadPage` mantienen una excelente coherencia en su margen izquierdo y derecho cuando se visualizan a 1280 px.
- **Punto de mejora detectado**: En `GrupoDeIndicadores`, la rejilla de tarjetas sufre asimetría en resoluciones tablet (768 a 1023 px) debido a `auto-fit`. Al forzar 2 columnas en ese rango y 4 en escritorio, los bordes izquierdo y derecho se alinean matemáticamente con los paneles adyacentes y el contenedor de navegación.
- **Decisión**: **ADOPTAR**.

### 2. Ritmo y Espaciado
- **Diagnóstico**: El archivo `tokens.css` cuenta con una escala base de 4 niveles (`--espacio-1` a `--espacio-4`). En su gran mayoría las vistas respetan esta separación.
- **Punto de mejora detectado**: Algunas cabeceras de sección alternan márgenes ad-hoc. Homogeneizar a `--espacio-3` (24 px) en escritorio y `--espacio-2` (16 px) en móvil para todas las separaciones verticales entre bloques de contenido.
- **Decisión**: **ADOPTAR**.

### 3. Microinteracciones
- **Diagnóstico**: El sistema actual posee transiciones suaves de color y foco accesible de 3 px `#1E73BE`. Sin embargo, los controles carecen de sensación física al clic (`:active`), luciendo estáticos frente a interfaces modernas de alta fidelidad.
- **Punto de mejora detectado**:
  - Botones (`Button.module.css`): añadir `:active:not(:disabled) { transform: translateY(1px); }`.
  - Tarjetas interactivas (`CardIndicador`, `SelectorDeAmbientes`): elevación sutil de 2 px en hover (`translateY(-2px)`) y retorno táctil en click (`translateY(0)`).
  - Tramos libres en disponibilidad (`DisponibilidadPage.module.css`): respuesta activa al clic.
  - Filas de tabla (`TableList.module.css`): hover sutil con `--fondo-fila-alterna`.
  - Guardián absoluto: `@media (prefers-reduced-motion: reduce) { transform: none !important; }`.
- **Decisión**: **ADOPTAR**.

### 4. Jerarquía Tipográfica y de Acciones
- **Diagnóstico**: Cada pantalla cuenta con un único elemento primario (`PageHeader` o botón principal de envío).
- **Punto de mejora detectado**: En los diálogos modales (`ModalConfirmacion`), asegurar que el botón de rechazo/cancelación destructiva mantenga su jerarquía semántica mediante el token `--color-error` en contraste estricto con el botón secundario "Volver". La escala tipográfica de 4 niveles (1.5rem, 1.125rem, 1rem, 0.875rem) se mantiene estricta.
- **Decisión**: **ADOPTAR**.

### 5. Densidad de Tablas y Listas (Referencia Corporate / Ant)
- **Diagnóstico**: La tabla `TableList` es completamente accesible y se convierte en tarjetas limpias en móvil (375 px).
- **Punto de mejora detectado**: Para optimizar la lectura rápida de datos (criterio `ant` para aplicaciones empresariales densas):
  - Alinear columnas numéricas (como la capacidad) a la derecha con cifras tabulares.
  - Asegurar que los estados lleven icono + texto siempre en la misma línea sin partirse.
  - Ajustar padding vertical de celdas a un ritmo equilibrado de 12 px / 16 px.
- **Decisión**: **ADOPTAR**.

### 6. Inicio del Administrador con Criterio Bento
- **Diagnóstico**: Actualmente `InicioAdministrador.jsx` presenta primero las métricas (`GrupoDeIndicadores`) y después las solicitudes por atender (`RequierenDecision`).
- **Punto de mejora detectado**: En una aplicación operativa, el administrador necesita resolver lo urgente primero. Aplicando el principio bento por nivel de decisión:
  1. **Urgente (Nivel 1)**: `Portada` contextual («X solicitudes esperan tu decisión») + `RequierenDecision` (solicitudes pendientes con acciones inmediatas Aprobar / Rechazar).
  2. **Operativo en tiempo real (Nivel 2)**: `AgendaDeHoy` (ocupación de salas en el día en curso con línea actual de tiempo).
  3. **Resumen y analítica (Nivel 3)**: `GrupoDeIndicadores` (totales consolidados, aprobadas, pendientes, ambiente más usado) + `UsoYEstados` (distribución y barras de ocupación).
- **Decisión**: **ADOPTAR**. No se crean componentes nuevos ni se altera ninguna regla de negocio.

### 7. Textos y Microcopy (Tabla de Cambios Propuestos)
- **Diagnóstico**: Todos los mensajes de validación (`MENSAJES`) cumplen con el contrato y se mantienen **estrictamente inalterados**. En la sección de microcopy de interfaz (`TEXTOS`), se identifican oportunidades para mayor claridad y trato directo al usuario.
- **Tabla de Cambios Propuestos**:

| Clave en `TEXTOS` | Texto Actual | Texto Nuevo Propuesto | Principio / Justificación |
| :--- | :--- | :--- | :--- |
| `ayudaSoporte` | «Comunícate con Soporte TI de la universidad» | «Contacta a Soporte TI institucional» | *taste-skill / corporate*: Verbo específico, conciso y profesional. |
| `ayudaFechaFiltro` | «Formato dd/mm/aaaa. Vacía, no filtra.» | «Formato dd/mm/aaaa. Déjalo en blanco para ver todas.» | *corporate*: Segunda persona, instrucción positiva clara sin estilo telegráfico. |
| `atajosAyudaHoraInicio` | «Elige primero la hora de inicio.» | «Selecciona primero la hora de inicio.» | *corporate*: Verbo preciso y formal. |
| `sinPendientes` | «No hay solicitudes pendientes.» | «No tienes solicitudes pendientes por atender.» | *taste-skill*: Habla directamente al usuario en segunda persona; refuerza el estado "al día". |
| `sinReservas` | «Todavía no hay reservas.» | «No hay reservas registradas en el sistema.» | *corporate*: Terminología sobria y descriptiva. |
| `sinAmbienteAsignado` | «Todavía no tienes un ambiente a cargo. Cuando se te asigne uno, aparecerá aquí.» | «Aún no tienes un ambiente asignado. Los ambientes a tu cargo se mostrarán aquí.» | *corporate*: Mayor sobriedad institucional. |
| `solicitudesPendientes` | «Solicitudes pendientes de aprobación» | «Solicitudes pendientes de revisión» | *taste-skill*: Voz activa y alineada con la tarea del administrador. |
| `noHayDatos` | «Todavía no hay registros.» | «No hay registros disponibles.» | *corporate*: Lenguaje estándar empresarial. |

- **Decisión**: **ADOPTAR**.

### 8. La Ilustración del Edificio en los Estados Vacíos
- **Diagnóstico**: `EstadoVacio.jsx` cuenta con un SVG personalizado que representa el pórtico universitario con el isotipo hexagonal UPLA y filete dorado `#EAA658`. Mide 140x100 px.
- **Evaluación**: `taste-skill` desaconseja dibujos decorativos de stock. Sin embargo, este no es un gráfico genérico de IA, sino un elemento de identidad universitaria formal. No obstante, en tablas vacías o filtros sin coincidencias, su tamaño dominante empuja las acciones fuera de la pantalla en dispositivos móviles.
- **Decisión**: **ADAPTAR**.
  - No se elimina la ilustración: se preserva su diseño y colores institucionales.
  - Se optimizan sus dimensiones base a 100x72 px para reducir su huella vertical.
  - Se añade soporte para variante compacta (`compacto`: 54x40 px) para incrustación dentro de celdas de tablas o tarjetas secundarias, garantizando que el mensaje y el botón de acción («Nueva reserva» o «Limpiar filtros») permanezcan siempre dentro del pliegue.

### 9. El Login
- **Diagnóstico**: La estructura a pantalla partida con la fotografía del campus y la tarjeta de acceso es fiel a la identidad UPLA.
- **Puntos de mejora detectados**:
  - Ajuste sutil de proporción a `58fr / 42fr` en escritorio para brindar a la tarjeta de login una respiración más equilibrada frente al bloque fotográfico.
  - Añadir la regla `@media (prefers-reduced-motion: reduce) { .tarjeta { animation: none; } }`, actualmente ausente en `LoginPage.module.css`.
  - Asegurar que la tipografía del campus mantenga el ritmo vertical de 8pt de `corporate`.
- **Decisión**: **ADAPTAR**.

---

## 3. Resumen de Decisiones

- **ADOPTAR**:
  1. Microinteracciones táctiles `:active` y elevación de 2 px en hover (botones, tarjetas, selectores, tramos libres) con guardián `prefers-reduced-motion`.
  2. Ordenación Bento en el Inicio del Administrador (urgente arriba, operativo al medio, resumen debajo).
  3. Rejilla simétrica de indicadores en tablet (2 columnas) y escritorio (4 columnas).
  4. Resaltado hover y alineación numérica a la derecha en tablas corporativas.
  5. Refinamiento de microcopy en segunda persona y verbos específicos en `TEXTOS`.
- **ADAPTAR**:
  1. Ilustración del edificio en `EstadoVacio`: se conserva su identidad y trazo UPLA, reduciendo su escala y habilitando variante compacta.
  2. Login: proporción 58/42 y guardián de movimiento reducido en la tarjeta.
  3. Alineación de bordes de formularios y encabezados.
- **RECHAZAR**:
  1. Modos oscuros, colores morados/gradientes externos, tipografías ajenas (Inter, Plus Jakarta), librerías pesadas o efectos WebGL incompatibles con el contrato y el MVP.

---

