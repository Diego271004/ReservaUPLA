# Identidad visual de ReservaUPLA (pase de identidad)

Qué cambió en el aspecto del sistema para que se vea sobrio, institucional y reconocible como de la Universidad Peruana Los Andes (UPLA), y por qué. **Solo estilos, imágenes y la maquetación del login:** no cambiaron textos, rutas, lógica ni comportamientos (las 758 pruebas anteriores siguen en verde; ver «Pruebas»). Todo parte de `frontend/src/styles/tokens.css` y de los CSS Modules; ningún color, tamaño ni radio queda suelto (lo comprueba `frontend/src/styles/identidad.test.js`).

## Índice
1. [Decisiones y justificación](#1-decisiones-y-justificación)
2. [Antes y después](#2-antes-y-después)
3. [Mediciones de accesibilidad, antes y después](#3-mediciones-de-accesibilidad-antes-y-después)
4. [Peso y tiempo de carga del login](#4-peso-y-tiempo-de-carga-del-login)
5. [Pruebas y cómo repetir las mediciones](#5-pruebas-y-cómo-repetir-las-mediciones)
6. [Créditos](#6-créditos)

## 1. Decisiones y justificación

| # | Decisión | Justificación de identidad o de usabilidad |
|---|---|---|
| 1 | **Sin degradados.** El panel del login y el menú son azul marino plano `#1F365C` (`--color-marino`). | Es lo que dice `DESIGN.md`. Un degradado azul de tres tonos es la marca visual de una interfaz «generada»; el marino plano es institucional y no cambia el contraste del texto según la zona. |
| 2 | **Acento dorado `#EAA658` solo como detalle**: franja de 4 px entre el panel y el formulario del login (en móvil, borde inferior de la franja superior) y línea de 2 px bajo el nombre y el rol en el menú. Nunca lleva texto ni se usa como color de texto. | El dorado es el segundo color de la marca UPLA. Sobre blanco da 2,1:1: no sirve para texto, sí para separar. Una prueba (`identidad.test.js`) falla si el dorado aparece en cualquier propiedad que no sea un borde. |
| 3 | **Tipografía**: títulos en **Poppins SemiBold** (`--fuente-titulo`) y texto en **Montserrat** (400, 500, 600 y 700), como la web de la UPLA. Autoalojadas con `@fontsource` (solo el subconjunto latino y solo los pesos usados); se quitó el enlace a Google Fonts de `index.html`. | Identidad: son las fuentes de la universidad. Usabilidad: sin CDN la pantalla no depende de un servicio externo ni envía las visitas a un tercero, y se evita una conexión más al cargar. Ver «Peso». |
| 4 | **Formas sobrias**: radio de 6 px en tarjetas, campos, avisos y tablas (`--radio`) y de 4 px en botones, insignias y el recuadro del logo (`--radio-pequeno`); se quitó la sombra del modal y se separa con bordes de 1 px (`--color-borde`) y fondos. Tablas: encabezado marino claro `#E6ECF5` (`--fondo-encabezado-tabla`, 10,2:1 con el texto marino) y filas con separadores de 1 px. | Las esquinas de 8 px a 999 px (insignias en cápsula) y las sombras suaves son el sello de las plantillas genéricas. Un borde de 1 px separa igual sin añadir ruido, y el encabezado claro ordena la lectura de la tabla sin recurrir al color de la marca. |
| 5 | **Logo** de la UPLA dentro de un recuadro blanco de esquinas de 4 px: 40 px de alto en el menú (recuadro de 48 px) y 80 px en el login (recuadro de 88 px; 40 px en la franja móvil). `alt="Universidad Peruana Los Andes"`; el texto «ReservaUPLA» sigue junto o debajo. Se cargan versiones de 2x (`logo-upla-menu.webp`, 69x80, 2,9 KB; `logo-upla-login.webp`, 138x160, 6,0 KB) generadas con `tools/usabilidad/optimizar-imagenes.mjs`; el original de 1724x2000 (117 KB) no se carga en ninguna pantalla. | El logo es azul (`#007DBC`): sobre el marino casi no se ve, de ahí el recuadro blanco. Las versiones a 2x se ven nítidas en pantallas de alta densidad sin cargar un archivo 20 veces mayor. |
| 6 | **Login**: el panel izquierdo muestra la foto del campus (decorativa, sin texto alternativo), anclada abajo, con una **capa plana** del marino al 78 % (`--capa-foto`). La foto nunca se estira más de 1,5 veces (`--alto-foto-maximo: 768px`, 1,5 × 512): si el panel es más alto, lo que sobra arriba queda marino plano. En móvil (375 px) el panel es una franja con el logo y el nombre y **no descarga la foto** (la declaración está dentro de `@media (min-width: 768px)`). Se conservan «ReservaUPLA» y su frase; no se añadió ningún texto. | Da identidad (el letrero UPLA es lo primero que se reconoce) sin sacrificar legibilidad: el contraste del texto blanco sobre la foto se **midió en píxeles** (sección 3). En móvil la foto no aportaría nada y costaría 82 KB. |
| 7 | Se mantienen: foco `#1E73BE` (blanco sobre fondo oscuro), controles de 44 px, contraste AA, `prefers-reduced-motion` y ningún scroll horizontal a 320 y 375 px. | Accesibilidad antes que estilo: ver mediciones. |

Decisiones de detalle: el encabezado del menú (logo y nombre) puede partirse en dos líneas a 188 px (zoom del 200 % en un teléfono); el separador del botón «Cerrar sesión» y la capa del modal pasaron a tokens; los bordes de las tarjetas de formulario y del modal son de 1 px.

## 2. Antes y después

«Antes» es la captura anterior más cercana de `docs/evidencias/` (no se rehízo el estado anterior: sigue siendo el que se evaluó en su fase). «Después» está en `docs/evidencias/identidad/` (todas las pantallas y estados a 1280 px y 375 px, 87 capturas).

| Pantalla | Antes | Después |
|---|---|---|
| Login, 1280 px | [`fase8/despues/01-login-vacio`](../evidencias/fase8/despues/01-login-vacio-escritorio.png) | [`identidad/01-login-vacio`](../evidencias/identidad/01-login-vacio-escritorio.png) |
| Login, 375 px | [`fase8/despues/01-login-vacio`](../evidencias/fase8/despues/01-login-vacio-movil.png) | [`identidad/01-login-vacio`](../evidencias/identidad/01-login-vacio-movil.png) |
| Login con error | [`fase8/despues/02-login-errores-de-campo`](../evidencias/fase8/despues/02-login-errores-de-campo-escritorio.png) | [`identidad/02-login-errores-de-campo`](../evidencias/identidad/02-login-errores-de-campo-escritorio.png) |
| Dashboard, 1280 px | [`fase9/01-dashboard-con-la-solicitud`](../evidencias/fase9/01-dashboard-con-la-solicitud-escritorio.png) | [`identidad/60-dashboard`](../evidencias/identidad/60-dashboard-escritorio.png) |
| Dashboard, 375 px | [`fase9/01-dashboard-con-la-solicitud`](../evidencias/fase9/01-dashboard-con-la-solicitud-movil.png) | [`identidad/60-dashboard`](../evidencias/identidad/60-dashboard-movil.png) |
| Reservas | [`fase9/04-reservas-filtro-aprobada`](../evidencias/fase9/04-reservas-filtro-aprobada-escritorio.png) | [`identidad/63-reservas-administrador`](../evidencias/identidad/63-reservas-administrador-escritorio.png) |
| Detalle de la reserva | [`fase8/despues/30-detalle-admin-pendiente`](../evidencias/fase8/despues/30-detalle-admin-pendiente-escritorio.png) | [`identidad/30-detalle-admin-pendiente`](../evidencias/identidad/30-detalle-admin-pendiente-escritorio.png) |
| Menú lateral (escritorio) | Columna izquierda de [`fase9/01-dashboard…`](../evidencias/fase9/01-dashboard-con-la-solicitud-escritorio.png) | Columna izquierda de [`identidad/60-dashboard`](../evidencias/identidad/60-dashboard-escritorio.png) |
| Menú abierto (375 px) | [`fase8/despues/11-ambientes-menu-movil-abierto`](../evidencias/fase8/despues/11-ambientes-menu-movil-abierto-movil.png) | [`identidad/11-ambientes-menu-movil-abierto`](../evidencias/identidad/11-ambientes-menu-movil-abierto-movil.png) |

Además, en `identidad/`: modales (`28`, `31`, `34`, `61`, `62`), formularios y errores (`12` a `19`, `20` a `26`), detalle en sus variantes (`27` a `36`, `40`), Mi ambiente (`41`), Ambientes y Usuarios (`10`, `15`), «Sin permiso» y página no encontrada (`51`, `52`).

## 3. Mediciones de accesibilidad, antes y después

«Antes» es `docs/evidencias/fase9-accesibilidad.txt` (la última medición completa antes de este pase); «después» es `docs/evidencias/identidad-accesibilidad.txt` (`ETAPA=identidad node accesibilidad.mjs`, mismo método: axe-core, Edge sin ventana).

| Medición | Antes (Fase 9) | Después (identidad) |
|---|---|---|
| axe-core: mediciones con alguna violación | 0 de 85 | **0 de 87** |
| Pares de contraste por debajo del umbral | 0 | **0** (incluido el nuevo encabezado de tabla: 10,16:1) |
| Objetivos táctiles menores de 44 px (estados móviles) | 0 de 43 | **0 de 44** |
| Orden de Tab, foco visible, foco dentro del modal | 0 fallas | **0 fallas** |
| Reflujo a 320 px | sin scroll horizontal | **sin scroll horizontal** (10 de 10 pantallas) |
| Zoom 200 % en móvil (188 px) | 4 de 30 con scroll horizontal | **4 de 30** (las mismas: login, Nueva reserva, Registrar usuario y Mi ambiente) |
| `prefers-reduced-motion` (animaciones infinitas activas) | 0 | **0** |
| Texto blanco sobre la foto del login | — (no había foto) | **peor caso 6,29:1** en 5 tamaños de ventana (mínimo exigido 4,5:1) |

Contraste del texto sobre la foto (sección G del informe): se renderiza el login con el texto transparente y se toma el **píxel más claro** bajo «ReservaUPLA», la frase del panel y «Universidad Peruana Los Andes», y en toda la zona de la foto (cielo y nubes). Ventanas de 1280x900, 1920x1080, 1366x768, 1024x600 y 768x1024: todas llegan a 6,29:1 o más. Con la capa al 78 % el cielo más blanco queda en `rgb(77, 96, 128)`.

Defectos que apareció al medir (corregidos; ver bitácora): el encabezado del menú desbordaba a 188 px (10 de 30 combinaciones en la primera medición, 4 tras corregir) y la primera medición de la foto contaba el recuadro blanco del logo como si fuera foto.

## 4. Peso y tiempo de carga del login

`docs/evidencias/identidad-peso-login.txt` (`node peso-login.mjs`): versión compilada, caché vacía en cada carga, mediana de 7 cargas, antes (`main`) frente a después.

| | Antes | Después |
|---|---|---|
| Escritorio 1280 px: total transferido | 144,0 KB | 243,7 KB (+99,7 KB) |
| de ello, imágenes | 1,8 KB (favicon) | 90,2 KB (foto 82,3 + logo 6,1 + favicon 1,8) |
| de ello, fuentes | 37,1 KB (Google Fonts) | 45,3 KB (Montserrat 400 y 600 y Poppins 600, propias) |
| Móvil 375 px: total transferido | 144,5 KB | 161,5 KB (la foto **no** se descarga) |
| Escritorio, carga completa (localhost) | 175 ms | 55 ms |
| Escritorio, carga completa en 4G lento (1,6 Mbps, 150 ms) | 906 ms | 922 ms |
| Móvil, carga completa en 4G lento | 901 ms | 919 ms |

En localhost el «antes» tarda más porque pide la hoja y la fuente a Google Fonts (dos conexiones externas) y el «después» las sirve desde el mismo servidor; no es una mejora del diseño, es el efecto de quitar el CDN. En una red lenta el efecto neto es de unos 16 a 18 ms en el evento de carga (escritorio 906 → 922 ms; móvil 901 → 919 ms) y el primer contenido apenas cambia (escritorio 968 → 980 ms; móvil 960 → 976 ms). El peso en escritorio sube unos 100 KB (casi todo, la foto) y en móvil unos 17 KB. Son tiempos medidos en una sola máquina con la red simulada, no en dispositivos reales.

## 5. Pruebas y cómo repetir las mediciones

- `frontend`: 860 pruebas en verde (las 758 anteriores más las del contrato de identidad), lint, prettier y build limpios. Pruebas ajustadas: **una**, `LoginPage.test.jsx` «no tiene logotipo…», que pasó a comprobar que el panel lleva el único logo con su texto alternativo (el cambio es legítimo: el logo se entregó expresamente; la regla «sin logo oficial» de fases anteriores queda sustituida por esa entrega). Ninguna otra prueba dependía de clases o estilos.
- `frontend/src/styles/identidad.test.js`: sin degradados ni sombras, radios de 4 a 6 px, ningún color suelto, dorado solo en bordes, fuentes de `@fontsource` y sin CDN, foto solo en `@media (min-width: 768px)`, alto máximo de la foto, capa ≥ 70 %, logo optimizado y nunca el original, tamaños del logo y reflujo del menú.
- Mediciones (desde `tools/usabilidad`): `ETAPA=identidad node accesibilidad.mjs` (también escribe las capturas de `docs/evidencias/identidad/`), `node peso-login.mjs --antes <url> --despues <url>` y `node optimizar-imagenes.mjs`. `npm run pruebas` incluye las del contraste sobre la foto.

## 6. Créditos

El logo y la fotografía del campus son de la **Universidad Peruana Los Andes** y se usan con fines académicos; **no se redistribuyen**. Los archivos originales no se importan en la interfaz (solo las versiones derivadas que ella necesita). Las fuentes Poppins y Montserrat son de código abierto (licencia SIL OFL) y se distribuyen con `@fontsource`.
