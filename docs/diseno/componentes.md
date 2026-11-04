# Especificación de componentes (v2)

Reglas del planificador para los nueve componentes: TextInput, SelectInput, DateInput, TimeInput, Button, AlertMessage, ModalConfirmacion, TableList y CardIndicador. Se aplican en todas las pantallas de `docs/diseno/v2/`. La referencia visual es `v1/02-dashboard.png` (menú lateral, tarjetas y tabla) y, para el resto de estados, `v2/09-componentes.png`.

## Navegación
- **Menú lateral:** un solo ancho (el del Dashboard). Ítem activo: fondo sólido azul `#0063A8`, texto blanco, sin franjas ni transparencias. Igual en todas las pantallas.

## TableList y CardIndicador
- **Encabezados de tabla:** negrita, `#1F365C`, con mayúscula inicial (no TODO EN MAYÚSCULAS). Un solo estilo.
- **Insignias de estado:** cápsula con icono de 16 px y texto en una sola línea (ancho suficiente); mismo tamaño y forma en todas las tablas.
- **CardIndicador:** el número va alineado a la misma línea base en las cinco tarjetas; la descripción va en una sola línea o se reserva el mismo alto.
- **Todas las tablas caben sin desbordarse:** si no caben las columnas, se reducen columnas o se ajustan anchos para que "Acciones" se vea completo.

## Button
- Un grupo de acciones tiene siempre el botón primario en el **extremo derecho** en escritorio. En móvil los botones se apilan a ancho completo con el primario **arriba** y una separación clara entre botones.
- **"Rechazar":** botón de contorno rojo en listas y detalle. Solo el botón de confirmar del modal ("Sí, rechazar") es rojo sólido.
- **"Cancelar reserva":** botón secundario separado del grupo Aprobar/Rechazar.
- **"Ver detalle":** botón secundario con borde, el mismo en todas las tablas.

## Campos de formulario
- **DateInput:** formato dd/mm/aaaa con icono de calendario.
- **TimeInput:** lista cerrada de 07:00 a 22:00 cada 30 minutos, con icono de reloj. La hora de fin solo ofrece horas posteriores a la de inicio.
- **SelectInput:** muestra "Selecciona…" cuando está vacío y flecha visible; el texto se parte en dos líneas en móvil en vez de cortarse.
- **Interruptor "Activo":** junto a su etiqueta, con el texto "Activo" / "Inactivo".

## Estados comunes
- **Icono de error:** círculo relleno con exclamación, el mismo en AlertMessage y en los campos.
- **Foco por teclado:** contorno `#3696EA` de 3 px en todos los controles.
