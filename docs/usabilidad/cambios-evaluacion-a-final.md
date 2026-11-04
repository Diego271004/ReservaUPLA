# Cambios de la evaluación al estado final (Fase 8, paso 5)

Cada hallazgo de `evaluacion-sistema.md` con su captura **antes** (`docs/evidencias/fase8/antes/`) y su captura **después** (`docs/evidencias/fase8/despues/`). El estado se decidió **mirando la imagen nueva** o, cuando el hallazgo es una medida que ninguna imagen puede mostrar (contraste, zoom, movimiento, tamaño de los toques), con la medición de `docs/evidencias/fase8-accesibilidad.txt`; en ese caso la fila lo dice. Cada corrección nació de una prueba en rojo (bitácora, defectos 26 a 37).

| Id | Antes (captura) | Después (captura) | Estado | Principio |
|---|---|---|---|---|
| **H01** | [50-dashboard-en-construccion](../evidencias/fase8/antes/50-dashboard-en-construccion-escritorio.png) | [03-dashboard-tras-aprobar](../evidencias/fase9/03-dashboard-tras-aprobar-escritorio.png) | **Cerrado (Fase 9)**: la lista de Reservas y el Dashboard existen; «Volver a Reservas» conserva filtro y página. El e2e `fase9.mjs` lo recorre. | N1, N3, N6 |
| **H02** | [41-mi-ambiente](../evidencias/fase8/antes/41-mi-ambiente-en-construccion-escritorio.png) | [05-mi-ambiente](../evidencias/fase9/05-mi-ambiente-escritorio.png) | **Cerrado (Fase 9)** con la salvedad H29 (varios ambientes). | N1, N2 |
| **H03** | [28-modal-cancelar](../evidencias/fase8/antes/28-detalle-modal-cancelar-escritorio.png) | [34-modal-rechazar](../evidencias/fase8/despues/34-detalle-modal-rechazar-escritorio.png) | **Cerrado**: la imagen nueva muestra «Esta acción no se puede deshacer.» en el modal de rechazar (el de cancelar lleva la misma advertencia, comprobada por prueba). | N5, N9, S6 |
| **H04** | [20-nueva-reserva-vacia](../evidencias/fase8/antes/20-nueva-reserva-vacia-escritorio.png) | [20-nueva-reserva-vacia](../evidencias/fase8/despues/20-nueva-reserva-vacia-escritorio.png) | **Cerrado**: los campos tienen un borde bien visible (medición: 3,9:1; antes 1,47:1). | N6, NS, S2 |
| **H05** | (sin captura: es una medida a 320 px) | (sin captura) | **Cerrado, comprobado con la medición**: a 320 px el login mide 320 px (antes 346); 0 de 7 pantallas desbordan a 320 px. | S2, WCAG 1.4.10 |
| **H06** | [41-mi-ambiente](../evidencias/fase8/antes/41-mi-ambiente-en-construccion-escritorio.png) | [41-mi-ambiente](../evidencias/fase8/despues/41-mi-ambiente-en-construccion-escritorio.png) | **Cerrado**: la imagen nueva dice «Todavía no está disponible. Estará lista en una próxima versión.» | N2 |
| **H07** | [26-cierre](../evidencias/fase8/antes/26-nueva-reserva-cierre-movil.png) | [26-cierre](../evidencias/fase8/despues/26-nueva-reserva-cierre-movil.png) | **Cerrado**: los botones están separados, apilados con «Registrar otra reserva» arriba, y ya no se parte el texto. | N4, S1, NS |
| **H08** | [24-conflicto](../evidencias/fase8/antes/24-nueva-reserva-conflicto-movil.png) | [24-conflicto](../evidencias/fase8/despues/24-nueva-reserva-conflicto-movil.png) | **Cerrado**: el aviso rojo aparece justo debajo de las horas, antes de Motivo. | N1, NM |
| **H09** | [04-login-verificando](../evidencias/fase8/antes/04-login-verificando-escritorio.png) | [04-login-verificando](../evidencias/fase8/despues/04-login-verificando-escritorio.png) | **Cerrado, comprobado con la medición**: con movimiento reducido quedan 0 animaciones (antes 1 infinita); una captura no puede mostrar movimiento. | S2, WCAG 2.3.3 |
| **H10** | [01-login-vacio](../evidencias/fase8/antes/01-login-vacio-movil.png) | [01-login-vacio](../evidencias/fase8/despues/01-login-vacio-movil.png) | **Cerrado, comprobado con la medición**: 0 elementos menores de 44 px en los 35 estados móviles (antes 20 elementos en 17 estados). | S2, NA |
| **H11** | [51-sin-permiso](../evidencias/fase8/antes/51-sin-permiso-movil.png) | [51-sin-permiso](../evidencias/fase8/despues/51-sin-permiso-movil.png) | **Cerrado**: «Volver al inicio» usa el estilo de enlace del sistema (azul, negrita, sin subrayado). | N4, S1 |
| **H12** | [20-nueva-reserva-vacia](../evidencias/fase8/antes/20-nueva-reserva-vacia-escritorio.png) | [24-conflicto](../evidencias/fase8/despues/24-nueva-reserva-conflicto-movil.png) | **Cerrado**: bajo Fecha aparece «Formato dd/mm/aaaa (por ejemplo, 05/11/2026).» El icono sigue sin abrir un selector; la ayuda lo aclara. | NS, NA, N6 |
| **H13** | [15-usuarios](../evidencias/fase8/antes/15-usuarios-listado-movil.png) | [15-usuarios](../evidencias/fase8/despues/15-usuarios-listado-movil.png) | **Cerrado**: una banda del color de la página separa cada registro. | N8, S8 |
| **H14** | [33-conflicto-al-aprobar](../evidencias/fase8/antes/33-detalle-conflicto-al-aprobar-movil.png) | [33-conflicto-al-aprobar](../evidencias/fase8/despues/33-detalle-conflicto-al-aprobar-movil.png) | **Abierto, severidad 1 (decisión del planificador: no se cambia).** | N9 |
| **H15** | [10-ambientes](../evidencias/fase8/antes/10-ambientes-listado-escritorio.png) | [10-ambientes](../evidencias/fase8/despues/10-ambientes-listado-escritorio.png) | **Abierto**: fuera del alcance acordado de las Fases 5 y 6 (sin «Editar»). | N3, S6 |
| **H16** | [01-login-vacio](../evidencias/fase8/antes/01-login-vacio-escritorio.png) | [01-login-vacio](../evidencias/fase8/despues/01-login-vacio-escritorio.png) | **Abierto como limitación (decisión del planificador):** texto genérico, sin datos de contacto inventados. | N9 |
| **H17** | [18-contraseña](../evidencias/fase8/antes/18-usuario-contrasena-requisitos-movil.png) | [18-contraseña](../evidencias/fase8/despues/18-usuario-contrasena-requisitos-movil.png) | **Cerrado**: con el error ya no se repite la ayuda; queda solo el mensaje con los requisitos. | N8 |
| **H18** | (sin captura: es una medida de contraste) | (sin captura) | **Cerrado, comprobado con la medición** (`fase8-contraste-foco.txt`): anillo `#1E73BE`, 4,49:1 sobre el gris (antes 2,84:1); blanco sobre el menú marino. | N1, WCAG 1.4.11 |
| **H19** | (sin captura) | (sin captura) | **Abierto, exento por WCAG (decisión del planificador)**: se queda en 4,16:1 y las mediciones lo marcan EXENTO. | WCAG 1.4.3 |
| **H20** | (sin captura: es una medida a 188 px) | (sin captura) | **Parcial, comprobado con la medición**: de 7 pantallas que desbordaban (por 50 a 158 px) quedan 3 (login 213 px, Nueva reserva 193 px y Registrar usuario 237 px, en 188 px). A 320 px, que es lo que exige WCAG, ninguna. | S2 |
| **H21** | [26-cierre](../evidencias/fase8/antes/26-nueva-reserva-cierre-escritorio.png) | [26-cierre](../evidencias/fase8/despues/26-nueva-reserva-cierre-escritorio.png) | **Abierto, justificado**: el título sigue siendo «Nueva reserva»; el mensaje verde da el cierre. | N1, NMC |
| **H22** | [51-sin-permiso](../evidencias/fase8/antes/51-sin-permiso-movil.png) | [51-sin-permiso](../evidencias/fase8/despues/51-sin-permiso-movil.png) | **Abierto, justificado**: es el mismo mensaje que devuelve la API en 403. | N2 |
| **H23** | [18-contraseña](../evidencias/fase8/antes/18-usuario-contrasena-requisitos-movil.png) | [18-contraseña](../evidencias/fase8/despues/18-usuario-contrasena-requisitos-movil.png) | **Abierto, justificado**: así lo define la hoja de componentes. | N8, NS |
| **H24** | [10-ambientes](../evidencias/fase8/antes/10-ambientes-listado-escritorio.png) | [10-ambientes](../evidencias/fase8/despues/10-ambientes-listado-escritorio.png) | **Abierto, cosmético.** | N8 |

## Resumen por severidad (Fase 8: 24 hallazgos)

| Severidad | Hallazgos | Cerrados | Parciales | Abiertos |
|---|---|---|---|---|
| 4 | 1 (H01) | 1 (H01, Fase 9) | 0 | 0 |
| 3 | 4 (H02 a H05) | 4 (H02 en la Fase 9) | 0 | 0 |
| 2 | 10 (H06 a H13, H15, H16) | 8 (H06 a H13) | 0 | 2 (H15, H16) |
| 1 | 9 (H14, H17 a H24) | 2 (H17, H18) | 1 (H20) | 6 (H14, H19, H21, H22, H23, H24) |
| **Total** | **24** | **15** | **1** | **8** |

## Fase 9: hallazgos nuevos de las pantallas Reservas, Dashboard y Mi ambiente

| Id | Antes (captura) | Después (captura) | Estado | Principio |
|---|---|---|---|---|
| **H25** | [06-dashboard](../evidencias/fase9/06-dashboard-mostrando-5-de-n-escritorio.png) | [60-dashboard](../evidencias/fase9/estados/60-dashboard-escritorio.png) | **Cerrado** (sev. 3): el nombre del ambiente cabe en su tarjeta, comprobado en la imagen nueva. | N8, S3 |
| **H26** | [06-dashboard](../evidencias/fase9/06-dashboard-mostrando-5-de-n-escritorio.png) | [60-dashboard](../evidencias/fase9/estados/60-dashboard-escritorio.png) | **Cerrado** (sev. 2): los tres botones van en una fila. | N4, S1 |
| **H27** | [04-reservas](../evidencias/fase9/04-reservas-filtro-aprobada-movil.png) | [Mi ambiente](../evidencias/fase9/05-mi-ambiente-escritorio.png) | **Cerrado** (sev. 1), comprobado con la prueba de estilos. | N8 |
| **H28** | [04-reservas](../evidencias/fase9/04-reservas-filtro-aprobada-movil.png) | [63-reservas](../evidencias/fase9/estados/63-reservas-administrador-movil.png) | **Cerrado** (sev. 2): comprobado en la imagen nueva: «Filtros» plegado y la primera fila a la vista. | N8, S8 |
| **H29** | [05-mi-ambiente](../evidencias/fase9/05-mi-ambiente-escritorio.png) | — | **Abierto** (sev. 2): varios ambientes y extensión de indicadores, a revisar con usuarios. | N6, NMC |
| **H30** | [60-dashboard](../evidencias/fase9/estados/60-dashboard-escritorio.png) | [60-dashboard](../evidencias/fase9/estados/60-dashboard-escritorio.png) | **Cerrado** (sev. 1): «Incluye canceladas» bajo el total, comprobado en la imagen nueva. | NGV |
| **H31** | [60-dashboard](../evidencias/fase9/estados/60-dashboard-escritorio.png) | [60-dashboard](../evidencias/fase9/estados/60-dashboard-escritorio.png) | **Cerrado** (sev. 1): «Ver detalle» en una sola línea, comprobado en la imagen nueva. | N8 |

**Total con la Fase 9: 31 hallazgos, 21 cerrados, 1 parcial (H20) y 9 abiertos** (H14, H15, H16, H19, H21, H22, H23, H24 y H29; ninguno de severidad 3 o 4). Severidad 3 o 4: 6 hallazgos, los 6 cerrados.

## Mediciones antes y después

| Medida | Antes | Después |
|---|---|---|
| Violaciones de axe-core (69 mediciones) | 0 | 0 |
| Pares de contraste por debajo del umbral | 7 | 0 (quedan 3 pares de texto deshabilitado marcados EXENTO por WCAG: H19) |
| Elementos interactivos menores de 44 px a 375 px | 20 elementos en 17 de 35 estados | 0 |
| Paradas de Tab sin foco visible / foco fuera del modal | 0 / 0 | 0 / 0 |
| Scroll horizontal a 320 px | 1 de 7 pantallas (login) | 0 de 7 |
| Scroll horizontal a 188 px (zoom 200 % en un teléfono) | 7 de 7 | 3 de 7 (con la Fase 9: 4 de 10; también desborda Mi ambiente) |
| Animaciones infinitas con movimiento reducido | 1 | 0 |

Lo que **no** se puede afirmar: la satisfacción y el tiempo de las personas **no están medidos** (la prueba con usuarios está planificada, no hecha), y 0 violaciones de axe no prueba que todo sea accesible.

## Medición de la Fase 9 (`docs/evidencias/fase9-accesibilidad.txt`, 85 mediciones, 10 pantallas)

axe-core: 0 violaciones · contraste: 0 pares por debajo del umbral (3 de texto deshabilitado, exentos) · objetivos táctiles menores de 44 px a 375 px: 0 en 43 estados · paradas de Tab sin foco visible: 0 y foco fuera del modal: 0 · movimiento reducido: 0 animaciones infinitas · scroll horizontal a 320 px: 0; a 188 px: 4 de 10 pantallas (login, Nueva reserva, Registrar usuario y Mi ambiente; H20 queda parcial).
