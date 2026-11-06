# ReservaUPLA — Comparación Visual y Técnica Antes / Después

Documento comparativo de las transformaciones visuales, arquitectónicas y de accesibilidad implementadas durante la etapa de experiencia de ReservaUPLA.

---

## 1. Nueva Reserva (`/reservas/nueva`)

| Dimensión | Antes | Después (Etapa Experiencia) |
| :--- | :--- | :--- |
| **Selección de Ambiente** | Menú desplegable (`<select>`) tradicional que ocultaba capacidad y ubicación. | **Tarjetas seleccionables (`role="radiogroup"`)**: Icono por tipo, capacidad, ubicación, avatar del responsable y estado de mantenimiento bloqueado con motivo visible. |
| **Resumen del Pedido** | Panel ubicado al final del formulario que requería desplazamiento. | **Resumen vivo de dos columnas** (`aria-live="polite"`): Actualización inmediata de ambiente, fecha en texto largo, horario y duración. En móvil: **Barra de resumen adherida** sobre el botón de confirmación. |
| **Gestión del Horario** | Selección manual de horas sin cálculo de duración. | **Atajos de duración rápida** (1 h, 2 h, 3 h) en cuadrícula simétrica de 44 px que fijan automáticamente la hora de término. |
| **Prevención de Conflictos** | Alertas múltiples redundantes en la franja y en el formulario. | **Un solo mensaje de advertencia del sistema** con el horario en conflicto; franja horaria interactiva con etiqueta «Choque» (icono + texto). |
| **Evidencias** | - | `docs/evidencias/experiencia/N-01-nueva-reserva-escritorio.png`, `N-02-nueva-reserva-movil.png` |

---

## 2. Vista de Disponibilidad Diaria (`/disponibilidad`)

| Dimensión | Antes | Después (Etapa Experiencia) |
| :--- | :--- | :--- |
| **Línea de Tiempo** | Gráfico básico sin marcas de tiempo relativas continuas. | **Eje proporcional de 07:00 a 22:00** con marcas cada 30 min y carril con indicador «Ahora» en tiempo real de Lima. |
| **Solapamientos** | Bloques solapados que recortaban el texto de las reservas pendientes. | **Sub-carriles organizados verticalmente**: Cada bloque conserva su texto completo, estado e interactividad. |
| **Interacción y Enlace** | Consulta aislada sin conexión fluida con el registro. | **Clic en tramo libre precarga ambiente, fecha y horario** automáticamente en la pantalla de Nueva reserva. |
| **Privacidad por Rol** | Exposición indebida o texto inconsistente. | **Privacidad estricta**: Solicitante ve bloques ocupados sin nombres ajenos; Administrador y Responsable ven el detalle completo. |
| **Evidencias** | - | `docs/evidencias/experiencia/C-01-disponibilidad-escritorio.png`, `C-02-disponibilidad-movil.png` |

---

## 3. Detalle de la Reserva (`/reservas/:id`)

| Dimensión | Antes | Después (Etapa Experiencia) |
| :--- | :--- | :--- |
| **Cabecera y Jerarquía** | Lista plana de campos clave/valor. | **Cabecera destacada con insignia accesible**, horario formateado y duración calculada en minutos y horas. |
| **Historial de Estados** | Lista desestructurada de texto. | **Línea de tiempo accesible**: Cada hito utiliza `<time>` con atributo datetime, tiempo relativo legible y paso actual con `aria-current="step"`. |
| **Protección Concurrente** | El botón «Aprobar reserva» se habilitaba sin validar choques en vivo. | **Detección proactiva de solapamiento**: Si la reserva pendiente colisiona con una aprobada, se despliega una tarjeta de advertencia y se bloquea la aprobación. |
| **Evidencias** | - | `docs/evidencias/experiencia/D-01-detalle-pendiente-escritorio.png`, `D-02-detalle-pendiente-movil.png` |

---

## 4. Pantalla de Inicio por Rol (`/dashboard`)

| Rol | Antes | Después (Etapa Experiencia) |
| :--- | :--- | :--- |
| **Administrador** | Dashboard estándar con indicadores planos. | Portada institucional con saludo por hora local; tarjetas `CardIndicador` con iconos de estado; sección «Requieren tu decisión» prioritaria con detección de colisiones; agenda del día y gráfico de ocupación con alternativa textual accesible. |
| **Solicitante** | Vista vacía o redirección a reservas. | Portada institucional con isotipo hexagonal UPLA; tarjeta destacada **«Tu próxima reserva»** con botón directo a detalle o cancelación; 3 tarjetas de resumen por estado con enlaces a filtros automáticos; lista de últimas solicitudes. |
| **Responsable** | Sin panel adaptado a su ambiente. | Portada con el nombre del ambiente asignado; 3 indicadores de actividad diaria; agenda cronológica del día con botones táctiles de 44 px; listado de próximas reservas programadas. |
| **Evidencias** | - | `docs/evidencias/experiencia/I-01-inicio-solicitante-escritorio.png`, `I-05-inicio-responsable-escritorio.png` |

---

## 5. Ambientes y Usuarios (`/ambientes`, `/usuarios`)

| Dimensión | Antes | Después (Etapa Experiencia) |
| :--- | :--- | :--- |
| **Visualización en Ambientes** | Únicamente vista tabular rígida. | **Alternador de vista («Tarjetas» \| «Tabla»)**: Cuadrícula responsiva con icono de ambiente, barra de ocupación de hoy, avatar del responsable e insignias; preferencia guardada en `localStorage`. |
| **Búsqueda en Usuarios** | Lista estática sin filtro interactivo. | **Búsqueda en vivo reactiva**: Filtra instantáneamente por nombre, correo o rol, conservando el estado vacío estándar si la base carece de datos. |
| **Formularios de Alta** | Validación al presionar el botón de envío. | **Validación reactiva `onBlur`**, contadores de caracteres `X de Y caracteres` (`aria-describedby`), y política de contraseñas visible antes de escribir. |
| **Evidencias** | - | `docs/evidencias/experiencia/A-ambientes-tarjetas-escritorio.png`, `A-usuarios-filtrados-escritorio.png` |

---

## 6. Login y Páginas de Error (`/login`, 403, 404)

| Dimensión | Antes | Después (Etapa Experiencia) |
| :--- | :--- | :--- |
| **Login Institucional** | Formulario centrado sin arraigo visual. | **Pantalla partida (split-layout)**: Foto del campus con degradado lateral marino (> 4.5:1 de contraste), tarjeta blanca con logo UPLA, controles de 48 px, alternar contraseña con `aria-pressed`, detector de Bloq Mayús y botón cancelar en envíos lentos. |
| **Páginas 403 y 404** | Mensajes de texto sin estilo uniforme. | Ilustración temática en `EstadoVacio`, explicaciones en lenguaje humano («No tienes permiso para ver esta sección», «Esta página no existe o cambió de dirección») y botón «Volver al inicio» accesible de 44 px con foco visible de 3 px. |
| **Evidencias** | - | `docs/evidencias/experiencia/L-01-login-escritorio.png`, `L-06-403-sin-permiso-escritorio.png` |

