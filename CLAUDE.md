# Instrucciones para Claude Code — ReservaUPLA

Sistema de reservas de ambientes de la Universidad Peruana Los Andes (caso práctico, curso Construcción de Software, semanas 1–9). Un solo desarrollador. El planificador decide y escribe los prompts de cada fase; tú programas, pruebas y verificas.

Lee antes de cualquier fase: `docs/01-analisis.md`, `docs/02-ciclo-de-vida.md`, `docs/03-estandares.md`, `docs/diseno/DESIGN.md`, `docs/diseno/componentes.md`, `docs/diseno/reglas-para-programar.md` y las imágenes de `docs/diseno/v2/` de la pantalla que vayas a construir.

## Reglas de trabajo

1. Trabaja por fases. Al terminar una: compila, prueba, muestra un resumen corto y **espera confirmación**.
2. Si un comando falla, explica la causa y corrige; nunca inventes resultados ni marques como hecho lo que no probaste.
3. Nombres de dominio en español (Reserva, Ambiente, HoraInicio); nombres técnicos en inglés por convención (Controller, Repository, Service, Dto). Ver `docs/03-estandares.md`.
4. Nunca escribas claves reales en archivos versionados. Cadena de conexión y clave JWT en `dotnet user-secrets`. La clave del rol de base de datos la **generas al azar** (24+ caracteres), la guardas solo en user-secrets y la pasas a `psql` como variable; no la imprimas en el informe ni en los commits.
5. Nunca registres (log) contraseñas ni hashes.
6. Commits: formato `tipo: descripción en presente y en español` (feat, fix, refactor, test, docs, chore). Un commit hace una sola cosa. **Sin trailer `Co-Authored-By`.** Trabaja en `feature/<tema>` y une a `main` solo con build y pruebas en verde. Haz commit solo cuando el planificador lo pida al cierre de la fase.
7. Funciones pequeñas, una responsabilidad, sin duplicar: lo que se repite en dos lugares pasa a un componente o función compartida. Archivos de menos de 300 líneas.
8. **Cada control y cada estado tiene prueba**: todo campo, botón, modal, mensaje de error y estado de carga mostrado en el diseño v2 necesita una prueba automatizada que lo ejerza. Cada regla RN-01 a RN-06 tiene una prueba que la rompe a propósito.
9. **Los defectos se corrigen, no solo se anotan.** Si al probar encuentras un defecto, lo arreglas, agregas la prueba que lo habría detectado y lo registras en `docs/bitacora-evaluacion.md` (fecha, qué falló, cómo se corrigió, prueba que lo cubre). Sin fingir que no ocurrió.

## Stack

| Capa | Tecnología |
|---|---|
| Backend | C# · ASP.NET Core Web API (.NET 8; si hay otra LTS instalada, adapta y avisa) |
| ORM | Entity Framework Core + Npgsql, **sin migraciones** |
| Base de datos | PostgreSQL 18 en `localhost:5432`, BD `ReservaUPLADB` |
| Seguridad | BCrypt.Net-Next, JWT Bearer, rate limiter en el login |
| Validación backend | FluentValidation |
| Pruebas backend | xUnit |
| Frontend | React + Vite (JavaScript) + React Router, CSS Modules con variables CSS |
| Pruebas frontend | Vitest + React Testing Library + user-event |
| Calidad | ESLint + Prettier, `dotnet format` |

Antes de crear proyectos verifica `dotnet --version`, `node --version`, `npm --version`, `psql --version`.

## Arquitectura

```
ReservaUPLA/
├── backend/   ReservaUPLA.Domain · .Application · .Infrastructure · .API · .Application.Tests (+ .Api.Tests si hace falta)
├── frontend/
├── database/  scripts numerados, ejecutados con psql
└── docs/
```

Dependencias: `Application → Domain`; `Infrastructure → Application, Domain`; `API → Application, Infrastructure`. **Application nunca referencia Infrastructure** (comprobable con una búsqueda de `using ReservaUPLA.Infrastructure` en Application).

## Base de datos (por terminal, requisito del docente)

Scripts `00_eliminar_bd`, `01_crear_bd`, `02_crear_rol`, `03_crear_tablas`, `04_permisos`, `05_datos_prueba`, `06_verificacion`. Sin migraciones, sin `EnsureCreated`/`Migrate`, sin crear tablas desde código. En este equipo usa siempre `-h localhost -p 5432 -v ON_ERROR_STOP=1` (PostgreSQL 18 en 5432; hay uno 16 en 5433 que no se usa). Cada script empieza con un comentario con propósito, base desde la que se ejecuta y comando. Los scripts 03 a 05 son idempotentes cuando se puede. La app se conecta con el rol `reservaupla_app` (mínimo privilegio), nunca con `postgres`.

Esquema (tablas y columnas en snake_case, plural): `usuarios`, `ambientes`, `reservas`, `historial_reserva`.
- `reservas`: `CHECK (hora_fin > hora_inicio)` (RN-03); `CHECK (hora_inicio >= '07:00' AND hora_fin <= '22:00')` (RN-04); columnas obligatorias `NOT NULL` (RN-02); **RN-01** con restricción `EXCLUDE USING gist` (extensión `btree_gist`) sobre `(ambiente_id, fecha, rango de horas)` solo cuando `estado = 'Aprobada'`.
- Correos únicos y normalizados (`correo = LOWER(TRIM(correo))`), igual que en NovaPortal.
- Permisos del rol de la app: solo lo necesario (SELECT/INSERT/UPDATE de las tablas que la API modifica; sin DELETE ni DDL).

## Roles y reglas (resumen de `docs/01-analisis.md`)

- Administrador: aprueba/rechaza (RN-05, el backend devuelve 403 a otros roles), gestiona usuarios y ambientes, ve todo.
- Solicitante: crea reservas, ve y cancela las suyas (solo Pendiente o Aprobada).
- Responsable de ambiente: solo lectura de las reservas de su ambiente.
- Estados finales: Rechazada y Cancelada (RN-06). Transiciones según la tabla del análisis. Cada cambio de estado escribe una fila en `historial_reserva`.
- Un ambiente en mantenimiento no admite reservas nuevas.

## Frontend (fuente de verdad: diseño v2)

- Los nueve componentes de `docs/diseno/componentes.md` viven en `src/components/ui/` y se usan en **todas** las pantallas: TextInput, SelectInput, DateInput, TimeInput, Button, AlertMessage, ModalConfirmacion, TableList, CardIndicador. Más un único `Layout` con menú lateral, un único `DetalleReserva` y un único icono de error (cierran N1, E4, U3, G1 de `reglas-para-programar.md`).
- Separación obligatoria como en NovaPortal: `utils/validators.js` (funciones puras) ↔ hooks (`useXxxForm`) ↔ componentes de presentación. `constants/messages.js` es la única fuente de mensajes y es igual a la del backend (`MensajesValidacion`).
- Fechas como dd/mm/aaaa; horas en lista cerrada 07:00–22:00 cada 30 min; la hora de fin solo ofrece horas posteriores al inicio.
- Accesibilidad y diseño: foco `#1E73BE` de 3 px (blanco sobre el menú oscuro; el celeste `#3696EA` solo es decorativo, ver `docs/diseno/DESIGN.md`), controles de 44 px, contraste AA, `prefers-reduced-motion`, sin scroll horizontal en 375 px, sin `alert()` del navegador.
- Tokens en `styles/tokens.css` (paleta de `DESIGN.md`); nada de colores sueltos.

## Pendientes del planificador (no los inventes)

- Dominio real del correo institucional: usa `@upla.edu.pe` como valor **configurable** (`appsettings` y `.env`); se reemplaza al confirmarlo.
- Política de la contraseña inicial de un usuario nuevo (hallazgo U2): se define en la fase de validaciones; mientras tanto no muestres requisitos.
- Texto de soporte del login ("Comunícate con Soporte TI de la universidad"): sin correo ni teléfono inventados.

## Checklist de cada cierre de fase

- [ ] `dotnet build` y `dotnet test` sin errores ni advertencias relevantes.
- [ ] `npm run build`, `npm run lint` y `npm run test` sin errores.
- [ ] La BD se recrea desde cero solo con los scripts de `database/` (00 a 06).
- [ ] Ninguna clave real en archivos versionados; `git status` limpio tras el commit.
- [ ] `docs/bitacora-evaluacion.md` actualizada con defectos hallados y corregidos.
