# Plan de prueba de usabilidad con usuarios (Fase 8, paso 6)

Basado en ISO 9241-11: usabilidad = **eficacia**, **eficiencia** y **satisfacción** con que unas personas concretas logran unos objetivos concretos en un contexto de uso concreto.

> **Estado: SIN EJECUTAR.** Este documento es el plan y las plantillas. **No hay ningún resultado de personas**: nada de lo que dice `evaluacion-sistema.md` proviene de esta prueba (es una evaluación de expertos más mediciones automáticas). Los números que produzca `tools/usabilidad/analizar.mjs` con el archivo sintético de `tools/usabilidad/pruebas/` son una prueba del script, no resultados, y no se citan en ningún informe.

## Qué le toca hacer a la persona que estudia (después de la Fase 9)

La prueba real **la hace el estudiante**, con el sistema ya completo (lista de Reservas, filtros, Mi ambiente y dashboard, para poder probar T03, T04, T08, T09 y T10; hoy solo se pueden probar T01, T02, T05, T06 y T07). Pasos:

1. Conseguir de 3 a 5 compañeros (sección 1).
2. Preparar el entorno (sección 6) y ensayar las tareas uno mismo **tres veces**, cronometrando: esos tiempos son el «tiempo de referencia» de cada tarea (`docs/usabilidad/tiempos-referencia.csv`).
3. Hacer una sesión por participante de unos 25 minutos (sección 4) y llenar la hoja de observación (sección 5) y el cuestionario SUS (sección 7).
4. Pasar los datos al CSV `docs/usabilidad/resultados-prueba.csv` (sección 8), con `origen` = `REAL`.
5. Ejecutar `node tools/usabilidad/analizar.mjs` desde la carpeta del proyecto y copiar el resultado, con sus limitaciones (muestra muy pequeña), al informe.
6. Decidir con los resultados qué se corrige (los problemas que vea más de un participante primero) y anotarlo en `docs/bitacora-evaluacion.md`.

## 1. Participantes

- **3 a 5 compañeros** que no hayan visto el sistema. Con 3 a 5 personas se descubre la mayoría de los problemas graves de usabilidad, pero **no** se pueden sacar porcentajes con valor estadístico: se informan como «de N participantes».
- Perfil (hipótesis de `contexto-de-uso.md`): estudiantes o docentes que reservan ambientes de vez en cuando. Si es posible, 1 o 2 participantes por rol: Solicitante (T01, T02, T05) y Administrador (T06, T07).
- **Consentimiento, de palabra y breve.** Antes de empezar, decir: «Estamos probando el sistema, no a ti. Puedes parar cuando quieras. Anotaré lo que hagas y lo que digas, sin tu nombre; si grabo la pantalla, no se compartirá. ¿Aceptas?». Anotar solo «sí»/«no».
- **Sin datos personales:** cada persona es `P1`, `P2`, … No se anotan nombres, correos ni edades. El sistema se prueba con las cuentas de prueba (Ana, Carla), no con cuentas reales.

## 2. Tareas

Se leen al participante como una situación, **sin** nombrar botones ni pantallas. Tiempos máximos y caminos óptimos son decisiones de este plan (no datos): se ajustan después del ensayo con tiempos de referencia.

| Tarea | Rol / cuenta | Se le dice | Éxito | Tiempo máximo | Camino óptimo (interacciones) |
|---|---|---|---|---|---|
| **T01** Registrar una reserva | Solicitante (Ana) | «Eres docente y necesitas el Laboratorio de Cómputo 2 pasado mañana, de 10:00 a 12:00, para una práctica. Pide la reserva.» | Queda una reserva **Pendiente** con el ambiente, la fecha y el horario pedidos, y el participante dice que quedó registrada. | 120 s | **8** (9 si la fecha no es la de hoy) |
| **T02** Cancelar su solicitud | Solicitante (Ana) | «Ya no la necesitas. Cancela esa solicitud.» (justo después de T01) | La reserva queda **Cancelada**. | 60 s | **3** |
| **T05** Detectar un conflicto | Solicitante (Ana) | «Intenta pedir el Laboratorio de Cómputo 2 el [día] de 11:00 a 13:00. Dime si se puede y por qué.» (con una reserva aprobada de 10:00 a 12:00 ese día, preparada antes) | Dice **que no se puede** y **de qué hora a qué hora está ocupado**, sin necesitar enviar el formulario. | 90 s | **0** adicionales (lo ve al elegir las horas) |
| **T06** Registrar un ambiente | Administrador (Carla) | «Se abrió la Sala de Videoconferencias: sala, 20 personas, Pabellón D piso 2, disponible, a cargo de Mario Huamán. Regístrala.» | El ambiente aparece en la lista con todos los datos correctos. | 180 s | **11** |
| **T07** Registrar un usuario | Administrador (Carla) | «Entró una nueva docente, Rosa Chávez, correo rosa.chavez@upla.edu.pe, que va a pedir reservas. Dale acceso con una contraseña inicial.» | El usuario aparece en la lista con rol Solicitante y activo. | 150 s | **8** |

Cuando la Fase 9 esté terminada se añaden **T03** (aprobar), **T04** (rechazar), **T08** (consultar «Mi ambiente»), **T09** (filtrar reservas) y **T10** (indicadores), con la misma estructura. Hoy no se pueden probar: la persona no podría llegar a la reserva desde la interfaz.

**Orden:** T01 → T02 → T05 con Ana; luego T06 → T07 con Carla. Alternar el orden entre participantes para que el cansancio no pese siempre sobre la misma tarea.

## 3. Cómo se mide cada cosa

| Medida | Fórmula | Qué se anota |
|---|---|---|
| **Eficacia** | tareas completadas / tareas intentadas (por tarea y global) | `completada` = 1 si cumplió el criterio de éxito **sin que el moderador la resolviera**; 0 si se rindió, se pasó del tiempo máximo o la hizo mal. |
| **Eficiencia** | por tarea: tiempo y clics frente al óptimo. Eficiencia en clics = clics óptimos / clics reales (1 = óptimo). Eficiencia en tiempo = tiempo de referencia / tiempo real (máx. 1). | `tiempo_s` (desde que termina de leer la tarea hasta que dice «listo») y `clics` (clics, toques y selecciones; no cuenta teclear). |
| **Satisfacción** | puntaje **SUS** 0–100 por persona (sección 7) y su media | las 10 respuestas de 1 a 5. |
| Apoyo | errores y ayudas | `errores` (acciones equivocadas, mensajes de error que le salieron) y `ayuda_moderador` = 1 si hizo falta darle una pista. |

Solo cuentan para el tiempo y los clics las tareas completadas.

## 4. Guion del moderador

**Antes (3 min).** Saludar, leer el consentimiento (sección 1) y decir: «Esto es una prueba del sistema, no de ti: si algo no se entiende, el problema es del sistema. Quiero que **pienses en voz alta**: dime qué buscas, qué esperas que pase y qué te confunde. No voy a ayudarte mientras haces la tarea; si no sabes seguir, dime “no sé” y pasamos a la siguiente.»

**Durante (cada tarea, ~3 min).** Leer la tarea tal cual está escrita, iniciar el cronómetro y **callar**.

- **Sí hacer:** recordar «¿qué estás pensando?» si se queda en silencio; repetir la tarea si la pide; anotar lo que hace, lo que dice y dónde duda.
- **NO hacer:** nombrar un botón o una pantalla, señalar con el dedo, decir «casi», «ahí no», «pulsa…», reírse o corregir. Si la persona se bloquea más del tiempo máximo, anotar «no completada» y pasar a la siguiente.
- **Ayuda de último recurso.** Solo si hay una falla del sistema (error de la API, pantalla en blanco): ayudar, anotar `ayuda_moderador` = 1 y la causa.

**Después (5 min).** Cuestionario SUS (sección 7), las dos preguntas abiertas y agradecer.

## 5. Hoja de observación (una por participante)

```
Participante: P__   Rol que hizo: Solicitante / Administrador   Dispositivo: teléfono / computadora   Fecha: __/__/____

Tarea | Completó (1/0) | Tiempo (s) | Clics | Errores | ¿Ayuda? (1/0) | Dónde dudó / qué dijo (cita corta) | Qué mensaje o pantalla no entendió
T01   |                |            |       |         |               |                                    |
T02   |                |            |       |         |               |                                    |
T05   |                |            |       |         |               |                                    |
T06   |                |            |       |         |               |                                    |
T07   |                |            |       |         |               |                                    |

Observaciones sueltas (lo que no entra en la tabla):
```

## 6. Preparación del entorno

1. Base limpia: `PGPASSWORD="<clave de postgres>" CLAVE_PRUEBA="<clave de prueba>" bash tools/e2e/recrear-bd.sh` y reiniciar la API.
2. API en `:5263` y frontend en `:5180` (ver el README).
3. Para **T05**: con la cuenta de Carla, aprobar una reserva del Laboratorio de Cómputo 2 de 10:00 a 12:00 del día que se usará (crear la reserva con Ana y aprobarla desde su detalle).
4. Una sesión por participante: cerrar sesión y, si hace falta, recrear la base para que ninguno vea lo que hizo el anterior (el límite del login es de 5 intentos por minuto por IP: iniciar sesión **antes** de empezar con el participante).
5. Probar en el dispositivo real del participante si es posible; si no, en una ventana de 375 px de ancho.

## 7. Cuestionario SUS (System Usability Scale)

Escala: **1 = Totalmente en desacuerdo … 5 = Totalmente de acuerdo.** Responder rápido, con lo primero que se piense.

| # | Afirmación | 1 | 2 | 3 | 4 | 5 |
|---|---|---|---|---|---|---|
| 1 | Creo que me gustaría utilizar este sistema con frecuencia. | ☐ | ☐ | ☐ | ☐ | ☐ |
| 2 | Encontré el sistema innecesariamente complejo. | ☐ | ☐ | ☐ | ☐ | ☐ |
| 3 | Pensé que el sistema era fácil de usar. | ☐ | ☐ | ☐ | ☐ | ☐ |
| 4 | Creo que necesitaría el apoyo de un técnico para poder utilizar este sistema. | ☐ | ☐ | ☐ | ☐ | ☐ |
| 5 | Encontré que las diversas funciones del sistema estaban bien integradas. | ☐ | ☐ | ☐ | ☐ | ☐ |
| 6 | Pensé que había demasiada inconsistencia en este sistema. | ☐ | ☐ | ☐ | ☐ | ☐ |
| 7 | Imagino que la mayoría de las personas aprenderían a utilizar este sistema muy rápidamente. | ☐ | ☐ | ☐ | ☐ | ☐ |
| 8 | Encontré el sistema muy incómodo de usar. | ☐ | ☐ | ☐ | ☐ | ☐ |
| 9 | Me sentí muy seguro/a utilizando el sistema. | ☐ | ☐ | ☐ | ☐ | ☐ |
| 10 | Necesité aprender muchas cosas antes de poder empezar a usar este sistema. | ☐ | ☐ | ☐ | ☐ | ☐ |

**Puntaje:** ítems impares (1, 3, 5, 7, 9) → respuesta − 1; ítems pares (2, 4, 6, 8, 10) → 5 − respuesta; sumar los diez valores y multiplicar por 2,5. Resultado de 0 a 100 (no es un porcentaje). `analizar.mjs` lo calcula. Con 3 a 5 personas el SUS es orientativo: la media de referencia de 68 sale de muestras grandes.

**Preguntas abiertas (anotar la respuesta textual):**
1. ¿Qué fue lo más difícil o confuso?
2. ¿Qué cambiarías primero?

## 8. Datos y análisis

- Plantilla vacía (solo encabezados): `docs/usabilidad/resultados-prueba.csv`. Una fila por **intento de tarea** (`tipo` = `tarea`) y una fila por **cuestionario** (`tipo` = `sus`, con `sus_1` a `sus_10`). Columna `origen` = `REAL` para datos de personas.
- Tiempos de referencia del ensayo: `docs/usabilidad/tiempos-referencia.csv` (`tarea,tiempo_experto_s`).
- Análisis: `node tools/usabilidad/analizar.mjs` (o con la ruta de otro CSV). Sin filas dice que no hay nada que analizar; **no inventa**.
- El script se probó con `tools/usabilidad/pruebas/resultados-SINTETICO.csv` (valores calculados a mano; `npm run pruebas` desde `tools/usabilidad`). Si alguna fila trae `origen` = `SINTETICO`, el informe lo avisa en su primera línea.

## 9. Limitaciones que hay que decir en el informe

- Muestra de 3 a 5 compañeros: **ni representativa ni estadística**; sirve para encontrar problemas, no para afirmar porcentajes.
- Los compañeros no son los usuarios reales (docentes y administrativos de la UPLA): el contexto de uso es una hipótesis (`contexto-de-uso.md`).
- Los tiempos máximos y los caminos óptimos son decisiones de este plan, no medidas previas.
- T03, T04, T08, T09 y T10 no se pueden probar hasta la Fase 9.
