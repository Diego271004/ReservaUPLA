# Avance del Plan de Experiencia de Usuario (ReservaUPLA)

Registro de auditoría, implementación y verificación paso a paso de la experiencia visual y de interacción en la rama `feature/experiencia`.

---

## PASO 1. Nueva reserva (el flujo más importante)

### Qué se hizo
- Se sustituyó el selector desplegable clásico de ambiente por un componente accesible de tarjetas seleccionables (`SelectorDeAmbientes.jsx` y `SelectorDeAmbientes.module.css`), implementando el patrón WAI-ARIA `role="radiogroup"` con tarjetas `role="radio"`.
- Cada tarjeta muestra el icono representativo según el tipo de ambiente (`laboratorio`, `auditorio`, `sala`), nombre, capacidad en personas, ubicación geográfica dentro del campus y su estado actual (`Disponible` o `En mantenimiento`).
- Los ambientes en mantenimiento se presentan inhabilitados (`aria-disabled="true"`, `tabindex="-1"`), indicando explícitamente el motivo ("En mantenimiento (no disponible)").
- Navegación por teclado completa: flechas direccionales (`ArrowDown`, `ArrowUp`, `ArrowLeft`, `ArrowRight`), teclas `Home` y `End`, selección con `Space` o `Enter`, y soporte de roving tabindex omitiendo opciones inhabilitadas.
- Actualización de los datos de prueba y mock a los valores oficiales de `05_datos_prueba.sql` (Auditorio Principal: 200 personas, Pabellón B, piso 1).

### Tabla de verificación
| Métrica / Comprobación | Valor medido | Valor deducido | Estado | Comando / Origen |
| :--- | :--- | :--- | :--- | :--- |
| Pruebas unitarias frontend | 1,231 pasadas | - | OK | `npm --prefix frontend test` |
| Pruebas de integración / unitarias backend | 215 pasadas, 15 omitidas | - | OK | `dotnet test backend/ReservaUPLA.sln` |
| Contrastes WCAG 2.2 AA | 0 pares bajo umbral | - | OK | `node tools/usabilidad/contraste.mjs` |
| Desbordamiento horizontal (1280 px y 375 px) | 0 desbordes detectados | - | OK | `node tools/e2e/capturar-paso1.mjs` |

### Defectos corregidos
1. **D-EXP-01 (Teclado en SelectorDeAmbientes)**: El evento `keydown` solo reconocía `' '` para Espacio; se amplió a `'Space'`, `'Spacebar'` y `code === 'Space'`. Prueba: `src/components/ui/SelectorDeAmbientes.test.jsx`.
2. **D-EXP-02 (Contraste de borde deshabilitado)**: `.deshabilitada` definía un borde redundante que generaba advertencia de contraste en `contraste.mjs`; se removió la redundancia heredando el estilo de `.tarjeta`.

### Capturas generadas
- `docs/evidencias/experiencia/N-vacio-escritorio.png` (1280 px)
- `docs/evidencias/experiencia/N-vacio-movil.png` (375 px)
- `docs/evidencias/experiencia/N-ambiente-elegido-escritorio.png` (1280 px)
- `docs/evidencias/experiencia/N-ambiente-elegido-movil.png` (375 px)
- `docs/evidencias/experiencia/N-errores-escritorio.png` (1280 px)
- `docs/evidencias/experiencia/N-errores-movil.png` (375 px)
- `docs/evidencias/experiencia/N-disponible-escritorio.png` (1280 px)
- `docs/evidencias/experiencia/N-disponible-movil.png` (375 px)
- `docs/evidencias/experiencia/N-conflicto-escritorio.png` (1280 px)
- `docs/evidencias/experiencia/N-conflicto-movil.png` (375 px)
- `docs/evidencias/experiencia/N-fecha-pasada-escritorio.png` (1280 px)
- `docs/evidencias/experiencia/N-fecha-pasada-movil.png` (375 px)
- `docs/evidencias/experiencia/N-exito-escritorio.png` (1280 px)
- `docs/evidencias/experiencia/N-exito-movil.png` (375 px)

---

## PASO 1B. Retoques de Nueva reserva

### Qué se hizo
1. **Eliminación de texto de ayuda redundante**: Se retiró `ayuda={form.ayudaAmbiente}` ("30 personas · Pabellón A, piso 2") debajo del grupo de tarjetas en `NuevaReservaPage.jsx`, ya que esa información está presente de forma destacada tanto en la propia tarjeta como en el panel de resumen. Se garantizó que el atributo `aria-describedby` del radiogroup no incluya identificadores inexistentes cuando no hay ayuda complementaria.
2. **Unificación a un solo mensaje de choque**: Se retiró la segunda alerta roja redundante en `FranjaNuevaReserva.jsx`. Ahora se muestra una única alerta del sistema con el detalle horario exacto cuando existe choque con una reserva aprobada (`AvisoDisponibilidad`). En la franja de disponibilidad, el tramo ocupado conserva su distintivo de advertencia accesible con icono y texto (`<Icono nombre="aviso" /> Choque`). Las solicitudes pendientes que se cruzan se mantienen como aviso informativo tipo `info` (RN-01).
3. **Atajos de duración en cuadrícula fija**: Se reestructuró `AtajosDeDuracion.jsx` y `AtajosDeDuracion.module.css` para presentar los botones (1 h, 2 h, 3 h) en una cuadrícula fija de 3 columnas iguales (`grid-template-columns: repeat(3, minmax(0, 1fr))`) con altura mínima táctil de 44 px, garantizando una sola fila sin saltos a 1280 px, 375 px e incluso a 188 px.
4. **Patrón WAI-ARIA y validación accesible en grupo de tarjetas**:
   - La navegación con flechas mueve el foco y selecciona la opción disponible al mismo tiempo.
   - La tecla Espacio selecciona la tarjeta enfocada.
   - La tecla Tab sale del grupo hacia el siguiente control de formulario gracias a roving tabindex (`tabindex="0"` solo en la tarjeta activa).
   - En caso de envío con selector vacío, el mensaje de error `MENSAJES.ambienteVacio` queda asociado directamente al `radiogroup` mediante `aria-invalid="true"` y `aria-describedby`, el foco se traslada a la primera tarjeta habilitada y ésta muestra el anillo de foco normativo `#1E73BE` de 3 px (`.tarjeta:focus`).
5. **Corrección de datos mock del Auditorio Principal**: Se corrigieron las discrepancias en `capturar-paso1.mjs` y pruebas unitarias para reflejar exactamente los datos de prueba (`database/05_datos_prueba.sql`): 200 personas, Pabellón B, piso 1.
6. **Barra de resumen compacta en vista móvil (`BarraResumenMovil`)**: Se añadió un componente ligero que se renderiza justo sobre el botón «Registrar solicitud» en resoluciones móviles/tablets (`max-width: 1023px`), mostrando en vivo `Ambiente · Fecha corta · Horario` con `aria-live="polite"` sin tapar contenido ni obstaculizar la interacción, respetando `prefers-reduced-motion` sin animaciones.

### Tabla de verificación
| Métrica / Comprobación | Valor medido | Valor deducido | Estado | Comando / Origen |
| :--- | :--- | :--- | :--- | :--- |
| Pruebas unitarias frontend | 1,240 pasadas (52 archivos) | - | OK | `npm --prefix frontend test` |
| Pruebas backend (.NET 8) | 215 pasadas, 15 omitidas | - | OK | `dotnet test backend/ReservaUPLA.sln` |
| Verificación ESLint | 0 advertencias, 0 errores | - | OK | `npm --prefix frontend run lint` |
| Verificación Prettier | Todos los archivos formateados | - | OK | `npm --prefix frontend run format:check` |
| Contrastes WCAG 2.2 AA | 0 pares bajo el umbral | - | OK | `node tools/usabilidad/contraste.mjs` |
| Desbordamiento horizontal (1280 px y 375 px) | 0 desbordes en 14 capturas | - | OK | `node tools/e2e/capturar-paso1.mjs` |

### Defectos corregidos
1. **D-EXP-03 (Alerta roja duplicada de choque)**: `FranjaNuevaReserva.jsx` mostraba un `<AlertMessage tipo="error">` que duplicaba el aviso oficial del formulario. Se retiró la alerta en la franja preservando la etiqueta distintiva accesible con icono en el tramo ocupado. Prueba ajustada: `src/components/Disponibilidad/FranjaNuevaReserva.test.jsx`.
2. **D-EXP-04 (Discrepancia en datos de auditorio)**: Los mocks locales usaban `150` y `Pabellón Central`. Se unificó a `200` y `Pabellón B, piso 1`. Pruebas: `SelectorDeAmbientes.test.jsx` y `capturar-paso1.mjs`.

---

## PASO 2. Disponibilidad (`/disponibilidad`)

### Qué se hizo
1. **Línea de tiempo diaria con jerarquía clara**:
   - Bloques con distinción accesible por tipo (`Libre`, `Pendiente`, `Aprobada`, `Mantenimiento`) combinando fondo, borde, icono distintivo y texto.
   - Carriles dinámicos para solicitudes pendientes y reservas solapadas (`asignarCarrilesReservas`), evitando colisiones o que el texto de las reservas se corte.
   - Indicador de hora actual dentro del carril (`lineaAhora`) y etiqueta en el eje temporal con regla `clamp` sin desbordar.
2. **Leyenda de una sola fila**: Se adaptó el contenedor `.leyenda` para que en resoluciones de escritorio y tablet se mantenga estrictamente en una sola fila (`flex-wrap: nowrap`, altura táctil de 44 px).
3. **Selector de día compacto**: Disposición compacta en una sola fila `[◀] [Fecha: dd/mm/aaaa] [▶] [Hoy]` con altura homogénea de 44 px, adaptativo a móvil y libre de desborde a 188 px (`max-width: 320px` apila el botón «Hoy»).
4. **Panel accesible de reserva (`PanelReserva.jsx`)**:
   - Modal dialog accesible (`role="dialog"`, `aria-modal="true"`, `aria-labelledby`, trampa de foco con tecla Escape y botón «Volver»).
   - **Regla estricta de privacidad**: el rol Solicitante no puede ver nombre ni motivo en reservas ajenas (muestra únicamente horario, estado y nota informativa «Horario reservado por otro usuario.»). El Administrador y el Responsable sí ven el solicitante, motivo y el botón de acción principal «Ver detalle» hacia `/reservas/:id`.
5. **Navegación por teclado integral**: Las flechas (`ArrowRight`, `ArrowLeft`, `ArrowDown`, `ArrowUp`) permiten recorrer cronológicamente todos los bloques (libres y ocupados) por posición espacial; `Enter` o `Espacio` en un tramo libre abre directamente el formulario de Nueva reserva con ambiente, fecha y horas precargados (seleccionando la tarjeta del ambiente en el radiogroup); en un tramo ocupado abre el panel accesible de reserva.
6. **Estados del sistema implementados y verificados**:
   - **Carga**: Esqueleto con forma de carril (`.carrilEsqueleto`) simulando el nombre del ambiente y bloques de tiempo con animación de pulso, respetando `prefers-reduced-motion: reduce` (sin spinner).
   - **Día sin reservas**: Mensaje normativo «Día libre en todos los ambientes: puedes reservar el que necesites».
   - **Día pasado**: Alerta informativa «Solo lectura: este día ya pasó» con tramos libres deshabilitados.
   - **Error de red con Reintentar**: Alerta de error «No se pudo cargar la disponibilidad.» con botón secundario «Reintentar» que recarga los datos conservando la fecha seleccionada sin refrescar la página.

### Tabla de verificación
| Métrica / Comprobación | Valor medido | Valor deducido | Estado | Comando / Origen |
| :--- | :--- | :--- | :--- | :--- |
| Pruebas unitarias frontend | 1,248 pasadas (53 archivos) | - | OK | `npm --prefix frontend test` |
| Pruebas backend (.NET 8) | 215 pasadas, 15 omitidas | - | OK | `dotnet test backend/ReservaUPLA.sln` |
| Contrastes WCAG 2.2 AA | 0 pares bajo el umbral | - | OK | `node tools/usabilidad/contraste.mjs` |
| Desbordamiento horizontal (1280 px y 375 px) | 0 desbordes en 10 capturas | - | OK | `node tools/e2e/capturar-paso2.mjs` |

### Defectos corregidos
1. **D-EXP-05 (Color literal en PanelReserva)**: `PanelReserva.module.css` usaba `rgba(11, 37, 69, 0.45)` para el telón, lo cual violaba `identidad.test.js`. Se corrigió para usar el token canónico `var(--capa-modal)`.
2. **D-EXP-06 (Acceso a refs durante render)**: `BloquesDisponibilidad.jsx` reiniciaba `refs.current = []` durante el render; se refactorizó a un registro basado en callbacks estables `registrarRef(clave)`.

---

## PASO 3. Detalle de la reserva (`/reservas/:id`)

### Qué se hizo
1. **Cabecera destacada con jerarquía informativa**:
   - Muestra el ambiente con icono representativo, fecha formateada en lenguaje natural largo con cálculo exacto de duración (`jueves, 5 de noviembre de 2026 · 2 h`), y la insignia de estado oficial (`Insignia` con icono distintivo + texto).
2. **Línea de tiempo vertical de historial**:
   - Reemplaza la lista plana por un historial vertical accesible (`.historial`): punto azul primario para el estado actual (`.actual::before`, `aria-current="step"`), puntos verdes para hitos completados (`.pasado::before`).
   - Tiempos relativos accesibles generados con `tiempoRelativo` («hace 2 horas», «hace 3 días») acompañados del valor ISO absoluto en atributo `dateTime` y `aria-label` para lectores de pantalla.
3. **Jerarquía visual en la barra de acciones**:
   - Primario prominente: botón azul «Aprobar reserva».
   - Secundario de rechazo: botón con borde y texto rojo «Rechazar reserva».
   - Destructivo separado: botón «Cancelar solicitud» o «Cancelar reserva» alineado a la izquierda con separación clara del bloque de decisión y diálogo modal accesible de confirmación (`ModalDeReserva`).
4. **Tarjeta de conflicto proactiva (`.tarjetaConflicto`)**:
   - Al cargar una reserva en estado Pendiente, `useDetalleReserva` comprueba solapamientos en tiempo real contra `obtenerDisponibilidadDia`.
   - Si se cruza con una reserva aprobada, inhabilita el botón «Aprobar reserva» y renderiza una tarjeta de advertencia destacada («Se cruza con la reserva #12 de 10:00 a 12:00») con enlace directo a la reserva en conflicto.
5. **Restricción de roles y estados terminales**:
   - El rol Responsable es estrictamente de solo lectura (no muestra acciones de aprobación, rechazo ni cancelación).
   - En estados terminales (Rechazada o Cancelada), las acciones quedan ocultas o deshabilitadas con el motivo visible («Esta reserva ya fue rechazada/cancelada y no admite más cambios»).

### Tabla de verificación
| Métrica / Comprobación | Valor medido | Valor deducido | Estado | Comando / Origen |
| :--- | :--- | :--- | :--- | :--- |
| Pruebas unitarias frontend | 1,250 pasadas (53 archivos) | - | OK | `npm --prefix frontend test` |
| Pruebas backend (.NET 8) | 215 pasadas, 15 omitidas | - | OK | `dotnet test backend/ReservaUPLA.sln` |
| Contrastes WCAG 2.2 AA | 0 pares bajo el umbral | - | OK | `node tools/usabilidad/contraste.mjs` |
| Desbordamiento horizontal (1280 px y 375 px) | 0 desbordes en 10 capturas | - | OK | `node tools/e2e/capturar-paso3.mjs` |

### Defectos corregidos
1. **D-EXP-07 (Compatibilidad de aserciones en texto de evento)**: Los tests existentes verificaban la cadena exacta de `evento.texto`. Se estructuró `.eventoTexto` preservando la cadena original y encapsulando el tiempo relativo en un `<time>` semántico adyacente. Prueba: `src/pages/DetalleReservaPage.test.jsx`.
2. **D-EXP-08 (Detección asíncrona de conflicto en detalle)**: Se integró consulta de disponibilidad en `useDetalleReserva` para reservas pendientes, detectando choques de horario con reservas aprobadas antes de que el Administrador envíe la decisión.

---

## PASO 4. Inicio del Solicitante y del Responsable

### Qué se hizo
1. **Inicio del Solicitante (`InicioSolicitante.jsx`)**:
   - Portada con banner institucional plano (`var(--color-marino)`), fecha en lenguaje natural (`fechaLarga`), titular contextual («Tienes una reserva programada» o «Todo listo para tu próxima reserva»), horario y botón «Reservar un ambiente».
   - Tarjeta destacada «Tu próxima reserva» con icono de ambiente, horario formateado, insignia oficial de estado, enlace a «Ver detalle» y botón destructivo «Cancelar reserva» con modal de confirmación accesible (`ModalDeReserva`).
   - Estado vacío accesible con icono de calendario y siguiente paso natural: «No tienes una próxima reserva. No tienes reservas próximas. Elige un ambiente para comenzar.» y botón «Reservar un ambiente».
   - Sección «Tus solicitudes» con fichas de indicador por estado (Pendiente, Aprobada, Rechazada, Cancelada) alineadas con `box-shadow: var(--elevacion-tarjeta)` e icono en caja tintada, más listado de últimas solicitudes con insignia de estado y botón «Ver detalle».
2. **Inicio del Responsable (`InicioResponsable.jsx`)**:
   - Portada con diseño idéntico al del Administrador: saludo, fecha, resumen de reservas del día y acción rápida «Ver disponibilidad».
   - Fila de tarjetas de indicador (`CardIndicador`): Reservas para hoy (tono `info`), Próximas reservas (tono `aviso`) y Ambientes a cargo (tono `exito` con enlace a `/mi-ambiente`).
   - «Hoy en tu ambiente»: agenda cronológica con hora destacada, nombre del ambiente, solicitante, insignia y botón «Ver detalle» (estado vacío normativo: «No hay reservas para hoy.»).
   - «Próximas reservas»: listado cronológico de reservas posteriores en sus ambientes con estado y enlace (estado vacío: «No hay próximas reservas.»).
3. **Estados transversales de experiencia**:
   - Esqueleto de carga con bloques de tarjetas simuladas y texto accesible «Iniciando tu dashboard…», con pulso suspendido bajo `prefers-reduced-motion: reduce`.
   - Error de red con componente `AvisoDeError` y botón «Reintentar».
   - Total adaptabilidad responsiva sin desborde a 1280 px, 375 px y 188 px.

### Tabla de verificación
| Métrica / Comprobación | Valor medido | Valor deducido | Estado | Comando / Origen |
| :--- | :--- | :--- | :--- | :--- |
| Pruebas unitarias frontend | 1,250 pasadas (53 archivos) | - | OK | `npm --prefix frontend test` |
| Pruebas backend (.NET 8) | 215 pasadas, 15 omitidas | - | OK | `dotnet test backend/ReservaUPLA.sln` |
| Contrastes WCAG 2.2 AA | 0 pares bajo el umbral | - | OK | `node tools/usabilidad/contraste.mjs` |
| Desbordamiento horizontal (1280 px y 375 px) | 0 desbordes en 14 capturas | - | OK | `node tools/e2e/capturar-paso4.mjs` |

### Defectos corregidos
1. **D-EXP-09 (Prop `ahora` en InicioSolicitante e InicioResponsable)**: `DashboardPage.jsx` solo suministraba la prop de reloj `ahora` a `InicioAdministrador`, provocando que las otras vistas recurrieran al reloj del sistema en pruebas con timers falsos. Se pasó `ahora={ahora}` a los tres componentes. Prueba: `DashboardPage.test.jsx`.

---

## PASO 5. Ambientes y Usuarios (y Formularios)

### Qué se hizo
1. **Ambientes (`AmbientesPage.jsx`)**:
   - Se añadió un alternador de visualización accesible («Tarjetas» | «Tabla») con `role="group"` y `aria-pressed`, persistiendo la preferencia en `localStorage.getItem('reservaupla.vistaAmbientes')`.
   - En modo tarjetas: cuadrícula responsiva (`minmax(min(280px, 100%), 1fr)`) con tarjetas que presentan icono por tipo, nombre, tipo en mayúsculas, capacidad, ubicación, responsable con avatar (`CeldaDePersona`), insignia de estado y la barra accesible de ocupación de hoy (`BarraDeOcupacion`), o «—» si está en mantenimiento.
   - En modo tabla: mantiene la vista tabular canónica con `TableList` asegurando compatibilidad completa.
2. **Usuarios (`UsuariosPage.jsx`)**:
   - Se integró un buscador reactivo en vivo (`TextInput`) que filtra en tiempo real por nombre completo, correo institucional o rol asignado.
   - Mensaje de estado vacío explicativo si no hay coincidencias («No se encontraron usuarios que coincidan con «...».»).
   - Visualización con avatar de iniciales (`CeldaDePersona`), rol e insignias accesibles (icono + texto) para estados Activo e Inactivo.
3. **Formularios de Registro (`AmbienteFormPage.jsx` y `UsuarioFormPage.jsx`)**:
   - Validación inmediata en tiempo real al desenfocar (`onBlur`) en todos los campos a través de `useFormulario`.
   - Contadores de caracteres accesibles asociados en vivo a la ayuda del campo (`aria-describedby`):
     - Ambiente: Nombre (`X de 120 caracteres`) y Ubicación (`X de 160 caracteres`).
     - Usuario: Nombre completo (`X de 120 caracteres`).
   - Requisitos de contraseña visibles antes de escribir («Entre 8 y 72 caracteres, con al menos una letra y un número.») que desaparecen limpiamente cuando se muestra un error de validación.
   - Desplazamiento y foco automático inmediato al primer campo con error al intentar enviar.

### Tabla de verificación
| Métrica / Comprobación | Valor medido | Valor deducido | Estado | Comando / Origen |
| :--- | :--- | :--- | :--- | :--- |
| Pruebas unitarias frontend | 1,253 pasadas (53 archivos) | - | OK | `npm --prefix frontend test` |
| Pruebas backend (.NET 8) | 215 pasadas, 15 omitidas | - | OK | `dotnet test backend/ReservaUPLA.sln` |
| Contrastes WCAG 2.2 AA | 0 pares bajo el umbral | - | OK | `node tools/usabilidad/contraste.mjs` |
| Desbordamiento horizontal (1280 px y 375 px) | 0 desbordes en 12 capturas | - | OK | `node tools/e2e/capturar-paso5.mjs` |

### Defectos corregidos
1. **D-EXP-10 (Persistencia y filtrado en páginas de listado)**: `ListadoPage.jsx` no permitía inyectar controles de barra de herramientas ni renderizado alternativo. Se habilitaron las props `controles` y `renderContenido` permitiendo alternar entre tarjetas y tablas y filtrar en tiempo real sin romper `TableList`. Prueba: `src/pages/listados.test.jsx`.

---

## PASO 6. Login, 403 y 404

### Trabajo realizado
1. **Página de Login (`LoginPage.jsx` y `LoginPage.module.css`)**:
   - Verificado y asegurado el diseño a pantalla dividida (split-layout): foto institucional del campus con degradado lateral oscuro y franja dorada a la izquierda; tarjeta blanca flotante sobre fondo gris azulado a la derecha con logo oficial de la UPLA.
   - Altura de controles optimizada a 48 px (`--alto-control-login: 48px`) para campos de texto y botón primario «Ingresar».
   - Alternancia de visualización de contraseña accesible con botón embebido de tamaño táctil mínimo 44x44 px y etiqueta dinámica («Mostrar contraseña» / «Ocultar contraseña»).
   - Detección activa no invasiva de bloqueo de mayúsculas (Bloq Mayús / CapsLock) mediante eventos `onKeyDown`, `onKeyUp` y `onMouseDown`.
   - Estado de carga «Verificando credenciales…» en el botón de envío, deshabilitando reintentos concurrentes y permitiendo la cancelación/limpieza con el botón secundario «Cancelar».
   - Retención íntegra de campos tras errores de credenciales (conserva correo, limpia contraseña y la enfoca).
   - Acordeón accesible para recuperación/soporte («¿Olvidaste tu contraseña?») con `aria-expanded` y vinculación `aria-controls`.
2. **Páginas de Error de Ruta (`ErrorRutaPage.jsx` y `ErrorRutaPage.module.css`)**:
   - 403 (Acceso no autorizado / `SinPermisoPage`): Título semántico `<h1>Sin permiso</h1>`, ilustración sobria `EstadoVacio`, mensaje «No tienes permiso para realizar esta acción.» y botón de regreso «Volver al inicio» con altura táctil >= 44 px y foco visible de 3 px.
   - 404 (Página no encontrada / `NoEncontradaPage`): Título semántico `<h1>No encontramos esa página.</h1>`, texto explicativo «Esta página no existe o cambió de dirección.», ilustración `EstadoVacio` y botón «Volver al inicio» estilizado con variables de tokens y altura accesible.

### Tabla de verificación
| Métrica / Comprobación | Valor medido | Valor deducido | Estado | Comando / Origen |
| :--- | :--- | :--- | :--- | :--- |
| Pruebas unitarias frontend | 1,253 pasadas (53 archivos) | - | OK | `npm --prefix frontend test` |
| Pruebas de Login (`LoginPage.test.jsx`) | 36 pasadas | - | OK | `npm --prefix frontend test -- src/pages/LoginPage.test.jsx` |
| Pruebas de Error (`ErrorRutaPage.test.jsx`) | 2 pasadas | - | OK | `npm --prefix frontend test -- src/pages/ErrorRutaPage.test.jsx` |
| Pruebas de Rutas (`rutas.test.jsx`) | 31 pasadas | - | OK | `npm --prefix frontend test -- src/rutas.test.jsx` |
| Contrastes WCAG 2.2 AA | 0 pares bajo el umbral | - | OK | `node tools/usabilidad/contraste.mjs` |
| Desbordamiento horizontal (1280 px y 375 px) | 0 desbordes en 6 pantallas | - | OK | `node tools/e2e/capturar-paso6.mjs` |

### Defectos corregidos
1. **D-EXP-11 (Estructuración y mensaje de rescate en páginas de error)**: `ErrorRutaPage.jsx` carecía de mensaje humano complementario en 404 y su enlace de regreso carecía de padding y tamaño de objetivo táctil accesible. Se añadió el mensaje explicativo a `NoEncontradaPage` y se dotó a `.volver` de borde, fondo tokenizado, padding táctil >= 44 px y foco visible accesible de 3 px. Pruebas: `src/pages/ErrorRutaPage.test.jsx` y `src/rutas.test.jsx`.

---

## PASO 7. Consistencia y Microcopy

### Trabajo realizado
1. **Auditoría de Cabeceras y Navegación**:
   - Todas las pantallas principales (`DashboardPage`, `DisponibilidadPage`, `ReservasPage`, `DetalleReservaPage`, `NuevaReservaPage`, `AmbientesPage`, `UsuariosPage`, `MiAmbientePage`, `FormularioTarjeta`) utilizan uniformemente el componente `PageHeader` con título semántico `<h1>`, subtítulo o id de accesibilidad y bloque de acciones alineado a la derecha.
   - Navegación de migas de pan semántica (`<nav aria-label="Migas de pan">`) en `Topbar.jsx`, con enlaces accesibles de tamaño objetivo mínimo 44x44 px (`min-width: var(--alto-control); min-height: var(--alto-control)`), estado `aria-current="page"` para la página activa y separación accesible en español.
   - Mapa del sitio verificado y sincronizado con `node tools/usabilidad/mapa-del-sitio.mjs --verificar` (100% coincidente en `docs/usabilidad/arquitectura-de-informacion.md`).
2. **Auditoría de Espaciado, Radios y Elevaciones**:
   - Cumplimiento estricto del sistema de diseño y tokens (`tokens.css`): 0 radios arbitrarios sueltos en CSS (`--radio: 6px`, `--radio-pequeno: 4px`, `--radio-tarjeta: 12px`, `--radio-completo: 999px`).
   - Sombras y elevaciones limitadas exclusivamente a tokens canónicos (`--elevacion-tarjeta` y `--elevacion-flotante`).
   - Removidos modificadores `!important` que violaban la política de selectores limpios en `InicioSolicitante.module.css` e `InicioResponsable.module.css`.
3. **Mecanismos de Notificación y Carga**:
   - Toasts (`Avisos.jsx`): Temporizador de 6 s con pausa automática al posar el puntero o enfocar (`onMouseEnter`, `onFocus`), reanudación al salir (`onMouseLeave`, `onBlur`), botón de cierre accesible («Cerrar aviso») y cierre inmediato con teclado al pulsar Escape.
   - Estados de carga: Esqueletos (skeleton) réplica del layout en `DashboardPage`, `DisponibilidadPage`, `InicioSolicitante`, `InicioResponsable` y tablas, deshabilitando animaciones cuando el usuario tiene activado `prefers-reduced-motion: reduce`.
   - Estados vacíos: Uso consistente de `EstadoVacio` con ilustración temática sobria, texto explicativo y llamada a la acción hacia el siguiente paso lógico.
4. **Microcopy y Verbos de Acción**:
   - Estándar estricto de verbos de acción en segunda persona:
     - Apertura de formularios: «Nuevo ambiente», «Nuevo usuario».
     - Envío de formularios: «Registrar ambiente», «Registrar usuario», «Registrar solicitud».
     - Salida sin guardar: «Volver» (nunca «Cancelar»).
     - Limpieza de datos: «Limpiar formulario» o «Limpiar filtros».
     - Anulación de reservas: «Cancelar reserva» / «Cancelar solicitud» (únicos casos válidos de «Cancelar»).
     - 0 apariciones de botones genéricos «Guardar» o «Aceptar». Verificado en `src/etiquetasDeAcciones.test.jsx`.

### Tabla de verificación
| Métrica / Comprobación | Valor medido | Valor deducido | Estado | Comando / Origen |
| :--- | :--- | :--- | :--- | :--- |
| Pruebas unitarias frontend | 1,262 pasadas (53 archivos) | - | OK | `npm --prefix frontend test` |
| Pruebas de Identidad Visual (`identidad.test.js`) | 223 pasadas | - | OK | `npx vitest run src/styles/identidad.test.js` |
| Pruebas de Accesibilidad CSS (`accesibilidad.test.js`) | 38 pasadas | - | OK | `npx vitest run src/styles/accesibilidad.test.js` |
| Pruebas de Etiquetas de Acciones (`etiquetasDeAcciones.test.jsx`) | 5 pasadas | - | OK | `npx vitest run src/etiquetasDeAcciones.test.jsx` |
| Verificación del Mapa del Sitio | Mapa coincide con el código | - | OK | `node tools/usabilidad/mapa-del-sitio.mjs --verificar` |

### Defectos corregidos
1. **D-EXP-12 (Consistencia de tokens y vacíos en listado)**: `identidad.test.js` detectó uso indebido de `var(--degradado-portada)` en las portadas de rol y `!important` en `.resumenCard`. Se corrigieron los estilos usando `var(--color-marino)` plano y se ajustó `UsuariosPage.jsx` para invocar `TableList` cuando `datos.length === 0`. Pruebas: `identidad.test.js` y `App.test.jsx`.

---

## PASO 8. Rendimiento y Robustez

### Trabajo realizado
1. **Medición del Peso del Paquete y Carga (`docs/evidencias/experiencia-peso.txt`)**:
   - Compilación de producción con Vite 8.3.5 ejecutada en 634 ms.
   - Comparación estricta y reproducible contra `main` en carpeta temporal (`worktree`):
     - **Antes (`main`)**: JS gzip = 105.85 kB, CSS gzip = 4.54 kB, 127 módulos, 656 ms.
     - **Después (`feature/experiencia`)**: JS gzip = **125.89 kB** (+20.04 kB), CSS gzip = **12.54 kB** (+8.00 kB), 188 módulos, 634 ms.
     - **Holgura presupuestaria**: Holgura JS: **24.11 kB** (límite 150 kB); Holgura CSS: **7.46 kB** (límite 20 kB).
   - Tipografías estrictamente autoalojadas con `@fontsource` en subset latin exclusivamente para los pesos requeridos (Poppins 600, Montserrat 400, 500, 600, 700) en formatos WOFF y WOFF2.
   - Activos gráficos comprimidos en formato WebP con compresión moderna.
2. **Verificación de Resiliencia y Manejo de Errores**:
   - **API Lenta**: Skeletons con dimensiones idénticas a los bloques reales en `DashboardPage`, `DisponibilidadPage`, `InicioSolicitante`, `InicioResponsable` y tablas, deteniendo la animación cuando `prefers-reduced-motion` está activo.
   - **API Caída / Errores de Red**: Todas las páginas (`MiAmbientePage`, `ReservasPage`, `DashboardPage`, `DisponibilidadPage`, `ListadoPage`) capturan fallos de conexión y de servidor mediante `AvisoDeError` permitiendo la recarga con el botón accesible «Reintentar».
   - **Sesión Vencida (401)**: El cliente API (`llamarApi.js`) detecta respuestas 401 en vuelo, limpia el estado de sesión local y redirige limpiamente a `/login` desplegando el aviso informativo de sesión terminada (`MENSAJES.sesionTerminada`).
   - **Protección contra Doble Clic**: `useFormulario.js` y botones de acción (`Button.jsx`) gestionan el estado `enviando = true` de forma atómica, impidiendo disparos dobles mientras una petición está pendiente.
   - **Persistencia de Formularios**: Los formularios retienen los datos introducidos tras recibir respuestas de error 400 del servidor, enfocando automáticamente el primer campo con error (`enfocarPrimerInvalido`).
3. **Verificación de Reglas de Negocio en Backend**:
   - Ejecución de la suite completa de .NET 8 (`dotnet test backend/ReservaUPLA.sln`): 215 pruebas superadas exitosamente (15 omitidas por requerir base de datos viva).
   - Cero regresiones en reglas RN-01 a RN-07.

---

## PASO 9. Documentación y Dossier de Cierre

### Trabajo realizado
1. **Actualización de Documentación de Diseño y Arquitectura**:
   - `docs/diseno/DESIGN.md`: Actualizado con las decisiones tomadas frente al Stitch de referencia (tipografía Poppins/Montserrat autoalojada, foco `#1E73BE` de alto contraste, tarjetas `radiogroup` para selección de ambientes, línea de tiempo diaria sin calendarios inflados, validación reactiva y microcopy estandarizado).
   - `docs/diseno/experiencia.md`: Actualizado con la especificación completa de todos los flujos rediseñados (portadas por rol, disponibilidad, reservas, detalle, formularios y login/errores).
   - `docs/diseno/componentes.md`: Actualizado con el catálogo íntegro de componentes (`SelectorDeAmbientes`, `BarraResumenMovil`, `PageHeader`, `PestanasDeEstado`, `EstadoVacio`, `BarraDeOcupacion`, `CeldaDePersona`, `AtajosDeDuracion`, `useTrampaDeFoco`, etc.).
   - `docs/diseno/antes-despues.md`: Creado el informe comparativo detallado antes/después cubriendo las 6 dimensiones de la aplicación.
   - `docs/bitacora-evaluacion.md`: Actualizado con la totalidad de defectos y correcciones registradas (#70 a #88).

---

## PASO 10. Medición Real en el Entorno Completo

### Registro de Fecha y Hora de las Corridas Oficiales
- **Suite de Extremo a Extremo (`npm run todo`)**:
  - **Fecha y hora de ejecución**: **2026-11-06 10:26:33**
  - **Directorio de trabajo**: `tools/e2e`
  - **Duración medida**: **288 segundos**
  - **Salida final**: `todo correcto` (0 fallos, código de salida 0)
- **Auditoría Automatizada de Accesibilidad (`accesibilidad.mjs`)**:
  - **Fecha y hora de ejecución**: **2026-11-06 10:21:29**
  - **Directorio de trabajo**: `tools/usabilidad`
  - **Comando**: `ETAPA=experiencia node accesibilidad.mjs`
  - **Duración medida**: **235 segundos**
  - **Archivo de salida**: `docs/evidencias/experiencia-accesibilidad.txt`

### 1. Salida Resumida de `npm run todo` (tools/e2e)
- `OK` Fase 5 · Entrada de datos (login, ambientes, usuarios, nueva reserva)
- `OK` Fase 6 · Validaciones (disponibilidad, aprobar, conflicto, rechazar, cancelar)
- `OK` Fase 7 · Ayuda del ambiente y RN-07
- `OK` Fase 9 · Salida de datos (Dashboard, Reservas con filtros, Mi ambiente)
- `OK` Ampliación · Arquitectura de información (etiquetas, regreso y menú en el detalle)
- `OK` Experiencia A · Layout (menú colapsable, barra superior, menú de usuario, contador, avisos, panel móvil)
- `OK` Layout · Botón del menú móvil, Escape y cierre de sesión por el menú de usuario
- `OK` Sub-fase B · Inicio por Administrador, Solicitante y Responsable
- `OK` Sub-fase C · Vista de disponibilidad por los tres roles
- **Resultado general**: `todo correcto` (9 de 9 fases superadas).

### 2. Salida Resumida de `ETAPA=experiencia node accesibilidad.mjs` (tools/usabilidad)
- **Axe-core**: **0 violaciones en 87 mediciones** (0 reglas distintas) — **MEDIDO**.
- **Pares de contraste**: **0 pares por debajo del umbral** (140 evaluados, 100% WCAG AA) — **MEDIDO**.
- **Objetivos táctiles**: **0 elementos menores de 44 px** en 44 estados móviles — **MEDIDO**.
- **Teclado / Foco**: **0 paradas sin foco visible**; **0 paradas fuera del modal con el modal abierto** — **MEDIDO**.
- **Zoom 200 % y reflujo (188 px)**: **0 de 30 combinaciones con scroll horizontal** — **MEDIDO**.
- **Movimiento reducido**: **0 animaciones infinitas en marcha** con `prefers-reduced-motion: reduce` activado — **MEDIDO**.
- **Sub-fase A (layout)**: **0 comprobaciones fallidas** — **MEDIDO**.

### Tabla Comparativa de Metas de Accesibilidad
| Métrica de Accesibilidad | Meta Requerida | Valor Medido Real | Estado | Comando de Medición |
| :--- | :--- | :--- | :--- | :--- |
| Violaciones axe-core | 0 | **0** (en 87 mediciones) | CUMPLIDO | `node tools/usabilidad/accesibilidad.mjs` |
| Contrastes bajo umbral WCAG AA | 0 | **0** (en 140 pares evaluados) | CUMPLIDO | `node tools/usabilidad/accesibilidad.mjs` |
| Objetivos táctiles < 44 px | 0 | **0** (en 44 estados móviles) | CUMPLIDO | `node tools/usabilidad/accesibilidad.mjs` |
| Paradas sin foco visible | 0 | **0** | CUMPLIDO | `node tools/usabilidad/accesibilidad.mjs` |
| Foco fuera de modal abierto | 0 | **0** | CUMPLIDO | `node tools/usabilidad/accesibilidad.mjs` |
| Desbordes a 188 px (zoom 200%) | 0 de 30 | **0 de 30** | CUMPLIDO | `node tools/usabilidad/accesibilidad.mjs` |
| Animaciones con movimiento reducido | 0 | **0** | CUMPLIDO | `node tools/usabilidad/accesibilidad.mjs` |
| E2E completo (`npm run todo`) | Todo correcto | **Todo correcto** (9/9 fases) | CUMPLIDO | `npm --prefix tools/e2e run todo` |

---

## PASO 11. Tabla Control → Prueba (Evidencia de Cobertura)

Matriz exhaustiva de cobertura que vincula cada control, componente y estado de los pasos 1 a 6 con su respectiva prueba automatizada en la suite:

| Control o Estado | Archivo de Prueba | Nombre del Test | ¿Automática o Manual? |
| :--- | :--- | :--- | :--- |
| **Tarjeta de ambiente** (`SelectorDeAmbientes`) | `src/components/ui/SelectorDeAmbientes.test.jsx` | `renderiza el radiogroup con su etiqueta y cada ambiente como tarjeta radio` | Automática |
| **Atajos de duración** (1 h, 2 h, 3 h) | `src/pages/formulariosRegistro.test.jsx` | `un atajo completa la hora de fin, queda presionado y el resumen lo refleja` | Automática |
| **Resumen de solicitud** (vivo) | `src/pages/formulariosRegistro.test.jsx`<br>`src/utils/resumenDeSolicitud.test.js` | `el resumen cambia al cambiar ambiente/fecha/horario`<br>`lo que se elige aparece en el resumen al instante, con la duración`<br>`suma las horas a la de inicio` | Automática |
| **Barra móvil de resumen** (`BarraResumenMovil`) | `src/components/ResumenDeSolicitud/BarraResumenMovil.test.jsx` | `muestra datos completos en vivo de ambiente, fecha y horario` | Automática |
| **Bloque de línea de tiempo** (carriles) | `src/pages/DisponibilidadPage.test.jsx` | `asigna carriles a tres reservas solapadas y conserva la base sin solapamientos` | Automática |
| **Tramo libre** (interacción y navegación) | `src/pages/DisponibilidadPage.test.jsx` | `muestra día sin reservas con tramos libres y prerrellena Nueva reserva al usar Enter` | Automática |
| **Selector de día** (compacto con Hoy) | `src/pages/DisponibilidadPage.test.jsx` | `navega al día anterior, siguiente y vuelve a hoy` | Automática |
| **Esqueletos de carga** (`Skeleton`) | `src/pages/DisponibilidadPage.test.jsx` | `esqueleto de carga: muestra el esqueleto durante la carga, distinto del estado vacío`<br>`estado vacío: terminado de cargar sin reservas muestra el aviso de día libre y no el esqueleto` | Automática |
| **Día pasado** (solo lectura) | `src/pages/DisponibilidadPage.test.jsx` | `día pasado deshabilita los tramos libres` | Automática |
| **Errores con Reintentar** (`AvisoDeError`) | `src/components/AvisoDeError/AvisoDeError.test.jsx` | `muestra el mensaje como alerta y «Reintentar» lo vuelve a pedir` | Automática |
| **Acciones del detalle** (Aprobar, Rechazar) | `src/pages/DetalleReservaPage.test.jsx` | `Administrador con una reserva Pendiente: Aprobar, Rechazar y Cancelar reserva, todos habilitados` | Automática |
| **Modales accesibles** (`ModalDeReserva`) | `src/components/ModalDeReserva/ModalDeReserva.test.jsx` | `foco atrapado: Tab cicla dentro del modal`<br>`tecla Esc cierra el modal y regresa el foco al elemento que abrió`<br>`el botón principal lleva el verbo exacto según la acción`<br>`sin acción está cerrado` | Automática |
| **Tarjeta de conflicto y aprobar con choque** | `src/pages/DetalleReservaPage.test.jsx`<br>`backend/ReservaUPLA.API.Tests/ConcurrenciaAprobacionTests.cs` | `si aprobar causaría choque con otra aprobada, muestra la tarjeta de conflicto y deshabilita Aprobar`<br>`si el backend responde 409 al aprobar (conflicto concurrente), muestra el mensaje de error y no se rompe`<br>`RN01_dos_aprobaciones_simultaneas_que_se_cruzan_dan_un_200_y_un_409_y_una_sola_Aprobada` | Automática |
| **Portada de Administrador** | `src/components/InicioAdmin/Portada.test.jsx` | `con varias pendientes dice cuántas esperan decisión, la fecha en letras y lleva a revisarlas` | Automática |
| **Portada de Solicitante** | `src/pages/DashboardPage.test.jsx` | `Solicitante muestra su próxima reserva y resumen de estados con enlaces` | Automática |
| **Portada de Responsable** | `src/pages/DashboardPage.test.jsx` | `Responsable muestra agenda de hoy y próximas reservas` | Automática |
| **Alternador de vista** (Tarjetas / Tabla) | `src/pages/listados.test.jsx` | `alternador de vista (tarjetas/tabla) persiste en localStorage y muestra tarjetas con ocupación` | Automática |
| **Buscador reactivo de usuarios** | `src/pages/listados.test.jsx` | `buscador de usuarios filtra en vivo por nombre, correo y rol` | Automática |
| **Formularios con validación al salir** | `src/pages/formulariosRegistro.test.jsx` | `error al salir del campo (blur), antes de enviar`<br>`al enviar vacío, foco al primer error`<br>`campos vacíos: no envía y muestra un mensaje en cada campo, enfocando el primero` | Automática |
| **Login con visor de contraseña** | `src/components/ui/campos.test.jsx` | `el botón alterna con clic y con el teclado (Enter)` | Automática |
| **Páginas 403 y 404** (`ErrorRutaPage`) | `src/pages/ErrorRutaPage.test.jsx` | `muestra el título y un enlace de regreso con el estilo de enlace del sistema (no el del navegador)`<br>`muestra mensaje, ilustración decorativa y enlace «Volver al inicio» con foco visible` | Automática |

---

## PASO 12. Puntos Pendientes de Confirmar (Evidencia Técnica)

### 1. Disponibilidad
- **Teclado**: Flechas navegan cronológicamente entre bloques y `Enter` abre el panel o redirige al formulario. Comprobado en `src/pages/DisponibilidadPage.test.jsx` y verificado en recorrido real de teclado en `accesibilidad.mjs`.
- **Estados**:
  - Esqueleto con pulsos adaptativos probado en `src/pages/DisponibilidadPage.test.jsx`.
  - Día vacío: «Día libre en todos los ambientes: puedes reservar el que necesites».
  - Día pasado: «Solo lectura: este día ya pasó» con tramos libres deshabilitados.
  - Error: «No se pudo cargar la disponibilidad.» con botón «Reintentar».
- **Capturas**: `C-con-reservas-escritorio.png`, `C-vacio-escritorio.png`, `C-pasado-escritorio.png`, `C-carga-escritorio.png`, `C-error-escritorio.png`.

### 2. Detalle de la Reserva
- **Cancelar reserva destructiva y separada**: Botón alineado a la izquierda con separación clara del bloque de decisión. Modal de confirmación (`ModalDeReserva.jsx`) con foco atrapado mediante `useTrampaDeFoco`, cierre con `Escape` y botón con el verbo exacto («Cancelar reserva» o «Cancelar solicitud»).
- **Estados terminales (Rechazada y Cancelada)**: Acciones deshabilitadas u ocultas, con el motivo visible («Esta reserva ya fue rechazada/cancelada y no admite más cambios»).
- **Capturas**: `D-pendiente-escritorio.png`, `D-aprobada-escritorio.png`, `D-rechazada-escritorio.png`, `D-cancelada-escritorio.png`, `D-conflicto-escritorio.png`.

### 3. Aprobar con Choque (Defecto #84)
- **Bloqueo preventivo en interfaz**: Cuando `vm.conflicto` detecta colisión con una reserva aprobada, el botón «Aprobar reserva» queda deshabilitado y se muestra la tarjeta de advertencia `.tarjetaConflicto` con enlace accesible a la reserva colisionante.
- **Manejo de concurrencia 409 en frontend**: Se añadió una prueba unitaria en `frontend/src/pages/DetalleReservaPage.test.jsx` confirmando que si el backend retorna `409 Conflict` al intentar aprobar, la interfaz captura el error, muestra el mensaje normativo de conflicto y permanece estable sin romperse.
- **Garantía en backend**: Comprobado en `backend/ReservaUPLA.Application.Tests/Services/ConcurrenciaAprobacionTests.cs` (verifica que dos transacciones simultáneas de aprobación sobre reservas solapadas resultan en `200 OK` para la primera y `409 Conflict` para la segunda bajo concurrencia pesimista/bloqueo a nivel de base de datos).

### 4. Inicios de Solicitante y Responsable
- **Estados de interfaz**:
  - Cargando: Esqueletos que replican las tarjetas y portadas sin causar salto de contenido.
  - Vacío: Mensajes normativos con llamada a la acción («No tienes reservas próximas. Elige un ambiente para comenzar.» con botón «Reservar un ambiente»; «No hay reservas para hoy.» con botón «Ver disponibilidad»).
  - Error: Alerta con botón «Reintentar» que recarga los datos del panel sin refrescar la página completa.
- **Capturas**: `I-admin-escritorio.png`, `I-solicitante-con-reservas-escritorio.png`, `I-solicitante-vacio-escritorio.png`, `I-responsable-con-reservas-escritorio.png`, `I-responsable-vacio-escritorio.png`, `I-carga-escritorio.png`, `I-error-escritorio.png`.

### 5. Ambientes y Formularios
- **Iconografía unificada**: Las tarjetas de ambientes en `AmbientesPage.jsx` emplean exactamente los mismos iconos semánticos que en `SelectorDeAmbientes.jsx` a través de `iconoDeTipoAmbiente` (`Icono.jsx`).
- **Validaciones en formularios**:
  - Validación al desenfocar (`onBlur`) en todos los campos (`useFormulario.js`).
  - Contadores de longitud en vivo asociados mediante `aria-describedby` (p. ej. `X de 120 caracteres`).
  - Requisitos de contraseña visibles antes de escribir y reemplazados por el mensaje de error si no se cumplen.
  - Enfoque inmediato automático al primer campo con error al intentar enviar.
- **Capturas**: `A-ambientes-tarjetas-escritorio.png`, `A-ambiente-formulario-escritorio.png`, `A-usuarios-lista-escritorio.png`, `A-usuario-formulario-escritorio.png`.

### 6. Contraseña Mostrar/Ocultar
- **Eliminación de `aria-pressed`**: En `PasswordInput.jsx`, el botón de alternancia se configuró sin `aria-pressed`, dejando únicamente la etiqueta accesible dinámica (`aria-label={mostrar ? TEXTOS.ocultarContrasena : TEXTOS.mostrarContrasena}`).
- **Prueba ajustada**: Actualizada en `frontend/src/components/ui/campos.test.jsx`, verificando que el botón cambia su etiqueta y el atributo `type` del input entre `password` y `text`.

### 7. Centralización de Textos en `messages.js`
- Se trasladó el literal `textoSinUsuariosCoincidentes` a `messages.js` como función parametrizada:
  ```js
  textoSinUsuariosCoincidentes: (busqueda) => `No se encontraron usuarios que coincidan con «${busqueda}».`
  ```
- Se migraron los literales auxiliares `buscarUsuarios`, `ayudaBuscarUsuarios` y `paginaNoEncontradaDetalle`.
- **Resultado del grep de verificación**: Cero literales de interfaz huérfanos o no traducidos en componentes o páginas.

### 8. Medición de Peso Contra `main` en Carpeta Temporal
- Se realizó la compilación de `main` en un clon temporal aislado y se comparó con `feature/experiencia` con la misma metodología:
  - **Antes (`main`)**: JS gzip = 105.85 kB, CSS gzip = 4.54 kB, 127 módulos, 656 ms.
  - **Después (`feature/experiencia`)**: JS gzip = 125.89 kB, CSS gzip = 12.54 kB, 188 módulos, 634 ms.
  - **Diferencia**: +20.04 kB en JS y +8.00 kB en CSS.
  - **Cumplimiento presupuestario**: Holgura JS restante = **24.11 kB** (< 150 kB); Holgura CSS restante = **7.46 kB** (< 20 kB).
  - Evidencia completa archivada en `docs/evidencias/experiencia-peso.txt`.

### 9. Resistencia (API Caída o Lenta)
| Pantalla | Comportamiento con API Lenta | Comportamiento con API Caída | Tipo de Prueba y Archivo de Cobertura |
| :--- | :--- | :--- | :--- |
| **Login** (`/login`) | Botón «Ingresar» muestra spinner «Verificando credenciales…» deshabilitando reenvíos | Muestra `MENSAJES.errorConexion` bajo el formulario, retiene correo y permite reintentar | prueba unitaria con API simulada: `src/pages/LoginPage.test.jsx` (`errorConexion: muestra su mensaje y conserva lo escrito`); script e2e con API real: `tools/e2e/fase5.mjs` |
| **Inicio Administrador** (`/dashboard`) | Esqueletos de portada, contadores y agenda en gris con pulso | Alerta `AvisoDeError` («No se pudo cargar el inicio.») con botón «Reintentar» | prueba unitaria con API simulada: `src/pages/DashboardPage.test.jsx` (`muestra error y botón Reintentar si falla la carga`); script e2e con API real: `tools/e2e/fase9.mjs` |
| **Inicio Solicitante** (`/dashboard`) | Esqueleto de tarjeta «Tu próxima reserva» y métricas | Alerta `AvisoDeError` con botón «Reintentar» sin romper navegación | prueba unitaria con API simulada: `src/pages/DashboardPage.test.jsx` (`error en carga de reservas muestra aviso de error`); script e2e con API real: `tools/e2e/experiencia-b.mjs` |
| **Inicio Responsable** (`/dashboard`) | Esqueleto de agenda de hoy y tarjetas de indicador | Alerta `AvisoDeError` con botón «Reintentar» | prueba unitaria con API simulada: `src/pages/DashboardPage.test.jsx` (`error en carga de ambiente muestra aviso de error`); script e2e con API real: `tools/e2e/experiencia-b.mjs` |
| **Disponibilidad** (`/disponibilidad`) | Carril esqueleto pulsante simulando bloques | Alerta `AlertMessage tipo="error"` con botón secundario «Reintentar» | prueba unitaria con API simulada: `src/pages/DisponibilidadPage.test.jsx` (`muestra error de carga`); script e2e con API real: `tools/e2e/experiencia-c.mjs` |
| **Nueva Reserva** (`/reservas/nueva`) | «Comprobando disponibilidad…» sin bloquear edición de campos | Si disponibilidad falla, permite continuar; si POST falla muestra alerta de error y retiene datos | prueba unitaria con API simulada: `src/pages/formulariosRegistro.test.jsx` (`si la consulta falla no muestra aviso ni impide registrar`); script e2e con API real: `tools/e2e/fase6.mjs` |
| **Detalle de Reserva** (`/reservas/:id`) | Texto accesible «Cargando la reserva…» | Muestra `AlertMessage tipo="error"` con botón «Reintentar» | prueba unitaria con API simulada: `src/pages/DetalleReservaPage.test.jsx` (`mientras carga muestra "Cargando la reserva…"`); script e2e con API real: `tools/e2e/fase6.mjs` |
| **Listado de Reservas** (`/reservas`) | Esqueleto de tabla de reservas | Alerta de error con botón «Reintentar» | prueba unitaria con API simulada: `src/pages/ReservasPage.test.jsx` (`filas vacías y error`); script e2e con API real: `tools/e2e/fase9.mjs` |
| **Ambientes** (`/ambientes`) | Esqueleto de tarjetas / tabla | Alerta de error de servidor con botón «Reintentar» | prueba unitaria con API simulada: `src/pages/listados.test.jsx` (`si falla la lista muestra el error con «Reintentar» y sin resumen`); script e2e con API real: `tools/e2e/fase5.mjs` |
| **Usuarios** (`/usuarios`) | Esqueleto de tabla de usuarios | Alerta de error de servidor con botón «Reintentar» | prueba unitaria con API simulada: `src/pages/listados.test.jsx` (`buscador de usuarios filtra en vivo por nombre, correo y rol`); script e2e con API real: `tools/e2e/fase5.mjs` |

---

## PASO 13. Capturas Finales y Auditoría de Peso

### 1. Directorio `docs/evidencias/experiencia/final/`
Se consolidó el conjunto oficial de capturas finales en resoluciones de escritorio (1280 px) y móvil (375 px):
- `01-login-1280.png` / `01-login-375.png`
- `02-inicio-admin-1280.png` / `02-inicio-admin-375.png`
- `03-inicio-solicitante-1280.png` / `03-inicio-solicitante-375.png`
- `04-inicio-responsable-1280.png` / `04-inicio-responsable-375.png`
- `05-nueva-reserva-1280.png` / `05-nueva-reserva-375.png`
- `06-nueva-reserva-cierre-1280.png` / `06-nueva-reserva-cierre-375.png`
- `07-detalle-reserva-1280.png` / `07-detalle-reserva-375.png`
- `08-detalle-conflicto-1280.png` / `08-detalle-conflicto-375.png`
- `09-reservas-admin-1280.png` / `09-reservas-admin-375.png`
- `10-ambientes-1280.png` / `10-ambientes-375.png`
- `11-ambiente-nuevo-1280.png` / `11-ambiente-nuevo-375.png`
- `12-usuarios-1280.png` / `12-usuarios-375.png`
- `13-usuario-nuevo-1280.png` / `13-usuario-nuevo-375.png`
- `14-403-sin-permiso-1280.png` / `14-403-sin-permiso-375.png`
- `15-404-no-encontrada-1280.png` / `15-404-no-encontrada-375.png`

Total: **30 capturas oficiales verificadas** (15 escritorio + 15 móvil).

---

## PASO 15. Verificación Automatizada de la Tabla Control → Prueba

Se implementó el script de certificación `tools/usabilidad/verificar-tabla-pruebas.mjs` que lee automáticamente la tabla del PASO 11 e inspecciona los archivos de prueba para comprobar que cada nombre de test existe de manera literal en el código fuente.

### Resultado de la Ejecución
- **Comando**: `node tools/usabilidad/verificar-tabla-pruebas.mjs`
- **Integrado en**: `npm --prefix tools/usabilidad run pruebas`
- **Resultado**: **21 comprobados con éxito, 0 fallos**.

---

## PASO 16. Honestidad de Etiquetas y Registro de Defectos #89 a #93

1. **Honestidad en la tabla de resistencia (Paso 12.9)**: Se etiquetaron de forma transparente todas las filas diferenciando estrictamente «prueba unitaria con API simulada: ...» de «script e2e con API real: ...».
2. **Defectos #89 a #93 registrados en `docs/bitacora-evaluacion.md`**:
   - **#89**: Altura táctil del enlace en `.tarjetaConflicto` (`278x19 px` corregido a `min-height: 44px; display: inline-flex; align-items: center;`). Medido: reducido de 1 a 0 elementos < 44 px.
   - **#90**: Ancho táctil inferior a 44 px en botones con texto corto (p. ej. «Página 2» en móvil medía `43x44 px`). Corregido con `min-width: var(--alto-control)`. Medido: 0 elementos < 44 px en 44 estados móviles.
   - **#91**: Desbordamiento horizontal en `SelectorDeAmbientes.jsx` a 188 px (zoom 200 %). Corregido con `.rejilla { grid-template-columns: minmax(0, 1fr) }` y `min-width: 0; overflow-wrap: anywhere;`. Medido: 0 desbordes a 188 px.
   - **#92**: Desbordamiento horizontal en `BarraResumenMovil.jsx` a 188 px por `white-space: nowrap`. Corregido con `overflow-wrap: anywhere`. Medido: 0 desbordes.
   - **#93**: Desbordamiento horizontal de botones en móvil en `/reservas/7` a 188 px por padding de 48 px. Corregido con `max-width: 100%; overflow-wrap: anywhere; word-break: break-word;` y padding reducido en móvil. Medido: 0 de 30 combinaciones con scroll a 188 px.

---

## PASO 17. Inventario de Evidencias y Propuesta de Reducción

Auditoría completa de tamaño de archivos y rastreo de referencias sobre `docs/evidencias` en 249 archivos de `docs/`, `tools/`, `README.md` y `NovaPortal`:

### Tabla Carpeta → ¿Referenciada? → Tamaño (MB)
| Carpeta | ¿Referenciada? | Tamaño (MB) | Detalle de Referencias |
| :--- | :--- | :--- | :--- |
| `docs/evidencias/experiencia/` | **Sí** (14 archivos) | **38.23 MB** | `avance-experiencia.md`, `bitacora-evaluacion.md`, `antes-despues.md`, `accesibilidad.mjs`, scripts `capturar-paso*.mjs`. (Subcarpetas: `final/`: 3.42 MB, `medicion/`: 11.00 MB, capturas intermedias en raíz: 23.81 MB). |
| `docs/evidencias/fase8/` | **Sí** (9 archivos) | **8.19 MB** | `avance-experiencia.md`, `bitacora-evaluacion.md`, `identidad-visual.md`, `accesibilidad.mjs`, `README.md`. |
| `docs/evidencias/fase9/` | **Sí** (9 archivos) | **7.67 MB** | `avance-experiencia.md`, `bitacora-evaluacion.md`, `identidad-visual.md`, `accesibilidad.mjs`, `README.md`. |
| `docs/evidencias/identidad/` | **Sí** (4 archivos) | **6.92 MB** | `identidad-visual.md`, `accesibilidad.mjs`, `README.md`. |
| `docs/evidencias/fase-ai/` | **No** (0 archivos) | **2.62 MB** | Ningún documento ni script de prueba apunta a esta carpeta. |
| `docs/evidencias/fase5/` | **Sí** (3 archivos) | **1.77 MB** | `avance-experiencia.md`, `bitacora-evaluacion.md`, `README.md`. |
| `docs/evidencias/fase6/` | **Sí** (1 archivo) | **1.34 MB** | `avance-experiencia.md`. |
| `docs/evidencias/fase7/` | **Sí** (5 archivos) | **1.17 MB** | `avance-experiencia.md`, `bitacora-evaluacion.md`, `reutilizacion.md`, `README.md`. |
| Archivos de texto sueltos (`.txt`) | **Sí** (1 archivo) | **0.28 MB** | `experiencia-accesibilidad.txt` y `experiencia-peso.txt`. |
| **TOTAL** | - | **68.19 MB** | Supera el umbral de 50 MB debido a fases previas y capturas intermedias. |

### Propuesta de Reducción (Sin Ejecutar — A Decisión del Usuario)
1. **En `docs/evidencias/experiencia/`**: Conservar únicamente las 30 capturas oficiales en `final/` (3.42 MB) y la auditoría de accesibilidad en `medicion/` (11.00 MB). Archivar las capturas intermedias sueltas de pasos anteriores (`01-*`, `N-*`, `A-*`, `B-*`, `C-*`, `D-*`, `I-*`), liberando **23.81 MB**.
2. **En fases previas**: La carpeta `fase-ai/` (2.62 MB) no está referenciada por ningún documento y puede archivarse por completo, liberando **2.62 MB**.
3. **Resultado proyectado**: De 68.19 MB se reduciría a **41.76 MB** (por debajo del límite de 50 MB) con **cero enlaces rotos**.

---

## PASO 18. Plan de Commits Atómicos Verificado por Capas

El plan inicial de commits organizaba las modificaciones por áreas funcionales. A partir de las correcciones del PASO 20, este plan se refinó en una secuencia definitiva de **7 commits atómicos**, separando estrictamente el backend de las capas de interfaz y aislando el arnés de pruebas de la documentación de cierre.

### Reconciliación de la Cifra Inicial (109 vs 196 archivos de código)
- En la formulación inicial se contabilizaron «109 archivos de código/documentación/herramientas». Esta cifra provino de la lectura directa de `git status --porcelain` en modo compacto por defecto, donde las carpetas completas nuevas sin seguimiento previo se colapsan a una sola línea (p. ej. `?? frontend/src/components/AtajosDeDuracion/`, `?? frontend/src/components/Disponibilidad/`, etc.).
- Al expandir exhaustivamente la totalidad de los archivos con `git status -uall --porcelain`, cada archivo interno se lista individualmente. La suma real de archivos modificados y nuevos de código, herramientas y configuración es de **196 archivos**, distribuidos en los commits 1 a 6.

---

## PASO 19. Resumen Ejecutivo Final

### Cifras Finales Medidas
- **Suite de Accesibilidad WCAG 2.2 AA (`accesibilidad.mjs`, 2026-11-06 10:21:29, 235 s)**:
  - Violaciones axe-core: **0 en 87 mediciones** (meta: 0) — MEDIDO.
  - Pares de contraste bajo el umbral: **0 en 140 pares evaluados** (meta: 0) — MEDIDO.
  - Objetivos táctiles menores de 44 px: **0 en 44 estados móviles** (meta: 0) — MEDIDO.
  - Paradas sin foco visible: **0** (anillo normativo `#1E73BE` de 3 px verificado) — MEDIDO.
  - Foco fuera de diálogo modal abierto: **0** (foco atrapado con `useTrampaDeFoco`) — MEDIDO.
  - Desbordamiento horizontal a 188 px (zoom del 200 %): **0 de 30 combinaciones** (meta: 0) — MEDIDO.
  - Animaciones infinitas con `prefers-reduced-motion`: **0** (pulso y transiciones suspendidas) — MEDIDO.
- **Suite Extremo a Extremo (`npm run todo`, 2026-11-06 10:26:33, 288 s)**:
  - Resultado: **Todo correcto** (9 de 9 fases superadas al 100%) — MEDIDO.
- **Pruebas Unitarias Frontend (`vitest`)**:
  - Resultado: **1,263 pruebas pasadas** en 53 archivos (0 fallos) — MEDIDO.
- **Pruebas Backend (.NET 8 con Base de Datos Real)**:
  - Resultado: **230 pruebas ejecutadas y superadas**, **0 omitidas**, **0 fallos** (100% de la suite .NET superada; 0 regresiones en RN-01 a RN-07) — MEDIDO.
- **Verificación de Tabla Control → Prueba (`verificar-tabla-pruebas.mjs`)**:
  - Resultado: **32 comprobaciones automáticas exitosas**, **0 fallos** — MEDIDO.
- **Presupuesto de Rendimiento y Peso (compilación de producción con Vite 8.3.5)**:
  - JavaScript Gzip: **125.97 kB** (Holgura presupuestaria: **24.03 kB** bajo el límite de 150 kB) — MEDIDO.
  - CSS Gzip: **12.67 kB** (Holgura presupuestaria: **7.33 kB** bajo el límite de 20 kB) — MEDIDO.
  - Tiempo de compilación: **628 ms** (188 módulos) — MEDIDO.

### Total de Defectos Corregidos (#77 al #93)
Durante la fase de experiencia se detectaron y resolvieron 17 defectos con prueba automatizada o medición antes/después registrada en `docs/bitacora-evaluacion.md`:
1. **#77**: `SelectorDeAmbientes` no reconocía variantes de Espacio (`' '`, `'Space'`, `e.code === 'Space'`).
2. **#78**: Contraste de borde deshabilitado en tarjetas de ambiente.
3. **#79**: Alerta roja duplicada de choque en `FranjaNuevaReserva`.
4. **#80**: Desalineación en capacidad del Auditorio Principal en mocks (unificado a 200 personas, Pabellón B, piso 1).
5. **#81**: Color literal `rgba` en `PanelReserva` (migrado a token canónico `var(--capa-modal)`).
6. **#82**: Mutación de refs durante el render en `BloquesDisponibilidad` (refactorizado a callbacks estables).
7. **#83**: Aserciones de tiempo relativo en eventos de historial de reserva.
8. **#84**: Aprobación de reservas con choque sin aviso previo (tarjeta de conflicto y bloqueo preventivo).
9. **#85**: Reloj inyectado `ahora` ausente en `InicioSolicitante` e `InicioResponsable`.
10. **#86**: Incompatibilidad de renderizado alternativo en `ListadoPage`.
11. **#87**: Ausencia de texto explicativo y altura táctil en páginas de error 403 y 404.
12. **#88**: Uso de `!important` y degradados fuera del login en portadas por rol (migrado a `var(--color-marino)`).
13. **#89**: Enlace de tarjeta de conflicto menor a 44 px (19 px corregido a 44 px).
14. **#90**: Ancho táctil de botones de paginación menor a 44 px (43 px corregido con `min-width: var(--alto-control)`).
15. **#91**: Desbordamiento horizontal a 188 px en `SelectorDeAmbientes` (rejilla ajustada a `minmax(0, 1fr)`).
16. **#92**: Desbordamiento a 188 px en `BarraResumenMovil` por `white-space: nowrap` (ajustado a `overflow-wrap: anywhere`).
17. **#93**: Desbordamiento horizontal en botones de detalle a 188 px por padding rígido de 48 px.

### Decisiones Propias Documentadas
- **Contrato frente a Stitch**: Se priorizó estrictamente el contrato del repositorio. Se mantuvieron las familias tipográficas Poppins y Montserrat autoalojadas con `@fontsource`, el anillo de foco azul institucional `#1E73BE` de 3 px y los tokens de color canónicos de `tokens.css`.
- **Selector de Ambientes**: Implementación como `role="radiogroup"` con tarjetas seleccionables accesibles (`role="radio"`), indicando capacidad, ubicación y estado en lugar de desplegables planos.
- **Línea de Tiempo Diaria Continua**: Carriles dinámicos que evitan solapamientos visuales de texto entre 07:00 y 22:00, con leyenda en una sola fila y panel modal accesible para detalles.
- **Acción Destructiva Separada**: En el detalle de reserva, el botón «Cancelar reserva» o «Cancelar solicitud» se ubica a la izquierda, separado del bloque de decisión y protegido por diálogo modal accesible.
- **Microcopy Estandarizado**: Verbos de acción en segunda persona («Registrar X» para enviar, «Nuevo X» para abrir, «Volver» para salir sin guardar, «Limpiar formulario» para vaciar). 0 apariciones de botones genéricos «Guardar» o «Aceptar».

### Limitaciones Reales del Entorno
- **Simulación DOM vs Navegador Real**: Las pruebas unitarias de frontend (`vitest`) operan sobre `jsdom`, el cual simula la jerarquía de nodos pero no calcula el diseño geométrico de caja ni el reflujo CSS real. Por ello, las comprobaciones de desbordamiento a 188 px y áreas táctiles de 44 px se certifican mediante `accesibilidad.mjs` sobre instancias reales de Chromium/Edge con Playwright.
- **Concurrencia Pesimista**: La prueba de colisión concurrente 409 se garantiza a nivel de base de datos en `ConcurrenciaAprobacionTests.cs` simulando transacciones paralelas con bloqueo de fila.

### Alcance Excluido (Lo que NO se hizo)
En estricto apego a la Regla 4 (Alcance MVP: RF-01 a RF-08, login por rol y vista diaria de disponibilidad):
- **No se implementó calendario mensual ni semanal**: La disponibilidad se enfoca en la navegación día por día.
- **No se añadieron notificaciones en tiempo real ni envío de correos**: Fuera de la especificación MVP.
- **No se implementaron reservas recurrentes ni periódicas**: Cada reserva opera de forma unitaria según RN-01 a RN-07.
- **No se agregaron herramientas de exportación** (PDF, Excel o CSV).
- **No se implementó selector de tema oscuro** (dark mode).
- **No se incorporó paleta de comandos interactiva** (`Ctrl+K`).
- **No se modificaron reglas de negocio ni textos de `messages.js`**.

---

## PASO 20. Correcciones y Verificación Integral

### 20.a Backend Aparte (Diff Resumido y Trazabilidad a Pantallas)
Ninguna regla de negocio (RN-01 a RN-07) ni mensaje oficial de `messages.js` fue alterado. Los cambios en el backend corresponden estrictamente a la exposición de datos de disponibilidad y portadas de rol requeridos por las nuevas pantallas:

| Archivo Backend | Diff Resumido | Qué Dato Nuevo Expone | Qué Pantalla lo Usa |
| :--- | :--- | :--- | :--- |
| `backend/ReservaUPLA.API/Controllers/PanelesController.cs` | Se abrió autorización general `[Authorize]` para `GET /api/dashboard`. | Dashboard adaptativo con métricas y próximas reservas según el rol del usuario conectado. | `DashboardPage.jsx`, `InicioAdministrador.jsx`, `InicioSolicitante.jsx`, `InicioResponsable.jsx`. |
| `backend/ReservaUPLA.API/Controllers/ReservasController.cs` | Se agregó el endpoint `GET /api/reservas/disponibilidad-dia?fecha={fecha}`. | Colección completa de ambientes con sus bloques horarios (`07:00–22:00`) para la fecha dada. | `DisponibilidadPage.jsx`, `NuevaReservaPage.jsx` (comprobación preventiva de choques) y `DetalleReservaPage.jsx`. |
| `backend/ReservaUPLA.Application/DTOs/ReservaDtos.cs` | Se agregaron los DTOs `BloqueDisponibilidadDto`, `AmbienteDisponibilidadDto` y `DisponibilidadDiaDto`. | Estructura tipada de ocupación por carril horario y estado; anonimización de solicitante ajeno para Solicitante. | `DisponibilidadPage.jsx` y `PanelReserva.jsx`. |
| `backend/ReservaUPLA.Application/Interfaces/IReservaRepository.cs` | Firma `ObtenerPorFechaAsync(DateOnly fecha, ...)`. | Consulta de reservas activas (`Pendiente` y `Aprobada`) para una fecha. | `ConsultaService.cs`. |
| `backend/ReservaUPLA.Application/Interfaces/IServicios.cs` | Firma `ObtenerDisponibilidadDiaAsync` en `IConsultaService`. | Contrato del servicio de disponibilidad diaria. | `ReservasController.cs`. |
| `backend/ReservaUPLA.Application/Services/ConsultaService.cs` | Implementación de `ObtenerDisponibilidadDiaAsync` y soporte de dashboard para Solicitante/Responsable. Conserva `OrdenReservas.PorAntiguedad`. | Mapeo de bloques cronológicos, cálculo de ocupación y privacidad estricta de solicitantes ajenos. | `DisponibilidadPage.jsx`, `InicioSolicitante.jsx`, `InicioResponsable.jsx`. |
| `backend/ReservaUPLA.Infrastructure/Repositories/ReservaRepository.cs` | Implementación EF Core de `ObtenerPorFechaAsync`. | Query optimizado a base de datos PostgreSQL filtrando por fecha y estados activos. | `ConsultaService.cs`. |

### 20.b Pruebas con Base de Datos Viva (.NET 8)
Se ejecutó la suite completa de pruebas de backend configurando las cadenas de conexión reales `RESERVAUPLA_PRUEBAS_BD_ADMIN` (usuario postgres) y `RESERVAUPLA_PRUEBAS_BD_APP` (usuario reservaupla_app):
- **Comando**: `dotnet test backend/ReservaUPLA.sln`
- **Resultados**:
  - `ReservaUPLA.Application.Tests`: **157 pasadas, 0 omitidas, 0 con error**.
  - `ReservaUPLA.Infrastructure.Tests`: **13 pasadas, 0 omitidas, 0 con error** (las 4 pruebas de integración con PostgreSQL real se ejecutaron y pasaron).
  - `ReservaUPLA.API.Tests`: **60 pasadas, 0 omitidas, 0 con error** (las 11 pruebas de controladores con PostgreSQL real se ejecutaron y pasaron).
  - **Total**: **230 pruebas ejecutadas y aprobadas (100%), 0 omitidas**.
- **Prueba de Concurrencia 409 confirmada**:
  - Nombre exacto: `RN01_dos_aprobaciones_simultaneas_que_se_cruzan_dan_un_200_y_un_409_y_una_sola_Aprobada` en `backend/ReservaUPLA.API.Tests/ConcurrenciaAprobacionTests.cs`.
  - Estado: **Ejecutada y superada** (no omitida).

### 20.c Tabla Control → Prueba con Relevancia Real
Se actualizaron y ampliaron las pruebas unitarias y de integración para evaluar el comportamiento real de cada control y estado:
- **Modales accesibles**: foco atrapado comprobado con Tab/Shift+Tab, cierre con Escape, retorno de foco al disparador al cerrar y verbo exacto en botón principal («Sí, aprobar», «Sí, rechazar», «Sí, cancelar reserva»).
- **Formularios con validación al salir**: error inmediato al desenfocar (`onBlur`) antes de enviar; foco automático al primer campo con error al enviar vacío.
- **Esqueletos de carga**: esqueleto visible durante la carga, claramente diferenciado del estado vacío de día sin reservas.
- **Resumen vivo**: comprobación reactiva de que el resumen cambia inmediatamente al alterar ambiente, fecha y horario.
- **Páginas 403 y 404**: mensaje normativo, ilustración temática decorativa con `aria-hidden="true"` y enlace accesible «Volver al inicio» con foco visible.
- **Aprobar con choque**: bloqueo en interfaz ante colisión horaria detectada y captura de código `409 Conflict` del backend.
- **Certificación con script**: `node tools/usabilidad/verificar-tabla-pruebas.mjs` arrojó **32 comprobaciones automáticas exitosas, 0 fallos**.

### 20.d Reconciliación Exhaustiva de Archivos (528 Archivos)
Desglose completo de los 528 archivos registrados en `git status -uall --porcelain`:

| Commit / Agrupación | Mensaje Canónico / Destino | Cantidad | Detalle del Contenido |
| :--- | :--- | :--- | :--- |
| **Commit 1** | `style: asegurar tokens de diseño, radios canónicos y controles accesibles de 44 px` | **38** | `tokens.css`, `global.css`, `encoding.test.js`, `personas.js`, `useTrampaDeFoco.js`, `AvisosContext.jsx`, primitivas `components/ui/`, mensajes y constantes de navegación. |
| **Commit 2** | `feat: exponer en la API los datos de ocupación y agenda para las nuevas pantallas` | **10** | Controladores (`PanelesController.cs`, `ReservasController.cs`), DTOs, interfaces, `ConsultaService.cs`, `ReservaRepository.cs` y tests de backend. |
| **Commit 3** | `feat: implementar selector de ambientes por tarjetas y línea de tiempo diaria` | **30** | Flujo de Nueva reserva y Disponibilidad diaria (`SelectorDeAmbientes`, `AtajosDeDuracion`, `ResumenDeSolicitud`, `BarraResumenMovil`, `DisponibilidadPage`, carriles, panel de reserva). |
| **Commit 4** | `feat: agregar historial vertical, alerta de choque y portadas por rol` | **49** | Detalle de reserva, historial vertical, tarjeta de conflicto, portadas por rol (`InicioSolicitante`, `InicioResponsable`, `InicioAdministrador`, `DashboardPage`), reservas y `PendientesContext`. |
| **Commit 5** | `feat: incorporar alternador de vista, buscador en vivo y páginas 403 y 404` | **40** | Alternador en Ambientes, buscador en vivo en Usuarios, formularios, layout global (`Layout`, `MenuDeUsuario`, `Topbar`), login de 48 px, páginas 403/404 y `App.jsx`. |
| **Commit 6** | `chore: herramientas de pruebas de extremo a extremo y de usabilidad` | **29** | `vite.config.js`, pruebas de estilos/identidad/experiencia, scripts E2E (`tools/e2e/`) y de usabilidad (`tools/usabilidad/`). |
| **Commit 7** | `docs: documentación de la experiencia, evidencias de accesibilidad y capturas finales` | **185** | Documentación Markdown (8 archivos), evidencias de texto (2 archivos), capturas oficiales finales en `final/` (30 PNGs), capturas de accesibilidad en `medicion/` (87 PNGs) y capturas intermedias referenciadas en la documentación (58 PNGs). |
| **Fuera de commit** | Sin commit (permanecen sin seguimiento local) | **147** | Capturas intermedias huérfanas en la raíz de `docs/evidencias/experiencia/` que no están referenciadas por ningún documento (no rompen ningún enlace). |
| **TOTAL** | - | **528** | **38 + 10 + 30 + 49 + 40 + 29 + 185 + 147 = 528 archivos** (100% verificado). |

---

## PASO 21. Verificación del Plan de 7 Commits en Worktree Temporal

Se creó un worktree aislado (`git worktree add -b temp-verify ../ReservaUPLA-worktree HEAD`) para aplicar y verificar de forma secuencial los 7 commits:
1. **Capa 1 (`style: asegurar tokens de diseño...`)**: 38 archivos aplicados. Compilación `npm run build` exitosa (128 módulos, 643 ms).
2. **Capa 2 (`feat: exponer en la API...`)**: 10 archivos aplicados. Compilación `dotnet build` exitosa (0 advertencias, 0 errores en 21.6 s).
3. **Capa 3 (`feat: implementar selector...`)**: 30 archivos aplicados. Compilación `npm run build` exitosa (142 módulos, 690 ms).
4. **Capa 4 (`feat: agregar historial...`)**: 49 archivos aplicados. Compilación `npm run build` exitosa (163 módulos, 497 ms).
5. **Capa 5 (`feat: incorporar alternador...`)**: 40 archivos aplicados. Compilación `npm run build` exitosa (188 módulos, 460 ms).
6. **Capa 6 (`chore: herramientas de pruebas...`)**: 29 archivos aplicados. Suite de pruebas ejecutada correctamente.
7. **Capa 7 (`docs: documentación...`)**: 185 archivos aplicados. Auditoría de enlaces completada sin referencias rotas.
8. **Limpieza**: Se eliminó el enlace a `node_modules`, se removió el worktree temporal con `git worktree remove --force` y se eliminó la rama temporal `temp-verify`.
