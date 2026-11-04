# 02. Justificación del ciclo de vida (Semana 02)

## Modelo elegido: incremental e iterativo

El sistema se construye en **incrementos**: cada uno entrega algo que funciona y se prueba. Después de cada incremento se revisa y se corrige antes de continuar. Las semanas 04 a 09 del caso ya están planteadas así: estructura, formularios, validaciones, reutilización, refinamiento y salida de datos.

## Por qué encaja con este caso

| Característica del caso | Qué implica | Por qué el modelo incremental responde bien |
|---|---|---|
| El enunciado pide desarrollar "progresivamente" durante nueve semanas | Hay entregas parciales con evidencia cada semana | Cada incremento es una entrega comprobable |
| Los requerimientos (RF-01 a RF-08) y las reglas (RN-01 a RN-06) están definidos desde el inicio | No hace falta descubrirlos sobre la marcha | Se pueden planificar los incrementos con anticipación |
| Hay dependencias claras: los formularios necesitan componentes, el dashboard necesita datos de reservas | El orden importa | Cada incremento se apoya en el anterior |
| La regla más delicada (RN-01) afecta a todo el sistema | Un error aquí se descubriría tarde | Se aborda pronto y se vuelve a probar en cada incremento |
| El proyecto lo desarrolla una sola persona | No hay equipo ni roles de gestión | Un modelo ligero evita ceremonias que no aportan |

## Por qué no los otros modelos

| Modelo | Motivo para descartarlo |
|---|---|
| Cascada | Entrega todo al final: si un error de análisis aparece en el dashboard, obliga a rehacer lo anterior. Además contradice la evidencia semanal que pide el caso |
| Espiral | Está pensado para proyectos con riesgos grandes y costosos; aquí el alcance es pequeño y conocido |
| Scrum | Requiere equipo, roles (Product Owner, Scrum Master) y reuniones; una sola persona no puede aplicarlo con sentido |

## Incrementos

| Incremento | Semana | Resultado que funciona | Prueba al cerrar |
|---|---|---|---|
| 0. Análisis y estándares | 01 a 03 | Documentos acordados | Revisión del alcance |
| 1. Estructura inicial | 04 | Backend, frontend y base de datos que arrancan y se comunican | La base se crea desde cero con los scripts y la API responde |
| 2. Entrada de datos | 05 | Formularios para usuarios, ambientes y reservas | Se puede registrar cada entidad |
| 3. Validación | 06 | Reglas RN-01 a RN-06 en frontend, backend y base de datos | Cada regla tiene una prueba que la rompe a propósito |
| 4. Reutilización | 07 | Los nueve componentes compartidos usados en todas las pantallas | Ninguna pantalla repite código de campos o mensajes |
| 5. Refinamiento | 08 | Servicios, controladores y validaciones reorganizados | Las pruebas siguen en verde |
| 6. Salida de datos | 09 | Listado, detalle y dashboard | Los números del dashboard coinciden con la base |

## Riesgos y cómo se controlan

| Riesgo | Control |
|---|---|
| Dos solicitudes simultáneas se aprueban para el mismo horario | Restricción en la base de datos, además de la validación en el backend |
| Reglas distintas en frontend y backend | Mismos mensajes y mismo orden de validación, con una sola fuente en cada lado |
| Que el dashboard muestre cifras que no coinciden con los datos | Prueba que compara cada indicador con una consulta directa a la base |
