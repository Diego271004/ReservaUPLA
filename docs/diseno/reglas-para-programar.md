# Reglas para programar

Una fila por hallazgo parcial o abierto de `cambios-v1-a-v2.md`. La decisión de código es la que lo cierra; la aplica el programador.

| Id | Decisión de código | Archivo v2 que lo evidencia o lo deja pendiente |
|---|---|---|
| N1 | `TimeInput` como lista cerrada de 07:00 a 22:00 cada 30 min. Las opciones de fin son solo posteriores al inicio. Prueba automatizada que lo demuestre (RN-03, RN-04). | `v2/09-componentes.png` (lista de inicio, evidencia parcial); `v2/04-nueva-reserva.png` (iconos y ayuda "Horario permitido"). Pendiente: la lista de fin filtrada no se ve en ninguna imagen. |
| E4 | Un único componente `DetalleReserva` para todos los estados y roles. Las variantes solo cambian los botones y el `AlertMessage`. | `v2/05-detalle-reserva.png` frente a `v2/05f-detalle-solicitante.png` (tres columnas frente a dos, flecha en "Volver a Reservas", posición horizontal). Pendiente. |
| U3 | Un único componente de icono de error (círculo relleno con exclamación), usado por `AlertMessage` y por todos los campos. | `v2/01c-login-errores-campo.png` (el error "Ingresa tu contraseña." sale sin icono). Pendiente. |
| G1 | Un único layout con menú lateral compartido; ancho, relleno e ítem activo definidos una sola vez. | `v2/04-nueva-reserva.png` frente a `v2/05-detalle-reserva.png` (relleno distinto). Pendiente. |
| CardIndicador | El texto largo parte en dos líneas; el alto de las cinco tarjetas es igual. | `v2/09-componentes.png` (quinta tarjeta cortada: "Laboratorio de Cóm…"). Pendiente. `v2/02-dashboard.png` sí lo cumple. |
| U2 | La política de contraseña inicial se decide en la fase de validaciones; hasta entonces el campo no muestra requisitos. | `v2/07b-usuarios-formulario.png` (campo sin requisitos). Abierto. |
