# Avance de la Revisión de Diseño con Skills Especializadas (Taste & Design Systems)

**Rama de trabajo**: `feature/taste` (creada a partir de `feature/pulido-visual` estable).  
**Fecha de inicio**: 2026-11-07T15:24:00-05:00.  
**Estado de la rama base (`feature/pulido-visual`)**: intacta y protegida.  
**Árbol de trabajo base**: verificado con `git status --short`; contiene únicamente las 147 capturas intermedias huérfanas de `docs/evidencias/experiencia/` y los archivos generados para la nueva etapa `ETAPA=taste`.

---

## 1. Cifras Base Iniciales (Paso 0)

Todas las cifras fueron tomadas mediante comandos reales sobre el sistema en esta terminal y están clasificadas como **Medida**.

| Métrica | Valor Base | Tipo | Comando de Medición | Fecha / Hora (Local) |
| :--- | :--- | :--- | :--- | :--- |
| **Pruebas unitarias frontend** | 1.304 pasadas (57 archivos, 0 fallos) | Medida | `npm --prefix frontend test -- --run` | 2026-11-07 15:25:43 -05:00 |
| **Peso JS (producción)** | 408,83 kB (gzip: 127,24 kB) | Medida | `npm --prefix frontend run build` | 2026-11-07 15:29:21 -05:00 |
| **Peso CSS (producción)** | 80,60 kB (gzip: 13,71 kB) | Medida | `npm --prefix frontend run build` | 2026-11-07 15:29:21 -05:00 |
| **Pruebas backend con BD viva** | 230 pasadas (0 omitidas, 0 fallos) | Medida | `dotnet test backend/ReservaUPLA.sln` | 2026-11-07 15:40:02 -05:00 |
| **Accesibilidad base (`ETAPA=taste`)** | 0 axe, 0 contraste, 0 táctiles < 44 px, 0 foco | Medida | `$env:ETAPA="taste"; node tools/usabilidad/accesibilidad.mjs` | 2026-11-07 15:33:28 -05:00 |
| **Suite E2E completa (`npm run todo`)** | 9 de 9 fases OK (242 s, todo correcto) | Medida | `npm --prefix tools/e2e run todo` | 2026-11-07 15:37:51 -05:00 |
| **Pruebas de usabilidad (`node --test`)** | 19 pasadas (0 fallos) | Medida | `node --test tools/usabilidad/*.test.mjs tools/usabilidad/pruebas/*.test.mjs` | 2026-11-07 15:40:45 -05:00 |
| **Linters (ESLint y Prettier)** | 0 errores, 0 advertencias | Medida | `npm --prefix frontend run lint` y `format:check` | 2026-11-07 15:40:40 -05:00 |

### Detalle de Mediciones Base de Accesibilidad (`docs/evidencias/taste-accesibilidad.txt`)
- **Violaciones axe-core**: 0 en 87 estados recorridos (43 escritorio a 1280 px + 44 móvil a 375 px).
- **Contraste de tokens (WCAG 2.2 AA)**: 0 pares por debajo del umbral mínimo de 4.5:1 (texto normal) o 3.0:1 (texto grande / controles).
- **Objetivos táctiles**: 0 elementos < 44 px en los 44 estados móviles analizados.
- **Paradas de foco visible**: 0 paradas sin anillo visible; 0 paradas fuera de modales mientras están abiertos.
- **Scroll horizontal a 188 px**: 0 de 30 combinaciones evaluadas presentan desbordamiento horizontal.
- **Movimiento reducido**: 0 animaciones infinitas en ejecución bajo `prefers-reduced-motion: reduce`.
- **Sub-fase A**: 0 fallos en las 7 comprobaciones H1 a H7 (incluyendo H7: cero textos recortados en la vista de disponibilidad a 1280, 375 y 188 px).

---

## 2. Lectura y Diagnóstico de Skills Instaladas

Se completó la lectura íntegra en el orden estipulado:

1. **`design-taste-frontend` (`taste-skill` v2.5.1)**: **Abierta y leída completa**. Aporta reglas fundamentales de anti-slop: bordes de contenido simétricos (*equal edges*), elevación táctil en hover (máximo 2 px), estados `:active` con pulsación tangible, eliminación de copys vacíos/redundantes, y checklist de calidad en navegador real.
2. **`corporate` (TypeUI)**: **Abierta y leída completa**. Aporta la grilla base modular de 8pt/4pt, consistencia tipográfica corporativa, estados explícitos de interacción y rigor semántico para aplicaciones de gestión institucional.
3. **`ant` (TypeUI)**: **Abierta y leída completa**. Aporta la optimización para alta densidad de información operativa (*data-dense web applications*), legibilidad en tablas con múltiples columnas de datos, alineación numérica y estados claros en listas y filtros.
4. **`bento` (TypeUI)**: **Abierta y leída completa**. Aporta la ordenación visual modular en tarjetas agrupadas por nivel de decisión (urgente arriba, operativo al medio, métricas/resumen debajo) para el Inicio del Administrador, sin recurrir a gráficos decorativos superfluos.
5. **`playwright-cli` (Microsoft)**: **Abierta y leída completa**. Herramienta CLI para automatización ágil de pruebas en navegador, capturas de pantalla atómicas en resoluciones de prueba y evaluación de propiedades del DOM en tiempo real (`scrollWidth <= clientWidth`).

---


## 3. Resumen de la Auditoría Taste y Decisiones

Consolidado del documento formal entregado en `docs/diseno/auditoria-taste.md`:

| Área Evaluada | Hallazgo Principal | Principio de la Skill | Decisión | Justificación Conectada al Contrato / Usabilidad | Severidad (0–4) |
|---|---|---|---|---|---|
| **1. Equal edges** | Desalineación de borde derecho en formularios vs. cabecera; rejilla de métricas con columnas flotantes | Equal edges (taste v2.5.1) | **ADOPTAR** | Se acotó `FormularioTarjeta` a 760 px alineado con cabecera; grilla estricta de 4 cols (desktop) y 2 (tablet). | 2 |
| **2. Ritmo y espaciado** | Espaciados variables en estados vacíos y modales | Modular rhythm 8pt (corporate) | **ADAPTAR** | Se unificaron distancias basadas exclusivamente en tokens CSS (`--espacio-2` a `--espacio-6`). | 1 |
| **3. Microinteracciones** | Falta de feedback tangible en click/tap (`:active`) en botones y tramos | Physical feedback & tactile response (taste) | **ADOPTAR** | Microinteracción `:active:not(:disabled) translateY(1px)` en botones, tramos libres y atajos; anulada con reduced-motion. | 2 |
| **4. Jerarquía visual** | Botones de formulario con jerarquía adecuada, pero sin pulsación táctil diferenciada | Visual weight & semantic buttons (taste / corporate) | **ADAPTAR** | Se mantuvieron variantes primarias, secundarias y destructivas con elevación contenida ($\le 2$ px). | 1 |
| **5. Densidad de datos** | Tablas sin resalte hover de fila y cifras de capacidad centradas en vez de alineadas a la derecha | Data-dense tables & tabular nums (ant) | **ADOPTAR** | `TableList` con hover highlight sutil (`--fondo-fila-alterna`), `tabular-nums` y alineación a la derecha en columna Capacidad. | 2 |
| **6. Inicio Bento** | En Administrador, las métricas aparecían antes de las solicitudes urgentes que requieren decisión | Decision-driven bento layout (bento) | **ADAPTAR** | Reordenación por urgencia: 1) Solicitudes pendientes, 2) Agenda de hoy, 3) Indicadores clave, 4) Uso y estados. | 2 |
| **7. Microcopy** | Textos con pequeñas redundancias («Todavía no hay registros.») | Direct tone & active voice (taste) | **ADAPTAR** | Textos más concisos en `TEXTOS` (`messages.js`), manteniendo 100% intactos los mensajes de validación `MENSAJES`. | 1 |
| **8. Ilustración de estados vacíos** | Edificio institucional grande que desplazaba el foco de atención | No generic stock illustrations (taste) | **ADAPTAR** | Se conservó el edificio institucional UPLA pero escalado a proporciones compactas (100x72 y 64x46 px) y padding moderado. | 2 |
| **9. Pantalla de login** | Proporción 50/50 en desktop con ligera descompensación visual | Editorial ratio & calm focus (taste) | **ADAPTAR** | Proporción ajustada a 58% (visual institucional) / 42% (formulario) y supresión de animaciones bajo reduced-motion. | 1 |

---

## 4. Cambios Aplicados por Tema (Paso 2)

### (a) Bordes y Ritmo (Equal Edges)
- `FormularioTarjeta.module.css`: incorporación de `.contenedorSimple` con `max-width: 760px` para que el formulario y la cabecera `PageHeader` compartan la misma guía derecha en pantallas de escritorio.
- `GrupoDeIndicadores.module.css`: grilla responsive de 4 columnas en desktop ($\ge 1024$ px) y 2 columnas en tablet (600–1023 px), preservando `minmax(min(180px, 100%), 1fr)` para zoom 200% a 188 px.

### (b) Microinteracciones Tangibles
- `Button.module.css`: microinteracción de pulsación física `:active:not(:disabled) { transform: translateY(1px); }`.
- `CardIndicador.module.css`: soporte de `:active { transform: translateY(0); }` sobre hover elevado (`translateY(-2px)`).
- `SelectorDeAmbientes.module.css`: elevación sutil en hover (`translateY(-2px)`) y pulsación en click (`translateY(0)`).
- `AtajosDeDuracion.module.css`: pulsación física `:active { transform: translateY(1px); }`.
- `DisponibilidadPage.module.css`: pulsación física en tramos libres `:active:not(:disabled) { transform: translateY(1px); }`.
- **Accesibilidad de movimiento**: todas las microinteracciones cuentan con su bloque `@media (prefers-reduced-motion: reduce)` que resetea `transform: none !important; transition: none !important;`.

### (c) Jerarquía y Botones
- Verificada la existencia de una sola acción primaria destacada por vista (`variant="primary"`). Botones secundarios en contorno sobrio y destructivos en fondo error tenue.

### (d) Densidad de Tablas y Listas
- `TableList.module.css`: adición de resalte de fila `tbody tr:hover { background-color: var(--fondo-fila-alterna); }`.
- `TableList.jsx`: soporte del atributo `data-alineacion="derecha"` y tipografía `font-variant-numeric: tabular-nums` para columnas numéricas.
- `AmbientesPage.jsx`: configuración de columna `Capacidad` con alineación numérica a la derecha.

### (e) Inicio del Administrador con Criterio Bento
- `InicioAdministrador.jsx`: reordenamiento de módulos en orden de urgencia decisional:
  1. `RequierenDecision` (solicitudes pendientes con solapamientos).
  2. `AgendaDeHoy` (operativa en tiempo real con eje horario).
  3. `GrupoDeIndicadores` (resumen métrico institucional).
  4. `UsoYEstados` (distribución analítica de ambientes).

### (f) Microcopy Sobrio
- `messages.js` (`TEXTOS` únicamente): actualización de cadenas de texto informativas y de ayuda (`ayudaSoporte`, `noHayDatos`, `sinReservas`, `sinPendientes`, etc.). Los mensajes de validación `MENSAJES` y las reglas RN-01 a RN-07 se mantuvieron 100% inalterados.

### (g) Estados Vacíos Compactos
- `EstadoVacio.jsx` y `EstadoVacio.module.css`: reducción de dimensiones del SVG a 100x72 px base y creación de variante compacta (64x46 px) mediante prop `compacto={true}`. Espaciado vertical reducido a `--espacio-3` / `--espacio-2`.

### (h) Login Editorial
- `LoginPage.module.css`: ajuste de la grilla a `58fr 42fr` en desktop. Anulación completa de animaciones de tarjeta bajo `prefers-reduced-motion: reduce`.


---

## 5. Cifras Finales Medidas (Paso 4)

Todas las cifras fueron tomadas mediante comandos reales ejecutados sobre el sistema y están clasificadas como **Medida**.

| Métrica | Valor Base (Paso 0) | Valor Final Medido | Tipo | Comando de Medición | Fecha / Hora (Local) |
| :--- | :--- | :--- | :--- | :--- | :--- |
| **Pruebas unitarias frontend** | 1.304 pasadas (57 archivos) | **1.305 pasadas** (57 archivos, 0 fallos) | Medida | `npm --prefix frontend test -- --run` | 2026-11-07 16:27:33 -05:00 |
| **Peso JS (producción)** | 408,83 kB (gzip: 127,24 kB) | **409,15 kB** (gzip: **127,36 kB**) | Medida | `npm --prefix frontend run build` | 2026-11-07 16:27:40 -05:00 |
| **Peso CSS (producción)** | 80,60 kB (gzip: 13,71 kB) | **82,40 kB** (gzip: **13,95 kB**) | Medida | `npm --prefix frontend run build` | 2026-11-07 16:27:40 -05:00 |
| **Pruebas backend con BD viva** | 230 pasadas (0 omitidas) | **230 pasadas** (0 omitidas, 0 fallos) | Medida | `dotnet test backend/ReservaUPLA.sln` | 2026-11-07 16:29:30 -05:00 |
| **Pruebas de usabilidad (`node --test`)** | 19 pasadas (0 fallos) | **22 pasadas** (0 fallos) | Medida | `node --test tools/usabilidad/*.test.mjs tools/usabilidad/pruebas/*.test.mjs` | 2026-11-07 16:29:41 -05:00 |
| **Linters (ESLint y Prettier)** | 0 errores, 0 advertencias | **0 errores, 0 advertencias** | Medida | `npm --prefix frontend run lint` y `format:check` | 2026-11-07 16:24:07 -05:00 |
| **Accesibilidad final (`ETAPA=taste`)** | 0 axe, 0 contraste, 0 táctiles < 44 px | **0 axe, 0 contraste, 0 táctiles < 44 px, 0 foco, 0 scroll 188px, 0 reducida** | Medida | `$env:ETAPA="taste"; node tools/usabilidad/accesibilidad.mjs` | 2026-11-07 16:23:09 -05:00 |
| **Suite E2E completa (`npm run todo`)** | 9 de 9 fases OK (242 s) | **9 de 9 fases OK** (221 s, todo correcto) | Medida | `npm --prefix tools/e2e run todo` | 2026-11-07 16:33:31 -05:00 |

### Verificación de Metas Permanentes
- **Axe-core**: 0 violaciones en 87 estados analizados (43 escritorio + 44 móvil).
- **Contraste de tokens (WCAG 2.2 AA)**: 0 pares por debajo del umbral mínimo de 4.5:1 / 3.0:1.
- **Objetivos táctiles**: 0 controles interactivos menores de 44×44 px en los 44 estados móviles.
- **Teclado y foco**: 0 paradas sin foco visible; 0 paradas fuera de modales abiertos.
- **Reflujo y zoom 200% a 188 px**: 0 de 30 combinaciones con desbordamiento o scroll horizontal.
- **Movimiento reducido**: 0 animaciones infinitas activas bajo `prefers-reduced-motion: reduce`.
- **Recorte de texto**: 0 textos cortados o con elipsis CSS en disponibilidad a 1280, 375 y 188 px (`scrollWidth <= clientWidth`).
- **Auditoría Taste**: 0 fallos en las 3 comprobaciones medibles en navegador (equal edges en dashboard, duración sobria de transiciones y anulación de movimiento en login).

---

## 6. Bitácora de Defectos Resueltos (desde #94)

| # | Defecto o Discrepancia Detectada | Causa Raíz | Corrección Aplicada | Prueba que lo Cubre |
|---|---|---|---|---|
| **#94** | Desalineación de borde derecho entre cabecera institucional (`PageHeader`) y formularios en escritorio. | Falta de contención simétrica (`equal edges`) en `FormularioTarjeta`. | Adición de clase `.contenedorSimple` con `max-width: 760px` y centrado simétrico en `FormularioTarjeta.module.css`. | Comprobación T1 en `tools/usabilidad/taste-check.mjs` y `taste-check.test.mjs`. |
| **#95** | Falta de retroalimentación táctil física (`:active`) en botones, atajos de duración y tramos de disponibilidad. | Ausencia de microinteracción de pulsación rápida en los componentes interactivos. | Implementación de `:active:not(:disabled) { transform: translateY(1px); }` en `Button.module.css`, `AtajosDeDuracion.module.css` y `DisponibilidadPage.module.css`, con anulación estricta bajo `prefers-reduced-motion: reduce`. | Comprobación T2 en `taste-check.mjs`, `AtajosDeDuracion.test.jsx`. |
| **#96** | Tablas operativas densas sin feedback visual en hover y columnas de capacidad centradas sin alineación numérica tabular. | Falta de soporte de alineación a la derecha y resalte de fila en `TableList`. | Inclusión de `tbody tr:hover` con `--fondo-fila-alterna`, soporte de `data-alineacion="derecha"` y `font-variant-numeric: tabular-nums` en `TableList.jsx`, y configuración en `AmbientesPage.jsx`. | `npm --prefix frontend test -- --run` (57 archivos, 1.305 pruebas) y `npm run todo`. |
| **#97** | Ordenación del Inicio del Administrador subordinaba las solicitudes pendientes urgentes debajo de métricas históricas. | Estructura no alineada al principio Bento de priorización por urgencia decisional. | Reordenación de bloques en `InicioAdministrador.jsx`: 1) `RequierenDecision`, 2) `AgendaDeHoy`, 3) `GrupoDeIndicadores`, 4) `UsoYEstados`. | `DashboardPage.test.jsx` (103 pruebas pasadas) y `capturar-taste-final.mjs`. |
| **#98** | Error de sintaxis DOM en `page.evaluate` al utilizar pseudo-selectores propios de Playwright (`:has-text(...)`). | En evaluación interna del navegador, `document.querySelector` solo admite sintaxis estándar CSS W3C. | Sustitución por selectores estándar `section[aria-labelledby="..."]` y `section[aria-label="..."]` en `taste-check.mjs`. | `taste-check.test.mjs` y ejecución limpia de `ETAPA=taste node accesibilidad.mjs`. |

---

## 7. Resumen Ejecutivo de Cierre

### Qué Cambió por Rol
- **Administrador**:
  - *Inicio*: Orden Bento enfocado en la toma de decisiones (solicitudes pendientes que requieren atención inmediata en primer lugar, agenda operativa de hoy en tiempo real, métricas clave del sistema y análisis de uso).
  - *Gestión de Ambientes*: Columna «Capacidad» alineada a la derecha con cifras numéricas tabulares monoespaciadas y resalte sutil de fila bajo el cursor para escaneo ágil.
  - *Formularios*: Contenedor simétrico contenido a 760 px alineado con la cabecera institucional.
- **Solicitante**:
  - *Nueva Reserva*: Microinteracción física tangible al pulsar botones, atajos de duración y selector de ambientes, con elevación suave de 2 px en hover y retorno inmediato.
  - *Textos*: Microcopy conciso y directo, sin redundancias ni textos genéricos.
- **Responsable**:
  - *Inicio*: Visualización modular de agenda diaria y métricas de su ambiente con números tabulares y contraste estricto.
- **Todos los roles**:
  - *Disponibilidad*: Tramos libres interactivos con feedback táctil `:active translateY(1px)`, cero elipsis CSS y cero texto recortado en todas las resoluciones (1280, 375 y 188 px).
  - *Accesibilidad de movimiento*: Supresión total de transiciones y transformaciones activas cuando el usuario solicita reducción de movimiento (`prefers-reduced-motion: reduce`).
  - *Estados vacíos*: Ilustración institucional del edificio UPLA compacta (100x72 px base y 64x46 px en modo compacto), sin desplazar controles ni sobrecargar la pantalla.

### Decisiones Propias (Skills vs. Contrato Institucional)
1. **Adoptadas**:
   - *Equal edges*: Simetría estricta en formularios y rejillas de métricas.
   - *Microinteracciones tangibles*: Desplazamiento sutil `:active` de 1 px en controles primarios y secundarios.
   - *Alineación tabular y números tabulares (`ant`)*: Cifras numéricas a la derecha con `tabular-nums` y resalte hover de fila.
2. **Adaptadas**:
   - *Criterio Bento (`bento`)*: Adoptado como modelo mental de priorización por urgencia de decisión en el Inicio del Administrador, sin recurrir a tarjetas asimétricas ni gráficos decorativos fuera del MVP.
   - *Ilustración de estado vacío*: La skill desaconsejaba ilustraciones genéricas; en lugar de eliminar la identidad UPLA, se adaptó a un formato arquitectónico sobrio y compacto (100x72 y 64x46 px).
   - *Login editorial*: Ajustado a proporción 58/42 en escritorio, conservando la fotografía institucional del campus y el degradado marino de alto contraste.
3. **Rechazadas**:
   - *Tema oscuro / skill «enterprise»*: Rechazado por violación explícita del contrato institucional (fondo blanco `#F4F6FA` y paleta institucional).
   - *Animaciones de entrada y efectos de partículas*: Rechazados por contravenir la sobriedad institucional y el presupuesto de rendimiento.
   - *Modificación de reglas RN-01 a RN-07 o mensajes `MENSAJES`*: Rechazado tajantemente por contrato de negocio.

### Limitaciones Reales
- Las pruebas de `vitest` y `jsdom` evalúan estructura, eventos simulados, clases y atributos del DOM; las comprobaciones físicas de desbordamiento (`scrollWidth <= clientWidth`), foco visible real y contraste de renderizado se miden obligatoriamente sobre el navegador Chromium/Edge headless mediante `accesibilidad.mjs` y `playwright`.
- En disponibilidad, para la fecha de hoy, las horas transcurridas se presentan atenuadas conforme a RN-07 (no se permite reservar en el pasado); los tramos futuros interactivos activos se verifican exhaustivamente con reservas reales creadas en fecha futura (`2026-11-24`).

### Lo que NO se Hizo
- No se añadieron dependencias npm ni librerías externas en el frontend (peso JS 127,36 kB gzip < 150 kB; peso CSS 13,95 kB gzip < 20 kB).
- No se alteró ningún mensaje del objeto `MENSAJES` ni las reglas de negocio RN-01 a RN-07.
- No se crearon temas oscuros ni vistas alternativas fuera del alcance MVP.
