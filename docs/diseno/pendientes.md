# Pendientes y problemas con Stitch

## 1. Primer intento del login con prompt abreviado
Archivo: `v1/_intentos/01-login-intento-1-prompt-abreviado.png`.

El primer intento se hizo con un prompt abreviado y Stitch añadió contenido no pedido:
- Icono de puerta junto a "ReservaUPLA" (parece un logo) y el subtítulo "GESTIÓN DE AMBIENTES".
- Etiqueta "Sistema Institucional Activo".
- Párrafo y viñetas con "Notificaciones instantáneas" y "Disponibilidad en tiempo real".
- "Huancayo, Perú".
- Aviso azul que repetía el correo de ejemplo, y la etiqueta "Requerido".
- Pie con "Soporte Institucional", "Términos de Uso" y "Privacidad".
- Una "Oficina de Tecnologías de la Información de la UPLA" inventada.

Se usa como hallazgo de la evaluación (Nielsen N8 minimalismo; N2 correspondencia con el mundo real: no prometer funciones inexistentes).

Con el bloque de reglas "Muestra EXACTAMENTE…" el login y sus variantes salieron sin ningún elemento de esa lista, en v1 y en v2.

## 2. Decisiones tomadas al ejecutar (no estaban en el encargo)
- Menú de la Solicitante: solo "Reservas" y "Nueva reserva". Menú de la Responsable: solo "Mi ambiente". Se hizo para evidenciar "cada rol ve solo lo que puede usar"; el DESIGN.md solo define el menú de cinco opciones del Administrador.
- Nombres de ejemplo añadidos (el encargo solo daba Ana Torres y Luis Quispe): Carla Rojas (Administrador), Mario Huamán y Rosa Chávez (Responsables). En `v1/01d-login-carga.png` Stitch escribió por su cuenta el correo "carlos.mendoza@upla.edu.pe".
- Pantalla 7: el encargo no lista botones del formulario; se usaron "Cancelar" y "Guardar usuario" por analogía con la pantalla 6.
- Historiales: se añadieron eventos de ejemplo ("Reserva rechazada por Carla Rojas, 03/11/2026, 11:40" y "Reserva aprobada por Carla Rojas, 03/11/2026, 12:05") para que el historial sea coherente con el estado.
- `v2/05e-detalle-modal-cancelar.png`: el botón de confirmar es primario azul ("Sí, cancelar reserva"), porque `componentes.md` reserva el rojo sólido para "Sí, rechazar".
- `v2/04c`, `v2/05*`: se mostraron datos de la reserva de ejemplo (Laboratorio de Cómputo 2, 03/11/2026 y 05/11/2026, 10:00 – 12:00).

## 3. Lo que Stitch no respetó o no se pudo hacer en la v2
- **`09-componentes.png` es parcial.** Sí muestra la lista abierta de horas (07:00 a 09:00 como muestra), los 4 estados de campos y botones, el interruptor Activo/Inactivo y las 4 insignias. No se ve la lista de horas de fin filtrada ni los grupos de botones (primario a la derecha, "Cancelar reserva" separado, apilado en móvil), y la quinta tarjeta del CardIndicador sale cortada ("Laboratorio de Cóm…"). Los tres intentos de corregirla (una regeneración completa, un reintento y una edición con `edit_screens`) agotaron el tiempo de Stitch y no devolvieron ninguna pantalla. Las pantallas v2 llevan estas reglas en el prompt, no en la hoja.
- **Tiempo de espera de Stitch.** Hubo generaciones que agotaron el tiempo sin devolver identificador ni imagen (la hoja anterior y tres pantallas del detalle). `list_screens` no lista las pantallas generadas, así que no se pudieron recuperar; se repitieron las llamadas con prompts algo más cortos. No se conserva ninguna imagen de esos intentos.
- **`01c-login-errores-campo.png` parcial.** Tras regenerarla una vez, el error "Ingresa tu contraseña." sigue sin icono de error (el de "Ingresa tu correo institucional." sí lo tiene). La primera versión (`_intentos/01c-login-errores-campo-intento-1.png`) tenía icono de contorno y panel gris.
- **Disposición del detalle (E4, parcial).** `05` a `05g` repiten los mismos bloques, pero Stitch los distribuye distinto y alterna MAYÚSCULAS y minúscula en las etiquetas. Diferencias reales entre `05` y `05f`: el contenido empieza en otra posición horizontal; los datos van en tres columnas en `05` y en dos en `05f`; "Volver a Reservas" lleva flecha en `05` y no en `05f`.
- **Menú lateral (G1, parcial).** El ítem activo es siempre azul sólido, pero el relleno del menú lateral de `04-nueva-reserva.png` difiere del de `05-detalle-reserva.png`.
- **Estado final de los 32 hallazgos:** 27 cerrados, 4 parciales (N1, E4, U3, G1) y 1 abierto (U2). Las reglas de código que los cierran están en `reglas-para-programar.md`.
- **`05g-detalle-aprobada.png`.** Stitch generó un sistema de diseño nuevo ("Institutional Booking Desk", `assets/bfb5ec1f7d054d28867b252739e7ad8a`) en esa pantalla en lugar de usar el indicado; el fondo derivado es `#f8f9fb`. Se ve casi igual, pero no es el sistema ReservaUPLA.
- **`04f-nueva-reserva-ambientes.png`.** El campo abierto muestra "Seleccione un ambiente" en vez de "Selecciona…".
- **Horas de fin (RN-03).** Ninguna imagen v2 muestra la lista de horas de fin posteriores a la de inicio, ni la lista completa hasta 22:00 (RN-04).
- **Estado "Inactivo" del interruptor.** Solo se ve apagado en `09-componentes.png`.
- **Contraseña inicial.** No se conoce la política de contraseñas; no se inventaron requisitos (`07b`). Queda abierto el hallazgo U2.
- **Íconos de las insignias de Usuarios.** Activo e Inactivo usan un punto en vez de una marca; en el resto de las tablas se usa un icono.

## 4. No se pudo comprobar en imágenes estáticas
- Foco por teclado: solo se ve en `01e`, `01h`, `02d` y `04g`; en el resto no hay imagen con foco.
- El menú desplegable móvil se muestra siempre cerrado.
- Contraste exacto de los botones deshabilitados de `05c` (no se midió).
- Las medidas de 44 px de los controles (se tomaron del prompt, no de una medición de la imagen).

## 5. Sistema de diseño en Stitch
- Poppins no existe en Stitch; se usa Montserrat.
- Stitch deriva sus propios colores a partir de la semilla (`primary` interno `#004b81`, fondo `#fbf9f8`); el fondo `#F3F4F6` no es un parámetro configurable y se pide en el prompt de cada pantalla.
- El dominio de ejemplo del correo (`@upla.edu.pe`) debe confirmarse con el formato real de la universidad.
