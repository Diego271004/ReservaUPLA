# Cambios de la v1 a la v2

Estado comprobado mirando la imagen v2. **Cerrado**: la corrección se ve y cumple `componentes.md`. **Parcial**: se ve en parte. **Abierto**: no se pudo aplicar. Principios con la numeración de `evaluacion-v1.md` (Nielsen N1–N9, Shneiderman S1–S8).

| Id | Pantalla | Antes (v1) | Después (v2) | Estado | Principio |
|---|---|---|---|---|---|
| L1 | Login | `v1/01-login.png` | `v2/01g-login-soporte.png`: aviso informativo "Comunícate con Soporte TI de la universidad" bajo el enlace | Cerrado | N9, S3 |
| L2 | Login, carga | `v1/01d-login-carga.png` | `v2/01d-login-carga.png`: enlace "Cancelar" bajo el botón | Cerrado | N3, S7 |
| D1 | Dashboard | `v1/02-dashboard.png` | `v2/02c-dashboard-modal-aprobar.png`: modal con ambiente, solicitante y horario | Cerrado | N5, S5, S6 |
| D2 | Dashboard | `v1/02-dashboard.png` ("48" más abajo que los demás) | `v2/02-dashboard.png`: los cinco números en la misma línea y tarjetas del mismo alto | Cerrado | N4, S1 |
| D3 | Dashboard | `v1/02-dashboard.png`, `02b` | `v2/02-dashboard.png` y `02b`: "Mostrando 5 de 7" (3 de 7 en móvil) y enlace "Ver todas" | Cerrado | N1 |
| D4 | Dashboard y Reservas | `v1/02` (botón) y `v1/03` (enlace) | `v2/02` y `v2/03`: "Ver detalle" siempre es botón secundario con borde | Cerrado | N4, S1 |
| D5 | Dashboard móvil | `v1/02b-dashboard-movil.png` | `v2/02b-dashboard-movil.png`: "Aprobar" arriba, "Rechazar" y "Ver detalle" debajo, separados | Cerrado | N5, S5 |
| R1 | Reservas | `v1/03-reservas.png` ("mm/dd/yyyy") | `v2/03-reservas.png`: "dd/mm/aaaa" con icono de calendario; igual en `03b` | Cerrado | N2, N4 |
| R2 | Reservas | `v1/03b-reservas-vacio.png` | `v2/03b-reservas-vacio.png`: filtros y botones en la misma fila que en `03` | Cerrado | N4, S1 |
| R3 | Reservas vacío | `v1/03b-reservas-vacio.png` | `v2/03b-reservas-vacio.png`: botón "Limpiar filtros" dentro del bloque vacío | Cerrado | N9 |
| R4 | Reservas | `v1/03-reservas.png` | `v2/03-reservas.png`: "Anterior" deshabilitado en la página 1 | Cerrado | N5, N1 |
| N1 | Nueva reserva | `v1/04-nueva-reserva.png` | `v2/04-nueva-reserva.png` y `04g`: iconos de calendario y reloj en fecha y horas. La lista cerrada de horas solo se ve en `09-componentes.png` (inicio); no hay imagen que muestre la hora de fin limitada | Parcial | N5, S5 |
| N2 | Nueva reserva móvil | `v1/04d-nueva-reserva-movil.png` (texto cortado) | `v2/04d-nueva-reserva-movil.png`: el Ambiente se parte en dos líneas y se lee completo | Cerrado | N6, S8 |
| N3 | Nueva reserva | `v1/04b-nueva-reserva-errores.png` | `v2/04b` (solo "Ingresa el motivo de la reserva.") y `v2/04e` (solo el conflicto, con horas válidas) | Cerrado | N9, S3 |
| N4 | Nueva reserva cierre | `v1/04c-nueva-reserva-exito.png` | `v2/04c-nueva-reserva-exito.png`: resumen (ambiente, fecha, horario) e insignia "Pendiente" | Cerrado | S4, S8 |
| N5 | Nueva reserva móvil | `v1/04d` | `v2/04d`: móvil con el primario arriba (regla de `componentes.md`); escritorio con el primario a la derecha | Cerrado | N4 |
| E1 | Detalle | `v1/05-detalle-reserva.png` (primario a la izquierda) | `v2/05-detalle-reserva.png`: "Aprobar" en el extremo derecho | Cerrado | N4, S1 |
| E2 | Detalle | `v1/05, 05b, 05c` | `v2/05` a `05g`: enlace "Volver a Reservas" sobre el título | Cerrado | N3, S7 |
| E3 | Detalle | `v1/05-detalle-reserva.png` | `v2/05-detalle-reserva.png`: "Rechazar" de contorno rojo; "Cancelar reserva" separado a la izquierda | Cerrado | N2, N5 |
| E4 | Detalle (variantes) | `v1/05, 05b, 05c` | `v2/05` a `05g`: mismos bloques (enlace, tarjeta, Historial, acciones), pero la disposición cambia. Diferencias reales entre `05` y `05f`: el contenido empieza en otra posición horizontal; los datos van en tres columnas en `05` y en dos en `05f`; "Volver a Reservas" lleva flecha en `05` y no en `05f`. Además, `05c`/`05d`/`05e` usan dos columnas, `05g` una lista, y las etiquetas varían entre MAYÚSCULAS y minúscula | Parcial | N4, S1 |
| E5 | Detalle | `v1/05b` (solo aprobar) | `v2/05d-detalle-modal-rechazar.png` ("Sí, rechazar" rojo sólido) y `v2/05e-detalle-modal-cancelar.png`, ambos con resumen | Cerrado | N5, S5, S6 |
| E6 | Detalle Rechazada | `v1/05c-detalle-rechazada.png` | `v2/05c-detalle-rechazada.png`: aviso informativo azul encima de los botones deshabilitados | Cerrado | N1, S3 |
| A1 | Ambientes | `v1/06-ambientes.png` ("Edita" cortado) | `v2/06-ambientes.png`: "Editar" completo | Cerrado | N9, eficacia |
| A2 | Tablas | `v1/06` (MAYÚSCULAS) | `v2/02, 03, 06, 07, 08`: encabezados con mayúscula inicial | Cerrado | N4, S1 |
| A3 | Ambientes | `v1/06-ambientes.png` | `v2/06-ambientes.png`: "En mantenimiento" en una línea | Cerrado | N4, N8 |
| A4 | Ambientes y Usuarios | `v1/06b`, `v1/07b` (selects vacíos) | `v2/06b`, `07b`: "Selecciona…" con flecha; `v2/06d` y `07d`: lista abierta | Cerrado | N6, N5 |
| A5 | Ambientes | `v1/06b` | `v2/06c-ambientes-errores.png`: "Ya existe un ambiente con ese nombre." y "Ingresa la capacidad como un número, por ejemplo 30." | Cerrado | N9, S3 |
| U1 | Usuarios | `v1/07b-usuarios-formulario.png` | `v2/07b` y `07c`: interruptor junto a su etiqueta con el texto "Activo". El estado apagado ("Inactivo") solo se ve en `09-componentes.png` | Cerrado | N4, S2 |
| U2 | Usuarios | `v1/07b` | `v2/07b`: sin requisitos de la contraseña inicial, porque no se conoce la política | Abierto | N6, N5 |
| U3 | Iconos de error | `v1/07c` (contorno) y `v1/04b` (relleno) | Círculo relleno con exclamación en `01b`, `04b`, `04e`, `06c`, `07c` y en el primer error de `01c`; en `01c` el segundo error ("Ingresa tu contraseña.") salió sin icono | Parcial | N4, S1 |
| G1 | Menú lateral | `v1/02`–`08` (seis estilos de ítem activo) | `v2/02` a `08`: ítem activo siempre con fondo sólido azul `#0063A8` y texto blanco. Pero el relleno del menú lateral de `04-nueva-reserva.png` difiere del de `05-detalle-reserva.png` | Parcial | N4, S1 |
| G2 | Insignias | `v1/03, 06, 07, 08` | `v2/03, 04c, 05, 06, 07, 08`: cápsula con icono y texto en una línea (en Usuarios el icono es un punto, no una marca) | Cerrado | N4, S1 |

## Cierre

| Estado | Cantidad |
|---|---|
| Cerrado | 27 |
| Parcial | 4 (N1, E4, U3, G1) |
| Abierto | 1 (U2) |
| **Total** | **32** |

L0 (intento 1 del login) se cerró en la v1: `v1/01-login.png` ya no trae los extras.
