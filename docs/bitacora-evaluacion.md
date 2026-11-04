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
