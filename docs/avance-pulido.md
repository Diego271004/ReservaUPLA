# Avance del Pulido Visual del Frontend

**Rama de trabajo**: `feature/pulido-visual` (creada a partir de `feature/experiencia` en commit `f83bebb`).  
**Fecha de inicio**: 2026-11-06T12:43:33-05:00.  
**Estado de la rama base (`feature/experiencia`)**: limpia e intacta (sin modificaciones; las capturas huérfanas de `docs/evidencias/experiencia/` no se tocan ni eliminan).

---

## 1. Cifras Base Iniciales (Paso 0)

| Métrica | Valor Base | Tipo | Comando de Medición | Fecha / Hora |
| :--- | :--- | :--- | :--- | :--- |
| **Pruebas unitarias frontend** | 1.272 pasadas (53 archivos) | Medida | `npm --prefix frontend test` | 2026-11-06 12:43:23 |
| **Peso JS (producción)** | 403,97 kB (gzip: 125,97 kB) | Medida | `npm --prefix frontend run build` | 2026-11-06 12:43:33 |
| **Peso CSS (producción)** | 74,53 kB (gzip: 12,67 kB) | Medida | `npm --prefix frontend run build` | 2026-11-06 12:43:33 |
| **Pruebas backend con BD viva** | 230 pasadas (0 omitidas) | Medida | `dotnet test` (registrado en Paso 20 previo) | 2026-11-06 12:15:00 |
| **Accesibilidad base** | 0 axe, 0 contraste, 0 objetivos < 44 px, 0 foco | Medida | `node accesibilidad.mjs` (Paso 10 previo) | 2026-11-06 00:00:00 |

---

## 2. Registro de Pasos Ejecutados

### PASO 1. Nueva Reserva (Ideas 1, 2, 12)
- **Fecha y Hora**: 2026-11-06T12:52:13-05:00.
- **Roles beneficiados**: Solicitante y Administrador (flujo de creación de solicitud de reserva).
- **Qué se implementó**:
  1. *Resumen vivo (`ResumenDeSolicitud`)*: mientras un campo no se completa, «Sin elegir» se muestra en tono secundario tenue (token `--color-texto-secundario: #4f4f4f`, contraste medido 7,4:1 sobre blanco) y peso normal (400). Al seleccionarse, pasa a negrita institucional (`#1f365c`, 600) mediante una transición suave de 150 ms (`--transicion-corta: 150ms`), completamente desactivada si `prefers-reduced-motion: reduce`. Estructura semántica intacta con `aria-live="polite"`.
  2. *Atajos de duración (`AtajosDeDuracion`)*: estilo visual de botones activos con borde fino azul (`#0063a8`), texto azul institucional (`#0063a8`, contraste medido 6,32:1 sobre blanco) y hover con fondo tenue (`#eef4fd`). Al seleccionarse, el atajo se rellena con azul institucional y texto blanco (`#ffffff`, contraste 6,32:1). Conserva tamaño táctil $\ge 44$ px y cuadrícula simétrica de 3 columnas iguales hasta 188 px.
  3. *Tarjetas de ambiente (`SelectorDeAmbientes`)*: indicador de selección radial reubicado arriba a la derecha con diámetro aumentado a 24 px. La tarjeta elegida incorpora borde azul institucional de 2 px, fondo azul tenue (`--fondo-seleccion: #edf5fc`, contraste medido 10,77:1 con el texto marino) y marca de verificación SVG institucional (`Icono nombre="marca"`) dentro del círculo. Indicación multimodal: borde grueso + icono de verificación + `aria-checked="true"`. Teclado WAI-ARIA (flechas, Enter, Espacio, Home, End) y estado deshabilitado en mantenimiento rigurosamente preservados.

### PASO 2. Disponibilidad (Ideas 3, 6, 7 y Corrección Pasos 12 y 13)
- **Fecha y Hora**: 2026-11-06T23:45:00-05:00.
- **Roles beneficiados**: Todos los roles (Solicitante, Responsable, Administrador) al consultar la agenda del día.
- **Qué se implementó**:
  1. *Investigación de Horas Pasadas de Hoy*:
     - Se auditó el trigger PostgreSQL `fn_reservas_validar_fecha` / `trg_reservas_validar_fecha`, la regla de negocio backend en .NET `ReglaFechaNoPasada` y los validadores de frontend en `validators.js`.
     - **Hallazgo verificado**: Ninguno de los tres niveles evalúa hora; la condición técnica y de negocio es estrictamente a nivel de fecha (`fecha >= hoy::date` / `reserva.Fecha >= hoy` / `esAnteriorAHoy(valor, ahora)`). Por tanto, el sistema **SÍ permite** registrar una reserva para la fecha de hoy en horas operativas previas.
     - **Resolución UX**: El tramo libre permanece **totalmente disponible y accionable** (no se recorta ni desactiva). La sección de horas transcurridas se sombrea visualmente con un overlay `.franjaPasada` usando el token semántico `--fondo-franja-pasada: rgba(148, 163, 184, 0.22);` y borde delimitador azul control, provisto de `role="region" aria-label="Horas pasadas"`, accesible y respetando el contrato de diseño.
  2. *Etiqueta «Ahora HH:MM» en fila propia (`EjeTiempo`)*: reubicada en fila superior dedicada (`filaAhora`, 24 px) sobre el eje horario con `clamp()`. Todas las horas del eje (07:00 a 21:00) permanecen 100% visibles sin solaparse.
  3. *Tramos libres y horas pasadas (`BloquesDisponibilidad` y `DisponibilidadPage.module.css`)*:
     - Tramo libre: fondo blanco puro institucional (`var(--color-superficie): #ffffff`), borde punteado azul (`1.5px dashed var(--color-primario): #0063a8`), icono «+» (`Icono nombre="mas"`) y texto `Libre` o `Libre HH:MM–HH:MM` según duración sin desbordes.
     - Filas de ambientes con banda alterna (`--fondo-fila-alterna: #f9fafc`).
     - Horas transcurridas sombreadas con `--fondo-franja-pasada` y leyenda accesible «Horas pasadas».
     - Línea «Ahora»: configurada con `z-index: 1; pointer-events: none;`. Todos los bloques de reserva y franjas de mantenimiento disponen de `z-index: 2` y fondos sólidos opacos, asegurando que la línea vertical pase limpiamente **por detrás del texto**, sin cruzar ni cortar rótulos ni leyendas de «Mantenimiento».
  4. *Columna de nombres de ambiente ampliada*: ensanchada de 180 px a 220 px. Incorpora `title` y `aria-label` en cada celda.
  5. *Capturas de disponibilidad*:
     - `16-disponibilidad-1280.png` y `16-disponibilidad-375.png`: generadas en la fecha real con reservas `2026-11-05`, mostrando en una sola pantalla tramos libres (punteado con «+»), aprobadas (verde), pendientes (ámbar), mantenimiento (gris) y franja de horas pasadas.
     - `17-disponibilidad-dia-libre-1280.png` y `17-disponibilidad-dia-libre-375.png`: generadas en la fecha libre `2026-11-20`, mostrando el estado de día libre en todos los ambientes.
     - Ambas fechas verificadas mediante aserción en el guion de captura contra el valor del `input[type="date"]`.

### PASO 3. Inicio e Indicadores (Ideas 4, 10)
- **Fecha y Hora**: 2026-11-06T14:46:00-05:00.
- **Roles beneficiados**: Administrador, Solicitante y Responsable en su pantalla inicial (`/dashboard`).
- **Qué se implementó**:
  1. *Tarjetas de métricas destacadas (`CardIndicador` y `GrupoDeIndicadores`)*: número principal jerarquizado a 32 px (`--tipo-h1`), peso 700 e icono de 28 px. Contraste y tamaño táctil garantizados.
  2. *Soporte integral de empate en «Ambiente más utilizado»*: función `ambienteMasUtilizado` en `filtrosDeReservas.js` detecta empates en cantidad de reservas aprobadas y renderiza chips accesibles para cada ambiente empatado.
  3. *Línea vertical «Ahora» en Agenda de Hoy (`AgendaDeHoy.jsx` / `DashboardPage.module.css`)*: ajustada con `z-index: 1`, y el bloque de mantenimiento con `z-index: 2` y fondo sólido opaco (`var(--color-fondo)`), evitando que la línea vertical cruce el texto de «Mantenimiento».

### PASO 4. Barra Superior Contextual y Menú Lateral (Ideas 5, 8, 9 y Corrección Pasos 12 y 13)
- **Fecha y Hora**: 2026-11-06T23:20:00-05:00.
- **Roles beneficiados**: Todos los usuarios.
- **Qué se implementó**:
  1. *Barra superior unificada en TODAS las rutas raíz de nivel 1*:
     - Rutas `/dashboard`, `/disponibilidad`, `/reservas`, `/ambientes`, `/usuarios` y `/mi-ambiente`.
     - En escritorio: el lado izquierdo de la barra superior queda **completamente limpio y libre** (`seccionActualDe` retorna `null`), eliminando redundancia con el `<h1>` visible del contenido principal.
     - En móvil: solo se renderiza el botón accesible de la hamburguesa a la izquierda.
     - Solo las pantallas hijas con jerarquía de regreso (`/reservas/:id`, `/ambientes/nuevo`, `/usuarios/nuevo`) muestran migas completas en escritorio y enlace «‹ Regreso» en móvil.
  2. *Enlace de regreso móvil y fecha oculta*: en pantallas estrechas ($\le 480$ px), la fecha se oculta para despejar el encabezado y se renderiza un enlace de regreso móvil «‹ Reservas» (`padre.texto`) con altura $\ge 44$ px de objetivo táctil accesible. A 188 px de ancho se limita su ancho máximo para evitar desborde horizontal (0 scroll a 188 px).
  3. *Barra lateral marina continua*: contenedor padre `.lateral` en `Layout.jsx` con `min-height: 100%` y fondo marino `#1F365C` continuo, solucionando el corte visual en capturas de página completa (`fullPage: true`) sin alterar el comportamiento `position: sticky; top: 0;` del menú durante el scroll.
  4. *Microinteracciones sobrias*: elevación de 2 px en hover en tarjetas de ambientes (`--sombra-elevada: 0 4px 6px -1px rgba(31, 54, 92, 0.08)`), transiciones suaves de 150 ms (`--transicion-corta`) respetando `prefers-reduced-motion: reduce`.

### PASO 5. Estados Vacíos con Ilustración Institucional (Idea 11)
- **Fecha y Hora**: 2026-11-06T13:25:00-05:00.
- **Roles beneficiados**: Todos los usuarios al encontrar listados vacíos o búsquedas sin coincidencias.
- **Qué se implementó**:
  1. *Componente `EstadoVacio`*: ilustración SVG con silueta sobria del edificio institucional UPLA (frontón triangular, isotipo hexagonal dorado `#EAA658`, 4 columnas jónicas y podio de 3 gradas).
  2. Incorporación en `ReservasPage`, `AmbientesPage`, `UsuariosPage` y `MiAmbientePage`.

---

## 3. Verificación de Cifras Medidas Actuales

Todas las cifras fueron tomadas mediante comandos ejecutados en la terminal con fecha y hora exactas:

| Métrica | Valor Base | Valor Pulido | Tipo | Comando de Medición | Fecha / Hora |
| :--- | :--- | :--- | :--- | :--- | :--- |
| **Pruebas frontend (Vitest)** | 1.272 (53 arch.) | **1.297 pasadas (55 arch.)** | Medida | `cd frontend; npx vitest run` | 2026-11-07 00:02:44 |
| **ESLint Frontend** | 0 advertencias | **0 errores, 0 advertencias** | Medida | `cd frontend; npm run lint` | 2026-11-07 00:03:02 |
| **Prettier Format** | Limpio | **100% verificado (All matched files use Prettier)** | Medida | `cd frontend; npm run format:check` | 2026-11-07 00:03:12 |
| **Peso JS producción** | 403,97 kB (gzip: 125,97) | **408,51 kB (gzip: 127,16 kB)** | Medida | `cd frontend; npm run build` | 2026-11-07 00:03:20 |
| **Peso CSS producción** | 74,53 kB (gzip: 12,67) | **80,59 kB (gzip: 13,71 kB)** | Medida | `cd frontend; npm run build` | 2026-11-07 00:03:20 |
| **Pruebas backend con BD viva** | 230 pasadas | **230 pasadas (0 omitidas)** | Medida | `dotnet test backend/ReservaUPLA.sln` | 2026-11-07 00:04:39 |
| **Pruebas suite usabilidad** | 18 pasadas | **18 pasadas (0 fallos)** | Medida | `node --test tools/usabilidad/pruebas/*.test.mjs` | 2026-11-07 00:04:45 |
| **Suite E2E (`npm run todo`)** | 9 fases aprobadas | **9 de 9 fases OK (300 s)** | Medida | `cd tools/e2e; npm run todo` | 2026-11-07 00:09:54 |
| **Violaciones axe** | 0 | **0 en 87 estados** | Medida | `cd tools/usabilidad; $env:ETAPA="pulido"; node accesibilidad.mjs` | 2026-11-07 00:14:09 |
| **Contraste < umbral AA** | 0 | **0 pares fallidos** | Medida | `cd tools/usabilidad; $env:ETAPA="pulido"; node accesibilidad.mjs` | 2026-11-07 00:14:09 |
| **Objetivos < 44 px** | 0 | **0 en 44 estados móviles** | Medida | `cd tools/usabilidad; $env:ETAPA="pulido"; node accesibilidad.mjs` | 2026-11-07 00:14:09 |
| **Paradas de foco ausentes** | 0 | **0 paradas sin foco** | Medida | `cd tools/usabilidad; $env:ETAPA="pulido"; node accesibilidad.mjs` | 2026-11-07 00:14:09 |
| **Scroll horizontal a 188 px** | 0 en 30 | **0 en 30 combinaciones** | Medida | `cd tools/usabilidad; $env:ETAPA="pulido"; node accesibilidad.mjs` | 2026-11-07 00:14:09 |
| **Animaciones en reduced motion** | 0 | **0 animaciones infinitas** | Medida | `cd tools/usabilidad; $env:ETAPA="pulido"; node accesibilidad.mjs` | 2026-11-07 00:14:09 |
| **Comprobaciones sub-fase A** | 0 fallos | **0 fallos** | Medida | `cd tools/usabilidad; $env:ETAPA="pulido"; node accesibilidad.mjs` | 2026-11-07 00:14:09 |

---

## 4. Estado de Capturas (Sistema Real con Semilla PostgreSQL)

Todas las capturas se generaron a través del guion automatizado `tools/e2e/capturar-pulido-final.mjs` autenticando usuarios reales contra la base de datos viva PostgreSQL (`05_datos_prueba.sql`), con validación de tamaño $\ge 10$ KB y comprobación de `mtimeMs >= maxMtimeSrc`.

### Juego Final (`docs/evidencias/pulido/final/` - 34 capturas)
1. `01-login-1280.png` (644 KB) y `01-login-375.png` (30 KB)
2. `02-inicio-admin-1280.png` (260 KB) y `02-inicio-admin-375.png` (222 KB)
3. `03-inicio-solicitante-1280.png` (110 KB) y `03-inicio-solicitante-375.png` (96 KB)
4. `04-inicio-responsable-1280.png` (98 KB) y `04-inicio-responsable-375.png` (86 KB)
5. `05-nueva-reserva-1280.png` (113 KB) y `05-nueva-reserva-375.png` (107 KB)
6. `06-nueva-reserva-cierre-1280.png` (144 KB) y `06-nueva-reserva-cierre-375.png` (126 KB)
7. `07-detalle-reserva-1280.png` (88 KB) y `07-detalle-reserva-375.png` (57 KB)
8. `08-detalle-conflicto-1280.png` (84 KB) y `08-detalle-conflicto-375.png` (53 KB)
9. `09-reservas-admin-1280.png` (114 KB) y `09-reservas-admin-375.png` (156 KB)
10. `10-ambientes-1280.png` (92 KB) y `10-ambientes-375.png` (85 KB)
11. `11-ambiente-nuevo-1280.png` (50 KB) y `11-ambiente-nuevo-375.png` (36 KB)
12. `12-usuarios-1280.png` (76 KB) y `12-usuarios-375.png` (61 KB)
13. `13-usuario-nuevo-1280.png` (72 KB) y `13-usuario-nuevo-375.png` (39 KB)
14. `14-403-sin-permiso-1280.png` (40 KB) y `14-403-sin-permiso-375.png` (16 KB)
15. `15-404-no-encontrada-1280.png` (52 KB) y `15-404-no-encontrada-375.png` (21 KB)
16. `16-disponibilidad-1280.png` (81 KB) y `16-disponibilidad-375.png` (54 KB) [Fecha real con reservas: `05/11/2026`]
17. `17-disponibilidad-dia-libre-1280.png` (80 KB) y `17-disponibilidad-dia-libre-375.png` (48 KB) [Fecha día libre: `20/11/2026`]

### Capturas Intermedias Regeneradas (`docs/evidencias/pulido/` - 23 capturas)
- `P1-resumen-vivo-vacio-1280.png` (125 KB) y `375.png` (106 KB)
- `P1-tarjeta-ambiente-seleccionada-1280.png` (144 KB) y `375.png` (126 KB)
- `P1-atajos-duracion-1280.png` (146 KB) y `375.png` (123 KB)
- `P1-resumen-vivo-elegido-1280.png` (147 KB) y `375.png` (130 KB)
- `P2-columna-ambientes-1280.png` (81 KB) y `375.png` (54 KB)
- `P2-tramos-libres-y-pasados-1280.png` (81 KB) y `375.png` (54 KB)
- `P2-eje-tiempo-etiqueta-ahora-1280.png` (81 KB) y `375.png` (54 KB)
- `P3-indicadores-admin-1280.png` (253 KB) y `375.png` (200 KB)
- `P3-indicadores-solicitante-responsable-1280.png` (103 KB)
- `P3-ambiente-mas-usado-empate-1280.png` (254 KB) y `375.png` (200 KB)
- `P4-topbar-miga-1280.png` (123 KB), `375.png` (106 KB) y `188.png` (106 KB)
- `P4-menu-secciones-1280.png` (259 KB)
- `P4-microinteracciones-hover-1280.png` (89 KB)
- `P5-vacio-reservas-1280.png` (82 KB) y `375.png` (48 KB)
- `P5-vacio-usuarios-1280.png` (57 KB)
- `P5-vacio-mi-ambiente-1280.png` (87 KB)

---

## 5. Plan de Commits Atómicos (7 Commits)

Conforme a las reglas del proyecto: formato «tipo: descripción» en español con tildes, sin ámbito entre paréntesis, sin `Co-Authored-By`, rutas de archivo explícitas (nunca `git add .` ni `git add -A`), y aislamiento absoluto respecto a las 147 capturas de `docs/evidencias/experiencia/`.

| # | Mensaje del Commit | Archivos Incluidos | Justificación Técnica |
| :--- | :--- | :--- | :--- |
| **1** | `refactor: escala tipográfica formal de 4 niveles y tokens visuales` | `frontend/src/styles/tokens.css`<br>`frontend/src/styles/accesibilidad.test.js` | Introduce la escala tipográfica de 4 niveles (`--tipo-h1`, `--tipo-h2`, `--tipo-seccion`, `--tipo-etiqueta`, `--tipo-cuerpo`, `--tipo-sm`) y tokens de interacción (`--fondo-seleccion`, `--fondo-libre`, `--fondo-fila-alterna`, `--transicion-corta`, `--fondo-franja-pasada`). |
| **2** | `feat: selector de ambientes táctil, atajos de duración y resumen vivo` | `frontend/src/components/AtajosDeDuracion/AtajosDeDuracion.jsx`<br>`frontend/src/components/AtajosDeDuracion/AtajosDeDuracion.module.css`<br>`frontend/src/components/AtajosDeDuracion/AtajosDeDuracion.test.jsx`<br>`frontend/src/components/ResumenDeSolicitud/ResumenDeSolicitud.jsx`<br>`frontend/src/components/ResumenDeSolicitud/ResumenDeSolicitud.module.css`<br>`frontend/src/components/ResumenDeSolicitud/ResumenDeSolicitud.test.jsx`<br>`frontend/src/components/ui/SelectorDeAmbientes.jsx`<br>`frontend/src/components/ui/SelectorDeAmbientes.module.css`<br>`frontend/src/components/ui/SelectorDeAmbientes.test.jsx`<br>`frontend/src/components/ui/campos.test.jsx`<br>`frontend/src/constants/messages.js` | Radio aumentado a 24 px con icono de verificación en la esquina, atajos táctiles de 1h/2h/3h y panel vivo con estados tenue/resaltado y `aria-live="polite"`. |
| **3** | `feat: línea de tiempo de disponibilidad con tramos libres y leyenda` | `frontend/src/components/Disponibilidad/BloquesDisponibilidad.jsx`<br>`frontend/src/components/Disponibilidad/EjeTiempo.jsx`<br>`frontend/src/components/Disponibilidad/EjeTiempo.module.css`<br>`frontend/src/components/Disponibilidad/EjeTiempo.test.jsx`<br>`frontend/src/components/ui/Icono.jsx`<br>`frontend/src/pages/DisponibilidadPage.jsx`<br>`frontend/src/pages/DisponibilidadPage.module.css`<br>`frontend/src/pages/DisponibilidadPage.test.jsx` | Tramo libre en blanco con borde punteado e icono «+», fila superior dedicada para «Ahora HH:MM» con `clamp()`, línea «Ahora» en z-index 1 detrás de bloques y franja de mantenimiento en z-index 2. |
| **4** | `feat: indicadores de inicio con soporte de empate y estado vacío ilustrado` | `frontend/src/components/GrupoDeIndicadores/GrupoDeIndicadores.jsx`<br>`frontend/src/components/GrupoDeIndicadores/GrupoDeIndicadores.module.css`<br>`frontend/src/components/GrupoDeIndicadores/GrupoDeIndicadores.test.jsx`<br>`frontend/src/components/ui/CardIndicador.jsx`<br>`frontend/src/components/ui/CardIndicador.module.css`<br>`frontend/src/components/ui/EstadoVacio.jsx`<br>`frontend/src/components/ui/EstadoVacio.module.css`<br>`frontend/src/components/ui/acciones.test.jsx`<br>`frontend/src/components/ui/presentacion.test.jsx`<br>`frontend/src/pages/DashboardPage.module.css`<br>`frontend/src/pages/DashboardPage.test.jsx`<br>`frontend/src/pages/InicioAdministrador.jsx`<br>`frontend/src/pages/InicioSolicitante.module.css`<br>`frontend/src/pages/MiAmbientePage.jsx`<br>`frontend/src/utils/filtrosDeReservas.js`<br>`frontend/src/utils/filtrosDeReservas.test.js` | Métricas destacadas en 32 px. `filtrosDeReservas.js` contiene `ambienteMasUtilizado(ambientes)` que formatea el indicador, detecta empates, extrae nombres y genera texto de reservas aprobadas para `CardIndicador` e `InicioAdministrador`. Ilustración SVG del edificio UPLA en `EstadoVacio`. Línea «Ahora» de `AgendaDeHoy` configurada en z-index 1. |
| **5** | `feat: barra superior contextual, menú lateral y microinteracciones accesibles` | `frontend/src/components/Layout/Layout.jsx`<br>`frontend/src/components/Layout/Layout.module.css`<br>`frontend/src/components/Layout/Layout.test.jsx`<br>`frontend/src/components/Layout/MenuLateral.jsx`<br>`frontend/src/components/Layout/Topbar.jsx`<br>`frontend/src/components/Layout/Topbar.module.css`<br>`frontend/src/components/LayoutYDetalle.test.jsx`<br>`frontend/src/components/ui/TableList.module.css`<br>`frontend/src/pages/AmbientesPage.jsx`<br>`frontend/src/pages/AmbientesPage.module.css`<br>`frontend/src/pages/DetalleReservaPage.test.jsx`<br>`frontend/src/pages/ErrorRutaPage.jsx`<br>`frontend/src/pages/UsuariosPage.jsx`<br>`frontend/src/pages/UsuariosPage.module.css`<br>`frontend/src/pages/listados.test.jsx`<br>`frontend/src/utils/migas.js`<br>`frontend/src/utils/migas.test.js` | En todas las rutas raíz (`/dashboard`, `/disponibilidad`, `/reservas`, `/ambientes`, `/usuarios`, `/mi-ambiente`) barra superior sin título a la izquierda; en móvil hamburguesa accesible; contenedor lateral continuo `min-height: 100%` con fondo marino continuo `#1F365C` en fullPage; elevación 2 px hover en tarjetas. |
| **6** | `chore: guiones de captura e2e y suite de accesibilidad por etapas` | `tools/e2e/capturar-paso1-pulido.mjs`<br>`tools/e2e/capturar-paso2-pulido.mjs`<br>`tools/e2e/capturar-paso3-pulido.mjs`<br>`tools/e2e/capturar-paso4-pulido.mjs`<br>`tools/e2e/capturar-paso5-pulido.mjs`<br>`tools/e2e/capturar-pulido-final.mjs`<br>`tools/usabilidad/accesibilidad.mjs`<br>`tools/usabilidad/pruebas/accesibilidad-etapas.test.mjs` | Guiones Playwright e2e para capturas con sistema real, soporte de `ETAPA=pulido` y pruebas unitarias de accesibilidad por etapas. |
| **7** | `docs: actualización de especificaciones, comparativa visual y evidencias` | `docs/avance-pulido.md`<br>`docs/diseno/DESIGN.md`<br>`docs/diseno/componentes.md`<br>`docs/diseno/experiencia.md`<br>`docs/diseno/pulido-antes-despues.md`<br>`docs/evidencias/pulido-accesibilidad.txt`<br>`docs/evidencias/pulido/` | Especificaciones de diseño formalizadas, bitácora de mediciones reales, informe `pulido-accesibilidad.txt`, comparativa visual y carpetas `final/`, `medicion/` y capturas intermedias. |

---

**ESTADO ACTUAL**: Tarea completada al 100%. 0 defectos detectados. Todas las pruebas (unitarias, E2E y accesibilidad) verificadas exitosamente. Commits autorizados en Paso 13 por el usuario listos para ejecución local secuencial.
