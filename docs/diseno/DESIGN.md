# ReservaUPLA — Sistema de diseño

Sistema web de reservas de ambientes universitarios (laboratorios, auditorios y salas) de la Universidad Peruana Los Andes. Todo el texto de la interfaz va en español. Solo se usa el texto "ReservaUPLA": sin logo oficial y sin fotos de personas.

## Estilo
Institucional y limpio, azul y blanco, minimalista, coherente con la web de la UPLA. Una sola tarea principal por pantalla.

## Paleta
| Uso | Color |
|---|---|
| Primario (botón primario y enlaces) | `#0063A8` |
| Azul marino (menú lateral, títulos, panel del login) | `#1F365C` |
| Azul de títulos | `#1E73BE` |
| Celeste (solo foco, bordes y decoración; nunca texto) | `#3696EA` |
| Texto | `#1F365C` y `#4F4F4F` |
| Fondo de página | `#F3F4F6` |
| Superficies | `#FFFFFF` |
| Dorado (solo acento, con texto marino encima; nunca texto sobre blanco) | `#EAA658` |

### Colores de estado (independientes de la marca)
| Estado | Color |
|---|---|
| Error | `#B91C1C` |
| Éxito | `#166534` |
| Aviso | `#92400E` |
| Información | `#1E3A8A` |

Insignias de la reserva, siempre con icono y texto: Pendiente (ámbar), Aprobada (verde), Rechazada (rojo), Cancelada (gris).

## Tipografía
Montserrat (la web de la UPLA usa Poppins y Montserrat; Stitch no ofrece Poppins, por eso se usa Montserrat). Texto de campos de 16 px. Controles de al menos 44 px de alto. Foco visible con contorno `#3696EA` de 3 px. Contraste AA.

## Navegación
- Escritorio: menú lateral con Dashboard, Reservas, Nueva reserva, Ambientes y Usuarios (página actual resaltada), nombre y rol de la persona arriba y "Cerrar sesión" abajo.
- Móvil: menú desplegable, una sola columna, tablas convertidas en tarjetas apiladas, sin desplazamiento horizontal.

## Componentes reutilizables (idénticos en todas las pantallas)
TextInput, SelectInput, DateInput, TimeInput, Button, AlertMessage, ModalConfirmacion, TableList, CardIndicador.

## Reglas para todas las pantallas
- Cada campo con etiqueta siempre visible y ayuda con ejemplo si hace falta.
- Errores debajo del campo con icono, texto y borde, diciendo qué corregir.
- Toda acción irreversible (aprobar, rechazar, cancelar) pide confirmación en un modal con un resumen.
- Siempre hay forma de volver o cancelar.
- Los botones con acciones largas muestran carga.
- Cada acción termina con un mensaje claro de éxito o error.
- Un solo estilo de botón primario, de error, de tarjeta y de tabla; el botón primario siempre en el mismo lugar.

## Datos de ejemplo
Ambientes: "Laboratorio de Cómputo 2", "Auditorio Principal", "Sala de Reuniones A". Personas: "Ana Torres", "Luis Quispe". Fechas de noviembre de 2026. Horarios como "10:00 – 12:00". Nada de lorem ipsum.
