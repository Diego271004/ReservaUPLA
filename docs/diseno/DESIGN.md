# ReservaUPLA — Sistema de diseño

Sistema web de reservas de ambientes universitarios (laboratorios, auditorios y salas) de la Universidad Peruana Los Andes. Todo el texto de la interfaz va en español con voz activa en segunda persona.

## Estilo
Institucional y limpio, azul marino y blanco, minimalista, coherente con la web e intranet de la UPLA. Una sola tarea principal por pantalla.

## Paleta
| Uso | Color | Token |
|---|---|---|
| Primario (botón primario y enlaces) | `#0063A8` | `--color-primario` |
| Azul marino (menú lateral, títulos, cabecera de login) | `#1F365C` | `--color-marino` |
| Azul de títulos | `#1E73BE` | `--color-titulo` |
| Celeste (solo decoración; nunca texto ni foco) | `#3696EA` | `--color-celeste` |
| Anillo de foco | `#1E73BE` (blanco `#FFFFFF` sobre fondo marino) | `--color-foco`, `--color-foco-sobre-oscuro` |
| Texto principal | `#1F365C` y `#4F4F4F` | `--color-texto`, `--color-texto-suave` |
| Fondo de página | `#F4F6FA` | `--color-fondo` |
| Superficies y tarjetas | `#FFFFFF` | `--color-superficie` |
| Dorado (solo acento institucional; nunca texto) | `#EAA658` | `--color-dorado` |

### Colores de estado (independientes de la marca)
| Estado | Color de texto | Fondo de estado | Tokens |
|---|---|---|---|
| Error | `#B91C1C` | `#FDF2F2` | `--color-error`, `--fondo-error` |
| Éxito | `#166534` | `#EFFAF3` | `--color-exito`, `--fondo-exito` |
| Aviso | `#92400E` | `#FEF8E7` | `--color-aviso`, `--fondo-aviso` |
| Información | `#1E3A8A` | `#EEF4FD` | `--color-info`, `--fondo-info` |

Insignias de la reserva, siempre con icono y texto: Pendiente (ámbar), Aprobada (verde), Rechazada (rojo), Cancelada (gris).

## Tipografía
Títulos en **Poppins SemiBold** y texto en **Montserrat**, como la web institucional de la UPLA. Ambas autoalojadas localmente con `@fontsource` en subset `latin` exclusivamente para los pesos usados (sin CDNs externas). Texto de campos de 16 px para evitar zoom indeseado en dispositivos iOS. Controles de al menos 44 px de alto (48 px en el Login). Foco visible con contorno `#1E73BE` de 3 px (`#FFFFFF` sobre el menú marino). Contraste AA verificado en el 100% de combinaciones.

### Escala tipográfica formal de 4 niveles
| Nivel | Token CSS | Tamaño | Peso / Familia | Aplicación |
| :--- | :--- | :--- | :--- | :--- |
| **1. Título de página** | `--tipo-titulo-pagina` | `1.5rem` (24 px) | Poppins 600 | Encabezado principal `h1` en cabeceras de página |
| **2. Título de sección** | `--tipo-seccion` | `1.125rem` (18 px) | Poppins 600 | Títulos `h2` de secciones, tarjetas principales y modales |
| **3. Etiqueta / Control** | `--tipo-etiqueta` | `0.875rem` (14 px) | Montserrat 600 | Etiquetas de campos, cabeceras de tabla, botones |
| **4. Cuerpo de texto** | `--tipo-cuerpo` | `1rem` (16 px) | Montserrat 400/500 | Párrafos, campos de formulario ($\ge 16$ px sin zoom), celdas |

## Decisiones de diseño frente al Stitch de referencia
Stitch sirvió como borrador visual de exploración, pero se aplicaron decisiones de ingeniería y accesibilidad superiores cuando Stitch chocaba con el contrato del proyecto:
1. **Tipografía institucional**: Stitch sugería tipografías genéricas de CDN (Inter/Roboto). Se reemplazaron por Poppins SemiBold y Montserrat locales con cero peticiones a servidores de terceros.
2. **Anillo de foco de alto contraste**: Stitch sugería `#3696EA` (contraste insuficiente de 2.84:1 sobre fondos grises). Se adoptó `#1E73BE` de 3 px con contraste de 4.94:1 sobre blanco y 4.57:1 sobre fondo de página, y blanco `#FFFFFF` (12.07:1) sobre el menú marino.
3. **Selección de ambiente táctil y accesible**: Stitch empleaba un `<select>` tradicional de difícil exploración. Se diseñó un grupo de tarjetas seleccionables (`role="radiogroup"`) navegable con flechas y tecla Espacio, mostrando capacidad, ubicación, avatar del responsable y estado de mantenimiento bloqueado.
4. **Línea de tiempo diaria sin componentes desmesurados**: Frente a la propuesta de Stitch de calendarios mensuales sobrecargados fuera del MVP, se construyó una línea de tiempo diaria con carriles de solapamiento legibles, leyenda compacta y modal accesible.
5. **Contadores de caracteres y validación reactiva**: Formularios con contadores `X de Y caracteres` conectados en vivo vía `aria-describedby` y requisitos de contraseña visibles de inmediato.
6. **Barra de resumen adherida en móvil**: Para el flujo de reserva en dispositivos móviles, se implementó una barra adherida sobre el botón de envío que resume ambiente, fecha y horas sin tapar controles ni requerir desplazamientos continuos.
7. **Microcopy exacto y estandarizado**: Se erradicaron verbos ambiguos («Guardar», «Aceptar», «Cancelar» para salir). Cada acción emplea su verbo unívoco: «Registrar X», «Nuevo X», «Volver», «Limpiar formulario» y «Cancelar reserva».
8. **Refinamiento Taste (Microinteracciones tangibles, Bento y Densidad Tabular)**:
   - **Equal edges**: Guías de alineación unificadas en paneles, formularios y cabeceras (`FormularioTarjeta` acotado a 760 px alineado con la guía institucional). Grilla estricta de 4 columnas en desktop y 2 en tablet en métricas, erradicando huecos asimétricos.
   - **Microinteracciones sobrias**: Pulsación táctil física `:active` (`translateY(1px)`) en botones primarios, secundarios, tramos libres y atajos; elevación de hover $\le 2$ px; anulación total con `@media (prefers-reduced-motion: reduce)`.
   - **Ordenación Bento por urgencia**: En el Inicio del Administrador, jerarquía estricta: primero lo que requiere decisión urgente, luego la agenda operativa en tiempo real, seguido de las métricas clave y el análisis por ambiente.
   - **Densidad tabular de alta legibilidad**: Celdas numéricas alineadas a la derecha con `font-variant-numeric: tabular-nums` y resalte interactivo sutil de fila bajo el cursor (`--fondo-fila-alterna`).
   - **Proporción de login editorial**: Ajuste a proporción 58% (visual institucional) / 42% (formulario) con tarjeta contenida y sin animaciones infinitas.
   - **Estados vacíos compactos**: Silueta de edificio UPLA escalada a 100x72 px base y 64x46 px en modo compacto con espaciado vertical moderado.
