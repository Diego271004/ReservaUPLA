# Especificación de componentes del sistema de experiencia

Catálogo y especificación técnica de los componentes del sistema de interfaz y experiencia de ReservaUPLA. Todos los componentes residen en `frontend/src/components/ui/` y sus subcarpetas especializadas.

---

## 1. Controles de formulario (`frontend/src/components/ui/`)

- **`TextInput`**: Campo de texto estilizado de 44 px (48 px en login). Admite variante multilínea (`textarea`), indicador de error con icono y asociación accesible `aria-invalid` y `aria-describedby` para ayudas y contadores.
- **`PasswordInput`**: Campo de contraseña con botón integrado Mostrar/Ocultar con tamaño táctil >= 44 px, `aria-pressed` y `aria-label` dinámico.
- **`SelectInput`**: Selector accesible con indicador chevron y texto con salto de línea responsive para evitar cortes en pantallas móviles.
- **`DateInput`**: Selector de fecha en formato institucional `dd/mm/aaaa` con icono de calendario.
- **`TimeInput`**: Selector de hora en intervalos cerrados de 30 minutos (07:00 a 22:00) conforme a la regla de negocio RN-04.
- **`InterruptorActivo`**: Toggle accesible (`role="switch"`) con etiquetas visibles «Activo» / «Inactivo» y alto táctil de 44 px.
- **`SelectorDeAmbientes`**: Grupo de tarjetas seleccionables para la elección de ambiente (`role="radiogroup"` y `role="radio"`). Soporta navegación con flechas de cursor (WAI-ARIA Radio Group), selección con Espacio o Enter, avatares de responsables, capacidad, ubicación, e inhabilitación con motivo visible para ambientes en mantenimiento (RN-07).

---

## 2. Presentación y cabeceras

- **`PageHeader`**: Cabecera común de todas las páginas con título semántico `<h1>`, subtítulo o resumen de datos, y área de acciones primarias a la derecha.
- **`Topbar`**: Barra de navegación superior con menú hamburguesa para móviles, migas de pan semánticas (`<nav aria-label="Migas de pan">`) con objetivo de 44x44 px, fecha actual en Lima y menú de usuario.
- **`MenuDeUsuario`**: Desplegable accesible para el perfil y cierre de sesión seguro, con trampa de foco y salida con Escape o clic exterior.
- **`CardIndicador`**: Tarjetas de métricas y resumen de solicitudes con soporte de estado presionado, icono por tono y valor destacado.
- **`Insignia`**: Cápsulas semánticas para estados de reserva (Pendiente, Aprobada, Rechazada, Cancelada) y usuarios (Activo, Inactivo), siempre con icono SVG y texto explícito.
- **`BarraDeOcupacion`**: Barra de progreso y ocupación de ambientes con descripción accesible `aria-valuenow` y `aria-valuemin/max`.
- **`Avatar` / `CeldaDePersona`**: Representación gráfica con iniciales de usuarios y responsables con contraste garantizado.
- **`EstadoVacio`**: Ilustración sobria en SVG, texto informativo del estado y botón de llamada a la acción con el siguiente paso recomendado (Nielsen 9).

---

## 3. Navegación, pestañas y tablas

- **`PestanasDeEstado`**: Barra de pestañas conforme al patrón WAI-ARIA `tablist` y `tab`. Gestiona el foco mediante teclado (flechas izquierda/derecha, tecla Inicio y Fin) y muestra el conteo exacto de reservas por estado.
- **`TableList`**: Tabla accesible responsive con encabezados legibles, soporte de ordenamiento, celdas interactivas y estado vacío integrado. Admite inyección de barra de herramientas superior (`controles`) y renderizado alternativo (`renderContenido`).
- **`Paginacion` / `PieDeLista`**: Navegación de páginas con botones de tamaño táctil mínimo 44x44 px y etiquetas de estado claras.

---

## 4. Retroalimentación y modales

- **`AlertMessage`**: Alertas en el flujo del formulario (éxito, error, advertencia, información) vinculadas a los campos afectados.
- **`AvisoDeError`**: Banner de error de red o servidor con mensaje amigable y botón accesible «Reintentar».
- **`Aviso` (Toasts)**: Notificaciones de confirmación no bloqueantes de 6 segundos en región `role="status"` y `aria-live="polite"`. Incluye pausa automática al posar el cursor o enfocar con el teclado, botón de cierre manual y descarte inmediato con la tecla Escape.
- **`ModalConfirmacion`**: Diálogo modal accesible (`role="dialog"` y `aria-modal="true"`) con trampa de foco bidireccional (`useTrampaDeFoco`), cierre con Escape y botones de confirmación irreversibles («Sí, rechazar», «Sí, cancelar reserva»).

---

## 5. Experiencia especializada de reserva y disponibilidad

- **`ResumenDeSolicitud`**: Panel vivo de dos columnas que actualiza en tiempo real ambiente, fecha completa en letras, horario, duración y motivo de la solicitud.
- **`BarraResumenMovil`**: Barra adherida en la parte inferior para pantallas estrechas que mantiene visible el resumen de la reserva antes de accionar el botón de envío.
- **`AtajosDeDuracion`**: Selector rápido de duración (1 h, 2 h, 3 h) en cuadrícula de tres columnas de 44 px de alto que completan automáticamente la hora de término de la reserva.
- **`FranjaNuevaReserva`**: Barra interactiva de disponibilidad del ambiente seleccionado que previene solapamientos con reservas aprobadas.
- **`BloquesDisponibilidad` / `EjeTiempo`**: Línea de tiempo diaria con bloques proporcionales de 07:00 a 22:00, sub-carriles para solapamientos y línea de tiempo actual «Ahora».
