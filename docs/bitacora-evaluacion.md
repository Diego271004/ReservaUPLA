# Bitácora de evaluación

Defectos y fallos encontrados al construir y probar, cómo se corrigieron y qué prueba los cubre.

## Fase 4 — Estructura inicial y base de datos (2026-11-03)

| # | Qué falló | Cómo se corrigió | Prueba o comprobación que lo cubre |
|---|---|---|---|
| 1 | `npm install -D eslint ...` falló con `ERESOLVE`: la última versión de ESLint (10) no es compatible con `eslint-plugin-react`. | Se fijó `eslint@9` y `@eslint/js@9`. | `npm run lint` (`--max-warnings 0`) sin errores. |
| 2 | La plantilla de Vite trajo `oxlint` como linter, no ESLint. | Se desinstaló `oxlint`, se agregó `eslint.config.js` y el script `lint` usa ESLint. | `npm run lint`. |
| 3 | La prueba "abre y cierra el menú en móvil" falló: el botón "Menú" está oculto por CSS (`display: none` fuera de móvil) y `getByRole` no lo encuentra. Es un error de la prueba, no del producto (jsdom no evalúa `@media`). | La prueba localiza el botón con `getByText('Menú', { selector: 'button' })`. | `src/App.test.jsx`, prueba del menú móvil. |
| 4 | Al probar la API con `dotnet run --no-build` después de `dotnet user-secrets init`, la API se cerró con "Falta la cadena de conexión 'ReservaUPLADB'": el binario era anterior al `UserSecretsId`, así que no cargaba los secretos. | Se recompiló con `dotnet build` y se volvió a ejecutar. | `GET /api/salud` devuelve 200 con la base real; con una base inexistente devuelve 503 sin detalles internos. |
| 5 | Los scripts SQL y los archivos del backend no se crearon la primera vez: el comando con heredocs largos falló en la terminal y no escribió nada. | Se detectó al listar la carpeta (estaba vacía) y se crearon los archivos uno por uno. | `ls database/` y `dotnet build` sin errores. |

Defecto de la base de datos: ninguno. Las restricciones RN-01, RN-03 y RN-04 se comprobaron con `database/07_pruebas_reglas.sql`, que falla si la base acepta lo que debe rechazar.

## Fase 5 — Entrada de datos (2026-11-03)

### Defectos del producto (corregidos)
| # | Qué falló | Cómo se corrigió | Prueba o comprobación que lo cubre |
|---|---|---|---|
| 6 | **Textos con tilde mal guardados en la base.** Al probar por la interfaz, "Mario Huamán" apareció como "Mario HuamÃ¡n" (en la base, los bytes `c383 c2a1` en lugar de `c3a1`). Causa: en Windows, psql lee los scripts con la página de códigos de la consola (850) y no con UTF-8, así que cada tilde se convertía dos veces. Venía desde la Fase 4 y no se vio porque `06_verificacion.sql` mostraba el texto con la misma conversión. | Todos los scripts de `database/` empiezan con `\encoding UTF8`. Se recrearon la base y los datos. | `06_verificacion.sql` ahora falla si algún texto contiene "Ã" (doble codificación). Comprobado en la base: la longitud de "Mario Huamán" pasó de 13 a 12 y su hexadecimal es `c3a1`. La prueba de extremo a extremo vuelve a elegir al responsable por su nombre. |
| 7 | `Layout` se rompía (`TypeError: Cannot read properties of null (reading 'rol')`) en el instante en que se cerraba la sesión, antes de que el router redirigiera al login. | `Layout` devuelve `null` si no hay sesión. | `LayoutYDetalle.test.jsx`, prueba "Cerrar sesión borra la sesión y lleva al login" (antes de la corrección mostraba el error). |
| 8 | ESLint (`react-hooks/refs`) rechazó `useFormulario`: actualizaba una referencia durante el render. | La referencia se actualiza en `useLayoutEffect` y, de inmediato, dentro del manejador de cambio. | `npm run lint` con `--max-warnings 0` y las pruebas de formularios que escriben seguido en un campo. |
| 9 | El puerto 5173 de Vite estaba ocupado por otra aplicación del equipo y Vite cambiaba de puerto sin avisar (el origen de CORS dejaba de coincidir). | `vite.config.js`: `port: 5180` y `strictPort: true`; el origen permitido de CORS es `http://localhost:5180`. | `SeguridadTests` (CORS permite solo el origen del frontend) y la prueba de extremo a extremo por el puerto 5180. |

### Defectos hallados al revisar las capturas (cierre de la Fase 5)
Las capturas de `docs/evidencias/fase5/` (1280 px y 375 px) se revisaron a ojo y con mediciones; ninguna pantalla tiene scroll horizontal.

| # | Qué falló | Cómo se corrigió | Prueba o comprobación que lo cubre |
|---|---|---|---|
| 10 | En las tablas de escritorio una palabra se partía a mitad ("Laborato / rio") por `overflow-wrap: anywhere`. | `overflow-wrap: break-word` en las celdas y `overflow-x: auto` en el contenedor como red de seguridad (si un dato fuera larguísimo se desplaza la tabla, no la página). | `tools/e2e/comprobaciones.mjs`, `sinPalabrasPartidas`, ejecutada en Ambientes y Usuarios de escritorio. Es una medición de presentación: jsdom no calcula estilos. |
| 11 | En móvil, la separación entre "Ambiente", "Fecha" y "Hora de inicio" era de 25 px pero antes de "Hora de fin" era de 41 px (el margen del campo se sumaba al `gap` de la rejilla). | `gap: 0 var(--espacio-2)` en la rejilla de horas. | `separacionUniforme` en Nueva reserva a 375 px: huecos de 25, 25 y 25 px. |
| 12 | En móvil el botón "Nuevo ambiente" se apretaba en dos líneas junto al título. | El encabezado del listado puede pasar a otra línea (`flex-wrap`) y el botón no parte su texto. | Captura `06-ambientes-movil.png`. |
| 13 | En el login de escritorio el lema quedaba en medio del panel azul; el diseño lo pone justo debajo de "ReservaUPLA". | Marca y lema van en un mismo bloque, y la universidad aparte, abajo. | `LoginPage.test.jsx`, "el panel agrupa la marca y el lema arriba, como en el diseño". |

### Errores de mis pruebas (no del producto)
Se corrigieron al escribirlas; se anotan por transparencia.
- Comparar el `value` de un `<select>` controlado después del evento (vuelve a "" porque el estado no cambia): se captura el valor dentro del manejador.
- `user-event` no mueve la opción de un `<select>` con las flechas (lo hace el navegador): la prueba de teclado comprueba el foco con Tab y elige con `selectOptions`.
- Un texto buscado con `/@/` encontraba la ayuda del correo, no el mensaje de Soporte TI: se acota al mensaje.
- Dos `render` en la misma prueba dejaban dos aplicaciones en el DOM: se llama a `cleanup()` entre ellos.
- En el guion de extremo a extremo, `getByLabel('Contraseña inicial')` coincidía con el campo y con su botón "Mostrar contraseña inicial": se usa `exact: true`.

## Fase 6 — Validaciones (2026-11-04)

Cómo se trabajó: cada comportamiento nuevo se escribió primero como prueba y se confirmó en rojo antes de implementarlo.

| Paso | Prueba escrita primero | Resultado en rojo | Resultado en verde |
|---|---|---|---|
| Entidad `Reserva` (transiciones y RN-06) | `ReservaTests` | 13 fallaban (`NotImplementedException`) | 13 pasan |
| `ReservaService` (RN-01, mantenimiento, aprobar, rechazar, cancelar, detalle, disponibilidad) | `ReservaServiceTests`, `ReservaCambioDeEstadoTests`, `ReservaConsultaTests` | 52 fallaban y las 73 anteriores seguían pasando | 125 pasan |
| Contraseña inicial (U2), backend | `UsuarioServiceTests.U2_…` | 5 fallaban (las que debían rechazarse) | 134 pasan |
| Endpoints nuevos | `ReservasEndpointsTests` | 22 fallaban | 48 pasan |
| Base de datos | `07_pruebas_reglas.sql` ampliado | falló en «RN-06 una Rechazada no pasa a Aprobada» y luego en «mantenimiento…» | todas las comprobaciones pasan |
| Contraseña inicial (U2), frontend | `validators.test.js` | 5 fallaban | 48 pasan |
| Servicios del frontend (404, 409, rutas nuevas) | `servicios.test.js` | 7 fallaban | 43 pasan |
| Pantallas (disponibilidad, Ver detalle, ayuda de la contraseña, detalle y modales) | `formulariosRegistro.test.jsx` y `DetalleReservaPage.test.jsx` | 8 fallaban y el detalle ni cargaba (módulo inexistente) | 158 pasan |

### Defectos hallados y corregidos
| # | Qué falló | Cómo se halló | Cómo se corrigió | Prueba que lo cubre |
|---|---|---|---|---|
| 14 | **Dos aprobaciones simultáneas de reservas que se cruzan podían terminar en HTTP 500.** Al comprobar la restricción de exclusión, PostgreSQL detectaba un *deadlock* (SQLSTATE 40P01) y abortaba una de las dos; el código solo traducía 23P01. | `ConcurrenciaAprobacionTests` falló en la vuelta 4 con «se esperaba 200 y 409, pero fue 200 y 500». | `ReservaRepository` traduce 23P01 **y** 40P01 (aunque EF lo envuelva en otra excepción) a `ConflictoDeHorarioException`; el servicio responde 409 con el mensaje de conflicto (con la hora si la ganadora ya confirmó, sin ella si no). | `ConcurrenciaAprobacionTests.RN01_dos_aprobaciones_simultaneas_que_se_cruzan_dan_un_200_y_un_409_y_una_sola_Aprobada` (25 vueltas por ejecución; pasó 4 ejecuciones seguidas con la base real) |
| 15 | **La base no hacía cumplir RN-06 ni las transiciones.** Un `UPDATE` directo podía pasar una reserva Rechazada a Aprobada, o una Aprobada a Rechazada. | `07_pruebas_reglas.sql`: «la base aceptó lo que debía rechazar». | Trigger `trg_reservas_validar_transicion` (Rechazada y Cancelada no cambian; solo Pendiente → Aprobada, Rechazada o Cancelada y Aprobada → Cancelada). | «RN-06 una Rechazada no pasa a Aprobada» y las demás comprobaciones de RN-06 y transiciones de `07_pruebas_reglas.sql` |
| 16 | **La base no hacía cumplir RN-05:** cualquiera podía dejar constancia en el historial de haber aprobado o rechazado. | Misma ampliación de `07`. | Trigger `trg_historial_validar_autor` (solo un Administrador registra Aprobada o Rechazada; Cancelada, el dueño o un Administrador). | «RN-05 un Solicitante no registra la aprobación» y «…el rechazo» |
| 17 | La base aceptaba reservas nuevas en un ambiente en mantenimiento. | `07` ampliado. | Trigger `trg_reservas_validar_ambiente` al insertar. | «mantenimiento: la base no acepta una reserva nueva en un ambiente en mantenimiento» |
| 18 | La base aceptaba texto plano en `contrasena_hash`. | `07` ampliado. | `CHECK ck_usuarios_hash_bcrypt` (solo hashes `$2a$`, `$2b$`, `$2x$` o `$2y$`). | «la base no acepta una contraseña en texto plano» |
| 19 | El login no devolvía el id del usuario, y el detalle necesita saber si la solicitante es la dueña de la reserva para mostrarle (o no) "Cancelar solicitud". | Al diseñar `accionesDeReserva`. | `LoginResponseDto` incluye `UsuarioId`; la sesión del frontend lo guarda (una sesión anterior sin id se descarta y hay que iniciar sesión otra vez). | `AuthServiceTests` («Credenciales_correctas_devuelven_token_nombre_y_rol»), `LoginEndpointTests`, `servicios.test.js` («200 sin el id del usuario…») |

Errores de mis pruebas (no del producto): el `vi.mock` de `App.test.jsx` no incluía las funciones nuevas de `recursosService` (Vitest lo avisa al usarlas).

## Fase 7 — Reutilización (2026-11-04)

Medidas completas en `docs/reutilizacion.md` y `docs/evidencias/fase7-duplicacion-{antes,despues}.txt`. Resumen: duplicación de referencia (jscpd, 4 líneas y 30 tokens) de 1,38 % a 0,88 %; perfil muy sensible de 6,17 % a 3,30 %; con el umbral estándar de jscpd era 0 % antes y sigue en 0 %.

### Defectos hallados y corregidos
| # | Defecto | Cómo se encontró | Corrección | Prueba |
|---|---|---|---|---|
| 20 | **El ambiente se cortaba en móvil (hallazgo N2 de la v1):** la opción mostraba nombre, capacidad y ubicación juntos y en 375 px no cabía. | Revisión de usuario sobre las capturas de la Fase 6. | Las opciones muestran solo el nombre; al elegir, capacidad y ubicación aparecen como ayuda bajo el campo («30 personas · Pabellón A, piso 2»). | `formulariosRegistro.test.jsx` («las opciones del ambiente muestran solo el nombre…», «al elegir un ambiente, su capacidad y ubicación aparecen como ayuda…»); captura `docs/evidencias/fase7/02-ambiente-elegido-con-ayuda-movil.png` |
| 21 | **Se podía reservar para una fecha pasada:** ni el frontend, ni la API, ni la base lo impedían (regla que faltaba, ahora RN-07 propuesta). | Revisión de usuario. | Frontend: aviso junto al campo. API: 400 con el mismo texto (`ReglaFechaNoPasada`, «hoy» = fecha de Lima). Base: disparador `trg_reservas_validar_fecha` solo al INSERT. | `validators.test.js`, `formulariosRegistro.test.jsx`, `ReservaServiceTests.RN07_*`, `ReservasEndpointsTests.RN07_*`, `07_pruebas_reglas.sql` (3 comprobaciones) |
| 22 | **Pruebas que caducan:** las pruebas del frontend y de la API tenían fechas fijas (`05/11/2026`) y, con RN-07, empezarían a fallar al pasar esa fecha. | Al diseñar RN-07 (antes de que fallaran). | Frontend: fechas de 2030 en los envíos y reloj inyectado (`ahora`) en el validador. API: la regla RN-07 de la fábrica de pruebas usa el reloj fijo del 03/11/2026. | Todo el conjunto en verde |
| 23 | **Los datos de ejemplo (`05_datos_prueba.sql`) tienen reservas de fechas fijas que ya son pasadas** y el disparador de RN-07 las rechazaría al cargarlas. | Al diseñar el disparador (antes de recrear la base). | El guion apaga `trg_reservas_validar_fecha` solo durante esa inserción y lo vuelve a encender. | `recrear-bd.sh` termina bien; `07` comprueba que el disparador está activo |
| 24 | **El menú del `Layout` escribía dos `<button>` a mano** (abrir el menú en móvil y Cerrar sesión): la prueba de arquitectura solo revisaba `src/pages` y no lo veía. | Al ampliar `arquitectura.test.js` a todo `src` fuera de `components/ui` (la prueba falló solo con `Layout.jsx`). | Variantes `sobreOscuro` y `sobreOscuroLista` del componente `Button`; `Layout` las usa. Revisado a 1280 y 375 px, menú cerrado y abierto. | `arquitectura.test.js` («components/Layout/Layout.jsx no usa …»), `acciones.test.jsx` («la variante %s (menú lateral)…»); `tools/e2e/layout-menu.mjs` |
| 25 | **Los guiones e2e de las fases 5 y 6 ya no servían:** buscaban el ambiente con la etiqueta antigua, usaban fechas fijas (`18/11/2026`, `05/11/2026`, `03/11/2026`) que RN-07 rechaza cuando quedan en el pasado y `fase6` dependía de las reservas del seed 05, también con fechas fijas. | Al preparar el cierre de la Fase 7. | Fechas relativas a hoy (`fechaRelativa` en `lib.mjs`); la etiqueta nueva; `fase6` crea sus propios datos de partida por la API; nuevo `tools/e2e/todo.mjs` que recrea la base, reinicia la API y ejecuta las fases 5, 6 y 7 en orden, cada una sobre datos limpios (el reinicio también reinicia el límite de 5 intentos de login). | `docs/evidencias/e2e-completo.txt` (las tres fases correctas) |

Errores de mis pruebas (no del producto):
- Primer intento de que las pruebas de la API no caducaran: cambié sus fechas a 2030. Dos pruebas de RN-01 fallaron porque dependían de la fecha por defecto de los datos falsos (`2026-11-05`). Lo revertí.
- Segundo intento: sustituir el `TimeProvider` de toda la API por el reloj fijo. Fallaron 34 pruebas porque los tokens JWT se vencían contra la hora real. Quedó el reloj fijo solo en la regla RN-07.
- Varios comandos de terminal con comillas o `>` crearon archivos vacíos con nombres raros dentro del repositorio; se borraron todos (estaban vacíos) y no entran en el trabajo.

## Fase 8 — Evaluación de usabilidad del sistema construido (2026-11-04)

Evaluación heurística y mediciones sobre el sistema real: `docs/usabilidad/evaluacion-sistema.md` (24 hallazgos), `docs/evidencias/fase8-accesibilidad-antes.txt` y `fase8-accesibilidad.txt` (antes y después), capturas en `docs/evidencias/fase8/antes/` y `despues/`. Cada corrección nació de una prueba en rojo (`frontend/src/styles/accesibilidad.test.js` lee los .css porque Vitest corre con `css: false`; el navegador real lo confirma la medición).

### Defectos hallados y corregidos
| # | Defecto | Cómo se encontró | Corrección | Prueba |
|---|---|---|---|---|
| 26 | **El límite de los campos casi no se veía:** borde `#D1D5DB` a 1,47:1 de la tarjeta blanca (WCAG 1.4.11 pide 3:1). Hallazgo H04. | Medición de contraste de los tokens. | Token `--color-borde-control` (3,9:1) en campos y botón secundario. | `accesibilidad.test.js` («el límite de los campos…», «los campos y el botón secundario…») |
| 27 | **El spinner seguía girando con `prefers-reduced-motion`:** la regla acortaba la duración a 0,01 ms pero la animación es infinita (medición F: 1 animación infinita activa). H09. | Medición de animaciones con la preferencia activada. | `animation: none` y `transition: none` con la preferencia activada. | `accesibilidad.test.js` («apaga las animaciones…») y medición F (0 animaciones) |
| 28 | **Scroll horizontal en el login a 320 px** (346 px en 320; WCAG 1.4.10). H05. | Medición de zoom y reflujo. | `grid-template-columns: minmax(0, 1fr)` en móvil. | `accesibilidad.test.js` («la columna del login…») y medición E (0 desbordes a 320 px) |
| 29 | **20 objetivos táctiles de menos de 44 px** a 375 px: campos de 42 px, «Mostrar» de 36 px, interruptor de 24 px, «Volver al inicio» de 19 px. H10. | Medición de objetivos táctiles. | El control llena la caja de 44 px; mínimos de 44 px en «Mostrar», en el interruptor (área táctil) y en el enlace. | `accesibilidad.test.js` («objetivos táctiles de 44 px») y medición C (0 elementos) |
| 30 | **Los modales de rechazar y cancelar no avisaban que no se puede deshacer** (RN-06). H03. | Evaluación heurística (N5, S6). | Propiedad `advertencia` en `ModalConfirmacion`: «Esta acción no se puede deshacer.» solo en rechazar y cancelar. | `acciones.test.jsx` (2 pruebas), `DetalleReservaPage.test.jsx` («el modal de … avisa que no se puede deshacer», «el modal de "Aprobar" no dice…») |
| 31 | **«Volver al inicio» conservaba el estilo del navegador** y medía 19 px. H11. | Captura de «Sin permiso». | Clase `volver` con el estilo de enlace del sistema y 44 px. | `ErrorRutaPage.test.jsx`, `accesibilidad.test.js` |
| 32 | **El aviso de disponibilidad salía al final del formulario**, debajo de Motivo. H08. | Captura a 375 px del conflicto. | Se coloca justo debajo de las horas. | `formulariosRegistro.test.jsx` («el aviso de disponibilidad aparece junto a las horas…») |
| 33 | **Cierre de la reserva: botones pegados**, uno partido en dos líneas a 375 px y «Nueva reserva» ambiguo. H07. | Captura del cierre. | Separación, apilado con el primario arriba en móvil y texto «Registrar otra reserva». | `accesibilidad.test.js` («los botones no quedan pegados»), `formulariosRegistro.test.jsx` («…"Registrar otra reserva"…») |
| 34 | **El icono de calendario sugería un selector inexistente** y no había pista del formato. H12. | Evaluación heurística (NS). | Ayuda «Formato dd/mm/aaaa (por ejemplo, 05/11/2026).» | `formulariosRegistro.test.jsx` («la fecha dice en qué formato se escribe…») |
| 35 | **Los registros de los listados en móvil se separaban con una línea de 1 px.** H13. | Captura de Usuarios a 375 px. | Banda de 8 px entre registros. | `accesibilidad.test.js` («cada registro se separa…») |
| 36 | **La ayuda y el error de la contraseña repetían la misma frase.** H17. | Captura del formulario de usuario. | Con error se oculta la ayuda. | `formulariosRegistro.test.jsx` («U2: cuando la contraseña tiene error no se repite la ayuda…») |
| 37 | **«Se construye en una fase posterior»** usaba vocabulario del proyecto. H06. | Evaluación heurística (N2). | «Todavía no está disponible. Estará lista en una próxima versión.» | `App.test.jsx` |
| 38 | **El anillo de foco `#3696EA` no llegaba a 3:1 sobre el fondo gris** (2,84:1; WCAG 1.4.11). H18. | Medición de contraste. | Decisión del planificador: el anillo pasa a `#1E73BE` (4,94:1 sobre blanco, 4,49:1 sobre gris); sobre el menú marino, blanco (12,07:1), porque `#1E73BE` da ahí 2,44:1. El celeste queda solo decorativo (`--color-celeste`). **La accesibilidad prevalece sobre ese detalle del diseño de Stitch**; documentado en `docs/diseno/DESIGN.md`. | `accesibilidad.test.js` (3 pruebas del foco); `docs/evidencias/fase8-contraste-foco.txt` |

Errores de mis herramientas (no del producto):
- Mi primer detector de «foco visible» miraba solo el control, pero el anillo lo dibuja el contenedor (`:focus-within`): informó 85 paradas «sin foco» que eran falsas. Se corrigió para mirar tres niveles y la medición «antes» se repitió.
- El análisis de contraste marcó como fallo el texto blanco del menú medido contra blanco; se corrigió para medirlo contra el menú marino.
- Escribir archivos de prueba por la terminal volvió a corromper barras invertidas en un archivo de pruebas; se reescribió con la herramienta de escritura.
- La comprobación e2e «separación uniforme entre campos» (fase 5) falló al añadir la ayuda del formato bajo la Fecha (24, 62, 24 px) porque medía desde la caja del control y no desde el final del campo con su ayuda. No era un defecto del producto (los campos siguen a 24 px); se corrigió la medición y `tools/e2e/todo.mjs` volvió a pasar las tres fases.
- `dotnet format --verify-no-changes` salió con código 2 una vez (4 avisos de espacios en `ReservaService.cs` y `AuthController.cs`) tras el merge; al ejecutar `dotnet format` volvió a salir 0 y `git diff` no muestra cambios en el backend (solo cambió el fin de línea del árbol de trabajo, ya que `.gitattributes` fija `eol=lf`). Queda anotado sin causa confirmada.

## Observaciones de la Fase 8 sin corregir
- **H01 (severidad 4):** no existe la lista de Reservas (alcance de la Fase 9).
- **H16:** la ayuda de Soporte TI se mantiene genérica, **sin datos de contacto**, por decisión del planificador (no se inventa ninguno); queda como limitación.
- **H14 (severidad 1):** el mensaje de conflicto al aprobar sigue dirigido a la Solicitante; el planificador decidió no cambiarlo.
- **H19:** texto de controles deshabilitados a 4,16:1: **exento por WCAG 1.4.3** (decisión del planificador); las mediciones lo marcan EXENTO y no lo cuentan como fallo.
- A 188 px de ancho (un teléfono con zoom del 200 %) quedan desbordes pequeños; a 320 px, que es lo que exige WCAG, no hay ninguno.

### Finales de línea
`dotnet format --verify-no-changes` salía con código 2 de forma intermitente: `.gitattributes` deja los `.cs` en LF pero, sin `.editorconfig`, el formateador esperaba CRLF en Windows. Se fijó `end_of_line = lf` en un `.editorconfig` en la raíz (y `*.cs`, `*.csproj` y `.editorconfig` como `eol=lf` en `.gitattributes`). Comprobado: tres ejecuciones seguidas de `dotnet format --verify-no-changes` salen con código 0.

## Fase 9 — Salida de datos: Reservas, Dashboard y Mi ambiente (2026-11-04)

Backend: `GET /api/reservas` (filtros, orden por fecha, páginas de 10 con total), `GET /api/dashboard` y `GET /api/mi-ambiente`. Frontend: tres pantallas y los componentes `Paginacion`, `FiltrosDeReservas` y `AvisoDeError`; `CardIndicador` se usa por fin. Cierra H01 y H02.

### Defectos hallados y corregidos
| # | Defecto | Cómo se encontró | Corrección | Prueba |
|---|---|---|---|---|
| 39 | **Un bucle infinito en `useCarga`** (mi cambio): el valor inicial por omisión era un `[]` nuevo en cada render y la carga se repetía sin fin; las pruebas se colgaban. | La batería de Vitest no terminaba. | Constante `LISTA_VACIA` fuera del hook. | Toda la batería (667 pruebas) |
| 40 | **El nombre del «Ambiente más utilizado» se salía de su tarjeta** en el Dashboard (letra de número, 32 px). H25, severidad 3. | Captura real del Dashboard. | `valorTexto`: 20 px y las palabras largas parten línea. | `acciones.test.jsx`, `accesibilidad.test.js` |
| 41 | **Los tres botones de cada fila del Dashboard se partían en dos filas.** H26. | La misma captura. | `flex-wrap: nowrap` en escritorio; apilados con 44 px en móvil. | `accesibilidad.test.js` |
| 42 | El pie «Mostrando N de N» sin margen inferior. H27. | Captura de Reservas a 375 px. | Margen por todos lados. | `accesibilidad.test.js` |

Pruebas de coherencia con la base real (`ListadoYPanelesConBaseRealTests`, 9 pruebas): total, pendientes, aprobadas, rechazadas, **empate** de «ambiente más utilizado», las 5 pendientes más antiguas y los indicadores de Mi ambiente se comparan con consultas SQL directas; cada rol y cada filtro, el orden y la paginación también. **Todas coincidieron.** Se comprobó que las pruebas detectan errores rompiendo a propósito el alcance del Responsable y el desempate: fallaron 2.

Errores de mis guiones (no del producto): `fase9.mjs` creaba pendientes de relleno antes del flujo y la solicitud nueva quedaba fuera de las 5 más antiguas; un selector ambiguo («2 reservas aprobadas» coincidía con «Reservas aprobadas»); un patrón mal escapado en una plantilla; y no contaba con que Mario, responsable de tres ambientes, ve primero el Auditorio en Mi ambiente (H29). Además, varios comandos con heredocs largos fallaron en la terminal y dejaron archivos vacíos con nombres raros que se borraron.

### Ajustes posteriores a la revisión de la Fase 9 (hallazgos H28, H30 y H31)
| # | Defecto | Corrección | Prueba y captura |
|---|---|---|---|
| 43 | **H30:** el total de reservas incluye las Canceladas y no suma con las otras tarjetas. | La tarjeta «Total de reservas» muestra «Incluye canceladas» (Dashboard y Mi ambiente). | `DashboardPage.test.jsx`, `MiAmbientePage.test.jsx`, `indicadores.test.js` (en rojo antes de implementar); captura `fase9/estados/60-dashboard-escritorio` |
| 44 | **H28:** en 375 px los filtros ocupaban toda la pantalla antes de la primera fila. | Botón «Filtros» (`Button` compartido, `aria-expanded`, `aria-controls`, con el número de filtros aplicados) que pliega los filtros solo en móvil; en escritorio siguen visibles. | 8 pruebas nuevas en `ReservasPage.test.jsx` (por estado y de teclado), `accesibilidad.test.js`; captura `fase9/estados/63-reservas-administrador-movil` |
| 45 | **H31:** «Ver detalle» partía su texto en dos líneas en el Dashboard. | `white-space: nowrap` en los botones de la fila. | `accesibilidad.test.js`; captura `fase9/estados/60-dashboard-escritorio` |

Los tres cerraron **solo después de mirar la imagen nueva**. Los guiones e2e (`fase9.mjs` y `estados.mjs`) se adaptaron al botón «Filtros» (`abrirFiltros` en `lib.mjs`) y a que la tarjeta del total ahora lleva más texto.

**Excepción de método (TDD en el backend de la Fase 9).** Las pruebas del backend de esta fase (`ConsultaServiceTests` y `ListadoYPanelesConBaseRealTests`) se escribieron **antes** que el código, pero **no se observó su corrida en rojo** antes de implementar. Compensación: se rompió a propósito el alcance del Responsable y el desempate de «ambiente más utilizado» y fallaron 2 pruebas. **Desde aquí, también en el backend, se confirma el rojo antes de implementar.**

### Decisiones de la Fase 9 (tomadas al construirla)
| Tema | Decisión | Por qué |
|---|---|---|
| Orden y páginas | Reservas ordenadas por fecha y hora (ascendente), 10 por página, con `total`; el Dashboard ordena las pendientes por antigüedad de la solicitud (fecha de creación). | «Pendientes más antiguas» es la solicitud más vieja, no la fecha de la reserva. |
| Filtros y página | Viven en la dirección (`?estado=Pendiente&pagina=2`); «Volver a Reservas» del detalle regresa a la misma lista. | Atrás/adelante y enlaces compartibles; cumple lo pedido sin estado oculto. |
| Total de reservas | Cuenta todas, incluidas las Canceladas. | Es lo que dice «total»; queda como H30 para revisar con usuarios. |
| Mi ambiente con varios ambientes | El Responsable puede estar a cargo de varios (así está la semilla): la pantalla abre el primero por nombre y ofrece una lista; pedir uno ajeno da 404. Los cuatro indicadores son la extensión del diseño 08 que decidió el planificador. | El modelo permite varios; no se podía suponer uno. Marcado como H29. |
| Mensajes nuevos | `EstadoFiltroInvalido`, `RangoDeFechasInvalido` y `PaginaInvalida` en `MensajesValidacion` y `messages.js` (la prueba de paridad los vigila). | Mismos textos en los dos lados. |
| Pantalla inicial | El Administrador aterriza en el Dashboard. | Pedido de la fase. |

## Fase 8 (ampliación) — Arquitectura de información (2026-11-04)

Documento nuevo `docs/usabilidad/arquitectura-de-informacion.md`, con una tabla única de rutas (`constants/rutas.js`) de la que salen el router, la prueba de estructura (`rutas.test.jsx`) y el mapa del sitio (`tools/usabilidad/mapa-del-sitio.mjs`). Al auditar etiquetas, navegación y rutas contra el código aparecieron estos defectos; todos con rojo observado antes de implementar.

### Defectos hallados y corregidos
| # | Defecto | Cómo se encontró | Corrección | Prueba |
|---|---|---|---|---|
| 46 | «Volver a Reservas» llevaba al Dashboard cuando se abría el detalle desde allí; el texto estaba fijo y fuera de `messages.js`. | Lectura de `DetalleReserva` frente a `volverA` del Dashboard. | `textoDeRegreso(ruta)`: «Volver al Dashboard» o «Volver a Reservas»; textos en `TEXTOS`. | `LayoutYDetalle.test.jsx`, `utils/reservas.test.js` |
| 47 | La Solicitante veía «Cancelar solicitud» sobre una reserva **Aprobada**, mientras el modal decía «¿Cancelar esta reserva?». | Comparación de botón, título y confirmación del mismo flujo. | «Solicitud» solo mientras está Pendiente; en los demás casos «Cancelar reserva». `tools/e2e/fase6.mjs` ajustado (la acción deshabilitada tras cancelar). | `utils/reservas.test.js`, `DetalleReservaPage.test.jsx` |
| 48 | El cierre de Nueva reserva ofrecía «Registrar otra **reserva**» tras «Registrar solicitud». | Comparación de los dos botones de la misma pantalla. | «Registrar otra solicitud». | `formulariosRegistro.test.jsx` |
| 49 | El título de la pestaña era «ReservaUPLA» en todas las pantallas. | `index.html` y ausencia de `document.title`. | `tituloDelDocumento` y `useTituloDelDocumento`: «Pantalla · ReservaUPLA» (también «Sin permiso» y la página no encontrada). | `utils/tituloDelDocumento.test.js`, `App.test.jsx` |
| 50 | La Responsable abría `/reservas` escribiendo la dirección sin que estuviera en su menú y sin «Sin permiso». | La prueba nueva de estructura (`rutas.test.jsx`) falló en rojo. | La ruta queda para Administrador y Solicitante. | `rutas.test.jsx` |
| 51 | `contexto-de-uso.md` 3.1 describía un mapa obsoleto (el Administrador aterrizaba en Ambientes; la Responsable abría el detalle desde Mi ambiente). | Comparación con `RUTA_INICIAL_POR_ROL` y con `MiAmbientePage`. | Sustituido por un enlace al documento nuevo; el mapa se genera del código. | `mapa-del-sitio.mjs --verificar`, `pruebas/mapa.test.mjs` |

Excepción de método: `pruebas/mapa.test.mjs` se escribió **después** del script (no se observó el rojo). Compensación: se rompió a propósito el trazo del login en el diagrama y la prueba falló (1 de 12) antes de restaurarlo.

### Ajustes aprobados tras la revisión (mismas pruebas rojo→verde)
| # | Defecto | Cómo se encontró | Corrección | Prueba |
|---|---|---|---|---|
| 52 | **O1.** «Cancelar» significaba tres cosas (salir del formulario, vaciar Nueva reserva y anular una reserva). | Revisión de etiquetas. | Ambientes y Usuarios: «Volver»; Nueva reserva: «Limpiar formulario»; «Cancelar reserva/solicitud» solo anulan. El «Cancelar» del login (detiene una espera) queda como excepción. | `formulariosRegistro.test.jsx`, `etiquetasDeAcciones.test.jsx`, `tools/e2e/fase-ai.mjs` |
| 53 | **O4.** El botón de enviar el alta decía «Guardar ambiente/usuario»: no cumplía «Registrar X lo envía» ni coincidía con «Ambiente registrado.». | Al comprobar la regla pantalla por pantalla. | «Registrar ambiente» y «Registrar usuario». `fase5.mjs` y `estados.mjs` ajustados. | `formulariosRegistro.test.jsx`, `etiquetasDeAcciones.test.jsx` |
| 54 | **O5.** «Ver todas» no decía qué. | Revisión de etiquetas. | «Ver todas las pendientes». `fase9.mjs` ajustado. | `DashboardPage.test.jsx` |
| 55 | **O2.** La Responsable abría el detalle solo por dirección. | Nueva regla de `rutas.test.jsx` (cada rol que entra a una ruta contextual debe llegar por un enlace). | «Ver detalle» por fila en Mi ambiente; detalle de solo lectura; «Volver a Mi ambiente» conserva ambiente y página (`utils/rutaDeRegreso.js`). `fase9.mjs`: Mi ambiente ya no tiene «ningún botón» sino «solo Ver detalle». | `MiAmbientePage.test.jsx`, `DetalleReservaPage.test.jsx`, `rutas.test.jsx`, `utils/rutaDeRegreso.test.js` |
| 56 | **O3.** En el detalle ningún ítem del menú quedaba marcado. | Captura del detalle. | El menú marca la sección de origen con `aria-current="true"`; sin migas de pan. | `LayoutYDetalle.test.jsx`, `utils/rutaDeRegreso.test.js` |

### Limitación conocida
- **O6** «Mi ambiente» en singular aunque la Responsable pueda tener varios ambientes (hay un selector dentro). Se reconsidera con los resultados del test de árbol.

### Verificación de los diagramas
`npm run mermaid` (en `tools/usabilidad`) renderiza a SVG todos los bloques Mermaid de `docs/` y del README: 5 de 5 se renderizaron; una prueba negativa con un bloque roto confirmó que el validador falla cuando debe. `pruebas/mermaid.test.mjs` cubre la extracción de bloques.

### Evidencias y accesibilidad de la ampliación
Capturas nuevas en `docs/evidencias/fase-ai/` (1280 px y 375 px, `npm run faseai`) e informe `docs/evidencias/fase-ai-accesibilidad.txt`: 0 violaciones axe en 20 mediciones, 0 pares de contraste bajo el umbral, 0 objetivos menores de 44 px, 0 problemas de foco; los 4 desbordes a 188 px son los mismos ya conocidos (login, Nueva reserva, Registrar usuario y Mi ambiente).

Excepción de método: `pruebas/mapa.test.mjs` y `pruebas/mermaid.test.mjs` se escribieron después de sus scripts; compensación: rotura deliberada del diagrama (1 de 12 falló) y de un bloque Mermaid (el validador lo reportó).

## Pase de identidad visual (2026-11-04)

Solo estilos, imágenes y la maquetación del login (`docs/diseno/identidad-visual.md`). Rama `feature/identidad`.

### Defectos hallados y corregidos
| # | Defecto | Cómo se encontró | Corrección | Prueba |
|---|---|---|---|---|
| 57 | **El encabezado del menú (logo + nombre + botón «Menú») desbordaba a 188 px** (zoom del 200 % en un teléfono): 10 de 30 combinaciones con scroll horizontal frente a 4 antes del pase. Lo introduje al añadir el logo. | `accesibilidad.mjs` con `ETAPA=identidad`, sección E. | `.identidad` con `flex-wrap: wrap` y `min-width: 0`: el nombre pasa debajo del logo. Volvió a 4 de 30 (los mismos de siempre). | `identidad.test.js` «reflujo: el logo y el nombre del menú caben a 188 px» (rojo observado antes) |
| 58 | **La primera medición del contraste sobre la foto daba 1,00:1** en ventanas de 1366x768 y 1024x600. Error de la herramienta (no del producto): la «zona de la foto» incluía el recuadro blanco del logo. | Informe `identidad-accesibilidad.txt`, sección G. | `contraste-foto.mjs` oculta el recuadro del logo antes de medir. Peor caso real: 6,29:1. | `pruebas/contraste-foto.test.mjs` (la caja solo mira dentro de la región pedida) |
| 59 | **Una prueba suponía una razón de contraste que yo había inventado** (11,3:1 para el blanco sobre el marino; el valor correcto, calculado a mano, es 12,07:1). Error mío al escribir la prueba de la herramienta. | La prueba falló al correrla. | Se corrigió el valor esperado, con el cálculo a mano en la prueba. | `pruebas/contraste-foto.test.mjs` |

### Pruebas ajustadas (legítimo)
- `LoginPage.test.jsx` «no tiene logotipo, notificaciones ni enlaces…» comprobaba que **no hubiera ninguna imagen**. Se entregó el logo de la universidad a propósito, así que ahora comprueba que el panel tiene **una sola** imagen, con el texto alternativo «Universidad Peruana Los Andes». La regla anterior («sin logo oficial de la UPLA») queda sustituida por esa entrega. Se añadió la prueba equivalente para el menú.
- Ninguna otra prueba dependía de clases o estilos.

### Notas
- Se quitaron del `index.html` los enlaces a Google Fonts: las fuentes se alojan con `@fontsource`.
- Excepción de método: `contraste-foto.mjs`, `peso-login.mjs` y `optimizar-imagenes.mjs` se probaron midiendo (no tienen pruebas automáticas propias salvo las funciones de píxeles de `contraste-foto.mjs`).
- Las mediciones «antes» son las últimas completas de la Fase 9 (`fase9-accesibilidad.txt`) y las del peso del login (`identidad-peso-login.txt`, compilando `main`).

## Decisiones y diferencias con el diseño
| Tema | Diseño v2 | Lo construido | Por qué |
|---|---|---|---|
| Listas de Ambiente, Tipo, Rol y de horas (TimeInput) | `09-componentes.png` muestra un desplegable propio (caja con sombra y opciones en columna). | Elementos `<select>` nativos, con la flecha o el reloj del diseño como icono. | Un `<select>` nativo ya es una lista cerrada: no admite una hora o una opción fuera de la lista (N1, RN-03 y RN-04), funciona con teclado y lector de pantalla sin código extra, en móvil abre el selector del sistema y se prueba con `selectOptions`. Un desplegable propio exige reimplementar foco, flechas, Escape y roles ARIA, con más riesgo de errores de accesibilidad. Diferencia visible: la lista abierta la dibuja el navegador, no con el estilo de la hoja 09. |
| Fecha | Campo con icono de calendario. | Campo de texto dd/mm/aaaa con máscara e icono decorativo; no abre un calendario. | El formato dd/mm/aaaa del diseño no se puede forzar con `<input type="date">` (depende del idioma del navegador). |
| Listados | Columna "Acciones" con "Editar". | Sin esa columna. | Editar no está en el alcance de las Fases 5 y 6. |
| Pantalla inicial | Dashboard para el Administrador. | Administrador: Ambientes; Solicitante: Nueva reserva; Responsable: Mi ambiente (en construcción). | Dashboard y Reservas llegan en fases posteriores; cada rol aterriza en una pantalla que existe. |
| Insignia de Activo / Inactivo | Punto, como en `07-usuarios.png`. | Punto (igual que el diseño). | Ya estaba anotado como diferencia con el resto de insignias en `docs/diseno/pendientes.md`. |

### Decisiones de la Fase 6
| Tema | Decisión | Por qué |
|---|---|---|
| Mensajes del dominio | Los de RN-06 y las transiciones viven en `MensajesDominio` (Domain) y `MensajesValidacion` los reexpone; la prueba de paridad del frontend resuelve esos alias. | La entidad lanza `DomainException` con el mensaje exacto y Domain no puede depender de Application, pero la lista de mensajes sigue teniendo una sola fuente. |
| Códigos HTTP | 400 errores por campo; 401 sin sesión; 403 rol sin permiso (RN-05, y cancelar una reserva ajena); 404 reserva inexistente **o que quien consulta no puede ver**; 409 con `{ "mensaje": … }` para RN-01 y RN-06. | No se revela que existe una reserva ajena; el 409 lleva el texto que la pantalla muestra tal cual. |
| Disponibilidad | `GET /api/reservas/disponibilidad` responde 200 con `{ disponible, mensaje }` también cuando está ocupado o en mantenimiento (no es un error); 400 si faltan o son inválidos los datos. | Es un aviso para la pantalla, no una operación que falla. Solo Administrador y Solicitante (quienes reservan). |
| Aviso en el frontend | Consulta con una espera de 300 ms cuando están el ambiente, la fecha y las dos horas, y válidos. Si la consulta falla no muestra nada y registrar sigue permitido. | No preguntar en cada tecla; el servidor decide al registrar. |
| Acciones del detalle | Administrador: Pendiente → Cancelar reserva, Rechazar y Aprobar; Aprobada → solo Cancelar reserva; Rechazada o Cancelada → las tres deshabilitadas con el aviso. Solicitante dueña: "Cancelar solicitud". Responsable: ninguna. | Reglas RN-05 y RN-06 en la interfaz; el backend sigue decidiendo. |
| Esquema de la base | Tres triggers y un `CHECK` nuevos (hallazgos 15 a 18). | Cada uno nació de una prueba de `07_pruebas_reglas.sql` que mostró el hueco, como pedía el paso 4. |
| Reservas sin lista | El detalle (`/reservas/:id`) se abre desde "Ver detalle" al registrar y por la dirección; la lista de Reservas sigue en construcción. | La lista no estaba en el alcance de esta fase. |
| Pruebas con la base real | Se omiten (y lo dicen) si faltan `RESERVAUPLA_PRUEBAS_BD_ADMIN` y `RESERVAUPLA_PRUEBAS_BD_APP`. | Que `dotnet test` siga funcionando en un equipo sin PostgreSQL; la matriz indica cuáles son. |

## Observaciones sin corregir
- `CardIndicador` sigue sin usarse en ninguna pantalla (la usará el dashboard).
- `npm audit` informa 7 vulnerabilidades moderadas, todas en dependencias de desarrollo (cadena `eslint` / `minimatch`). No llegan al paquete que se compila. Se revisan al cierre del proyecto.
