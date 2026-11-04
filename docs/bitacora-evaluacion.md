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

## Decisiones y diferencias con el diseño
| Tema | Diseño v2 | Lo construido | Por qué |
|---|---|---|---|
| Listas de Ambiente, Tipo, Rol y de horas (TimeInput) | `09-componentes.png` muestra un desplegable propio (caja con sombra y opciones en columna). | Elementos `<select>` nativos, con la flecha o el reloj del diseño como icono. | Un `<select>` nativo ya es una lista cerrada: no admite una hora o una opción fuera de la lista (N1, RN-03 y RN-04), funciona con teclado y lector de pantalla sin código extra, en móvil abre el selector del sistema y se prueba con `selectOptions`. Un desplegable propio exige reimplementar foco, flechas, Escape y roles ARIA, con más riesgo de errores de accesibilidad. Diferencia visible: la lista abierta la dibuja el navegador, no con el estilo de la hoja 09. |
| Fecha | Campo con icono de calendario. | Campo de texto dd/mm/aaaa con máscara e icono decorativo; no abre un calendario. | El formato dd/mm/aaaa del diseño no se puede forzar con `<input type="date">` (depende del idioma del navegador). |
| Listados | Columna "Acciones" con "Editar". | Sin esa columna. | Editar no está en el alcance de las Fases 5 y 6. |
| Pantalla inicial | Dashboard para el Administrador. | Administrador: Ambientes; Solicitante: Nueva reserva; Responsable: Mi ambiente (en construcción). | Dashboard y Reservas llegan en fases posteriores; cada rol aterriza en una pantalla que existe. |
| Insignia de Activo / Inactivo | Punto, como en `07-usuarios.png`. | Punto (igual que el diseño). | Ya estaba anotado como diferencia con el resto de insignias en `docs/diseno/pendientes.md`. |

## Observaciones sin corregir
- `npm audit` informa 7 vulnerabilidades moderadas, todas en dependencias de desarrollo (cadena `eslint` / `minimatch`). No llegan al paquete que se compila. Se revisan al cierre del proyecto.
