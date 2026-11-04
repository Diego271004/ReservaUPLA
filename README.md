# ReservaUPLA

Sistema web de reservas de ambientes de la Universidad Peruana Los Andes (caso práctico del curso Construcción de Software). Backend en ASP.NET Core (.NET 8), base de datos PostgreSQL y frontend en React + Vite.

```
backend/    ReservaUPLA.Domain · .Application · .Infrastructure · .API · .Application.Tests
frontend/   React + Vite (JavaScript)
database/   scripts SQL numerados, ejecutados con psql
docs/       análisis, ciclo de vida, estándares, diseño y bitácora
```

## Requisitos
| Herramienta | Versión |
|---|---|
| .NET SDK | 8.x |
| Node.js y npm | Node 20 o superior |
| PostgreSQL | 18 (`localhost:5432`); incluye `psql` en el PATH |

Comprobar: `dotnet --version`, `node --version`, `npm --version`, `psql --version`.

## Orden para empezar de cero
1. Instalar los requisitos. 2. Crear la base con los scripts (sección siguiente). 3. Guardar los secretos con la **misma** clave del rol. 4. Ejecutar API y frontend. 5. Pruebas, e2e y usabilidad. Las pruebas e2e y de usabilidad leen la clave del rol desde los secretos del paso 3 (sin ellos, `recrear-bd.sh` y `todo` no pueden recrear la base).

## Base de datos (por terminal)
Los scripts viven en `database/` y se ejecutan con `psql` desde la raíz del repositorio. Nunca se usan migraciones ni `EnsureCreated`. Ningún script contiene claves: llegan como variables de `psql`.

Elige una clave para el rol `reservaupla_app` (24 caracteres o más, aleatoria) y guárdala solo en `user-secrets` (ver más abajo).

**macOS / Linux (bash o zsh):**
```bash
export PGPASSWORD='<clave de postgres>'
PSQL="psql -h localhost -p 5432 -U postgres -v ON_ERROR_STOP=1"

$PSQL -d postgres      -f database/00_eliminar_bd.sql
$PSQL -d postgres      -f database/01_crear_bd.sql
$PSQL -d postgres      -v app_password="<clave del rol reservaupla_app>" -f database/02_crear_rol.sql
$PSQL -d ReservaUPLADB -f database/03_crear_tablas.sql
$PSQL -d ReservaUPLADB -f database/04_permisos.sql
$PSQL -d ReservaUPLADB -v password_prueba="<clave de prueba>" -f database/05_datos_prueba.sql
$PSQL -d ReservaUPLADB -f database/06_verificacion.sql
$PSQL -d ReservaUPLADB -f database/07_pruebas_reglas.sql
```

**Windows (PowerShell):**
```powershell
$env:PGPASSWORD = '<clave de postgres>'
$psql = @('-h','localhost','-p','5432','-U','postgres','-v','ON_ERROR_STOP=1')

psql @psql -d postgres      -f database/00_eliminar_bd.sql
psql @psql -d postgres      -f database/01_crear_bd.sql
psql @psql -d postgres      -v app_password="<clave del rol reservaupla_app>" -f database/02_crear_rol.sql
psql @psql -d ReservaUPLADB -f database/03_crear_tablas.sql
psql @psql -d ReservaUPLADB -f database/04_permisos.sql
psql @psql -d ReservaUPLADB -v password_prueba="<clave de prueba>" -f database/05_datos_prueba.sql
psql @psql -d ReservaUPLADB -f database/06_verificacion.sql
psql @psql -d ReservaUPLADB -f database/07_pruebas_reglas.sql
```

- `00` borra la base y el rol; vuelve a empezar desde cero.
- Cada script empieza con `\encoding UTF8`: sin eso, psql en Windows lee los scripts con la página de códigos de la consola y las tildes quedan guardadas dos veces codificadas ("HuamÃ¡n"). `06_verificacion.sql` falla si detecta ese problema.
- `07_pruebas_reglas.sql` comprueba RN-01, RN-03 y RN-04 y no deja datos (termina en `ROLLBACK`).
- Si PostgreSQL pide clave en cada comando, define `PGPASSWORD` como arriba (solo en esa sesión de terminal).

## Secretos (`dotnet user-secrets`)
La cadena de conexión y la clave JWT no están en el repositorio. Desde `backend/`:

```bash
dotnet user-secrets set "ConnectionStrings:ReservaUPLADB" "Host=localhost;Port=5432;Database=ReservaUPLADB;Username=reservaupla_app;Password=<clave del rol reservaupla_app>" --project ReservaUPLA.API/ReservaUPLA.API.csproj
dotnet user-secrets set "Jwt:Key" "<clave aleatoria de 64 caracteres o más>" --project ReservaUPLA.API/ReservaUPLA.API.csproj
```

La clave del rol debe ser la misma que se pasó en `02_crear_rol.sql`. Los secretos se guardan por proyecto (`UserSecretsId`) en tu perfil de usuario, no en la carpeta: dos copias del repositorio en el mismo equipo comparten los mismos secretos. Para comprobarlos: `dotnet user-secrets list --project ReservaUPLA.API/ReservaUPLA.API.csproj`.

## Ejecutar
```bash
# Terminal 1: API en http://localhost:5263 (Swagger solo en Development)
cd backend
ASPNETCORE_ENVIRONMENT=Development dotnet run --project ReservaUPLA.API/ReservaUPLA.API.csproj --urls http://localhost:5263   # PowerShell: $env:ASPNETCORE_ENVIRONMENT='Development'

# Terminal 2: frontend
cd frontend
npm install
npm run dev
```

Abre `http://localhost:5180` (puerto fijo: si estuviera ocupado, Vite avisa con un error en lugar de cambiar de puerto; CORS solo permite ese origen, configurable en `Cors:OrigenesPermitidos`). El frontend reenvía `/api` a `http://localhost:5263`; si la API usa otra dirección, define `VITE_API_URL` antes de `npm run dev`.

### Qué hay en la Fase 9
- **Reservas** (`/reservas`): lista con filtros (Estado, Ambiente, fecha desde y hasta), páginas de 10 con «Anterior» deshabilitado en la primera, estado vacío con «Limpiar filtros» y tarjetas apiladas en móvil (donde los filtros se pliegan detrás del botón «Filtros (n)»). Cada rol ve lo suyo. **Dashboard** (`/dashboard`, Administrador): cinco indicadores, las 5 pendientes más antiguas con Aprobar y Rechazar (con modal), «Mostrando 5 de N» y «Ver todas las pendientes». **Mi ambiente** (`/mi-ambiente`, Responsable): su ambiente, cuatro indicadores y sus reservas, solo lectura.
- **Endpoints nuevos:** `GET /api/reservas?estado=&ambienteId=&desde=&hasta=&pagina=` (devuelve `{ elementos, total, pagina, tamano }`), `GET /api/dashboard` y `GET /api/mi-ambiente?ambienteId=&pagina=`.
- **Pruebas con la base real:** `ListadoYPanelesConBaseRealTests` compara cada indicador con una consulta SQL directa (variables `RESERVAUPLA_PRUEBAS_BD_*`, ver «Pruebas»).
- **e2e:** `npm run fase9` en `tools/e2e` (flujo completo, capturas en `docs/evidencias/fase9/`); `npm run todo` ejecuta las fases 5, 6, 7 y 9 y la ampliación de arquitectura de información. Accesibilidad de todas las pantallas: `ETAPA=fase9 node accesibilidad.mjs` en `tools/usabilidad` (`docs/evidencias/fase9-accesibilidad.txt`).

### Ampliación: arquitectura de información
- `docs/usabilidad/arquitectura-de-informacion.md`: organización, etiquetado (con las incoherencias halladas y corregidas), navegación, filtros, jerarquía por pantalla, modelo mental y mapa del sitio **generado del código** (`node mapa-del-sitio.mjs --escribir` / `--verificar` en `tools/usabilidad`). Las rutas viven en `frontend/src/constants/rutas.js` y `rutas.test.jsx` comprueba menú, roles y «Sin permiso».
- Test de árbol para ejecutar con compañeros: sección 10 de `docs/usabilidad/plan-prueba-usuarios.md` (sin resultados).
- Evidencias: `docs/evidencias/fase-ai/` (`npm run faseai` en `tools/e2e`) y `docs/evidencias/fase-ai-accesibilidad.txt` (`ETAPA=fase-ai node accesibilidad.mjs`).

### Qué hay en la Fase 8
- **Evaluación de usabilidad del sistema construido** (`docs/usabilidad/`): `contexto-de-uso.md` (personas como hipótesis, tareas T01 a T10, mapa de navegación en Mermaid), `evaluacion-sistema.md` (24 hallazgos con severidad y captura), `matriz-principios-final.md`, `cambios-evaluacion-a-final.md` (antes y después) y `plan-prueba-usuarios.md` (la prueba con personas **no está hecha**: ver el plan y qué le toca al estudiante).
- **Accesibilidad medida** (`tools/usabilidad/`, informes en `docs/evidencias/fase8-accesibilidad*.txt`): axe-core en todas las pantallas y estados a 1280 px y 375 px, contraste WCAG de los tokens, objetivos táctiles, orden de Tab y foco visible, zoom 200 %/reflujo y movimiento reducido.
  ```bash
  cd tools/usabilidad && npm install
  node contraste.mjs                                   # solo el contraste (no necesita la base)
  PGPASSWORD="<clave de postgres>" CLAVE_PRUEBA="<clave de prueba>" ETAPA=despues node accesibilidad.mjs   # recrea la base, arranca la API y el frontend (puertos 5263 y 5180 libres)
  node analizar.mjs                                    # (necesita filas reales en el CSV; con solo el encabezado avisa «no hay resultados que analizar») eficacia, eficiencia y SUS desde docs/usabilidad/resultados-prueba.csv
  npm run mermaid                                      # renderiza a SVG todos los diagramas Mermaid de docs/ y del README (falla si alguno no se renderiza)
  node mapa-del-sitio.mjs --verificar                  # el mapa del sitio de docs/usabilidad/arquitectura-de-informacion.md coincide con las rutas del código (--escribir lo regenera)
  npm run pruebas                                      # prueba del analizador (archivo SINTÉTICO, no son resultados) y del mapa del sitio
  ```
- **Correcciones** (cada una con su prueba): contraste del límite de los campos, objetivos de 44 px, reflujo a 320 px, movimiento reducido, aviso de «no se puede deshacer» en rechazar y cancelar, aviso de disponibilidad junto a las horas, ayuda del formato de la fecha y separación de los registros en móvil. Ver la bitácora (defectos 26 a 37).
- Pendiente: la lista de Reservas, Mi ambiente y el dashboard (Fase 9); sin ellas, T03, T04, T08, T09 y T10 no se pueden hacer ni probar.

### Qué hay en la Fase 7
- **Reutilización medida:** duplicación de código (jscpd) de 1,38 % a 0,88 % en la medida de referencia; informe y tabla de componentes por pantalla en `docs/reutilizacion.md`. Para repetir la medición y regenerar la tabla: `cd tools/reutilizacion && npm install && node medir-duplicacion.mjs <archivo> <antes|despues> && node componentes-por-pantalla.mjs`.
- **Nueva reserva:** las opciones del ambiente muestran solo el nombre; al elegir, su capacidad y ubicación aparecen como ayuda bajo el campo.
- **RN-07 (propuesta):** no se reserva para una fecha anterior a hoy (frontend, API con 400 y disparador solo al insertar en la base). Ver `docs/matriz-reglas.md`.
- **Pruebas de arquitectura** (`frontend/src/arquitectura.test.js`): ningún archivo fuera de `src/components/ui` (pantallas, Layout, etc.) puede escribir `<input>`, `<select>`, `<textarea>` ni `<button>` a mano.
- **e2e de la fase:** `cd tools/e2e && CLAVE_PRUEBA="<clave>" npm run fase7` (capturas en `docs/evidencias/fase7/`).

### Qué hay en la Fase 6
- **Validaciones de reservas (RN-01 a RN-06):** cada regla se valida en el frontend, el backend y la base de datos; la tabla de pruebas está en `docs/matriz-reglas.md`.
- **Nueva reserva:** aviso inmediato de disponibilidad (verde o rojo con la hora ocupada), lista de hora de fin solo posterior al inicio, ambiente en mantenimiento deshabilitado y cierre con "Ver detalle".
- **Detalle de la reserva** (`/reservas/:id`): un único componente `DetalleReserva` con historial. El Administrador aprueba, rechaza y cancela (con modal de confirmación); la Solicitante cancela su solicitud; la Responsable solo consulta. Una reserva Rechazada o Cancelada queda sin acciones.
- **Contraseña inicial de un usuario:** de 8 a 72 caracteres, con al menos una letra y un número (cierra el hallazgo U2).
- **Endpoints:** `POST /api/auth/login`, `GET /api/auth/me`, `GET|POST /api/usuarios` (Administrador), `GET|POST /api/ambientes` (listar: cualquier sesión; crear: Administrador), `GET /api/reservas` (cada rol ve lo suyo), `GET /api/reservas/{id}`, `GET /api/reservas/disponibilidad?ambienteId&fecha&horaInicio&horaFin`, `POST /api/reservas` (Administrador y Solicitante), `POST /api/reservas/{id}/aprobar|rechazar` (solo Administrador, RN-05) y `POST /api/reservas/{id}/cancelar` (el dueño o el Administrador), `GET /api/salud`. Respuestas de error: 400 con errores por campo, 401, 403, 404 y 409 con `{ "mensaje": … }`.

### Qué hay en la Fase 5
- **Login** (`/login`): errores bajo cada campo, aviso de Bloq Mayús, Mostrar/Ocultar contraseña, "Verificando credenciales…" con "Cancelar" y ayuda de Soporte TI. Máximo 5 intentos por minuto y por IP (el sexto recibe 429).
- **Administrador:** Ambientes (`/ambientes`, `/ambientes/nuevo`), Usuarios (`/usuarios`, `/usuarios/nuevo`) y Nueva reserva.
- **Solicitante:** Nueva reserva (`/reservas/nueva`).
- Dashboard, Reservas y Mi ambiente muestran "Pantalla en construcción" hasta las fases siguientes. 
- La sesión (token) vive en `sessionStorage`: se borra al cerrar la pestaña o con "Cerrar sesión".
- Endpoints: ver "Qué hay en la Fase 6" (se amplió el conjunto de la Fase 5).
- Los mensajes de error son los mismos en `MensajesValidacion.cs` y en `frontend/src/constants/messages.js`; una prueba del frontend lo comprueba.

## Datos de prueba
Los scripts crean tres usuarios con el mismo correo institucional de ejemplo (`@upla.edu.pe`, por confirmar). La contraseña de los tres es la que se pasó en `password_prueba`; con los valores de desarrollo de este equipo:

| Persona | Correo | Rol | Contraseña |
|---|---|---|---|
| Carla Rojas | carla.rojas@upla.edu.pe | Administrador | `Prueba#2026Upla` |
| Ana Torres | ana.torres@upla.edu.pe | Solicitante | `Prueba#2026Upla` |
| Mario Huamán | mario.huaman@upla.edu.pe | Responsable | `Prueba#2026Upla` |

Son datos de desarrollo: no se usan fuera de este equipo. Ambientes: "Laboratorio de Cómputo 2", "Auditorio Principal" y "Sala de Reuniones A" (en mantenimiento). Hay seis reservas de ejemplo en noviembre de 2026. Los datos de prueba no incluyen un usuario inactivo: se crea uno desde Usuarios con el interruptor apagado.

## Pruebas
```bash
cd backend  && dotnet build ReservaUPLA.sln && dotnet test ReservaUPLA.sln && dotnet format ReservaUPLA.sln --verify-no-changes
cd frontend && npm run build && npm run lint && npm run test
```
- `ReservaUPLA.Application.Tests`: servicios, validadores y arquitectura, con repositorios falsos (sin base de datos).
- `ReservaUPLA.Infrastructure.Tests`: BCrypt (incluye un hash `$2a$` de pgcrypto) y el token JWT.
- `ReservaUPLA.API.Tests`: login (400, 401, 200, 429), autorización por rol (401 y 403), ProblemDetails, CORS y errores sin detalles internos; la API se levanta en memoria con repositorios falsos.
- `frontend`: Vitest y React Testing Library; una prueba por campo, botón, mensaje, modal y estado, y la navegación solo con teclado de cada formulario.
- Reglas de la base de datos: `database/07_pruebas_reglas.sql` (ver arriba): RN-01 a RN-06, mantenimiento y hash de contraseña. No deja datos.
- **Pruebas con la base real** (`Infrastructure.Tests` y `ConcurrenciaAprobacionTests` en `API.Tests`): dos aprobaciones simultáneas que se cruzan deben dar un 200 y un 409. Se omiten si faltan estas variables de entorno (con la base ya creada por los scripts 00 a 06):
  ```bash
  export RESERVAUPLA_PRUEBAS_BD_ADMIN="Host=localhost;Port=5432;Database=ReservaUPLADB;Username=postgres;Password=<clave de postgres>"
  export RESERVAUPLA_PRUEBAS_BD_APP="Host=localhost;Port=5432;Database=ReservaUPLADB;Username=reservaupla_app;Password=<clave del rol reservaupla_app>"
  cd backend && dotnet test ReservaUPLA.sln
  ```
  En PowerShell: `$env:RESERVAUPLA_PRUEBAS_BD_ADMIN = '…'; $env:RESERVAUPLA_PRUEBAS_BD_APP = '…'` (mismos valores) y luego `dotnet test ReservaUPLA.sln`. Con las variables definidas y la base creada, la suite da 153 + 13 + 60 pruebas sin omitidas; sin ellas se omiten 4 y 11 (153 + 9 + 49 ejecutadas).
  Cada prueba crea datos con nombres únicos (`zz-prueba-…`) y los borra al terminar.
- La matriz de reglas, con el nombre exacto de la prueba de cada capa, está en `docs/matriz-reglas.md`.

### Pruebas de extremo a extremo (`tools/e2e/`)
Manejan la interfaz real con Edge o Chrome sin ventana (Playwright) contra la API y la base reales, y guardan capturas a 1280 px y a 375 px en `docs/evidencias/`. Comprueban que ninguna pantalla tiene scroll horizontal. Las contraseñas llegan por variables de entorno; no están en ningún archivo.

```bash
# 1. Una vez: instalar la dependencia (solo playwright-core; no descarga navegadores)
cd tools/e2e && npm install && cd ../..

# 2. Base limpia (los guiones crean datos: ambiente, usuario y reservas)
PGPASSWORD="<clave de postgres>" CLAVE_PRUEBA="<clave de los usuarios de prueba>" bash tools/e2e/recrear-bd.sh

# 3. API y frontend en marcha (ver "Ejecutar"): API en :5263 y frontend en :5180

# 4. Ejecutar (desde tools/e2e)
cd tools/e2e && CLAVE_PRUEBA="<clave de los usuarios de prueba>" npm run fase5   # login, ambientes, usuarios y Nueva reserva
cd tools/e2e && CLAVE_PRUEBA="<clave de los usuarios de prueba>" npm run fase6   # disponibilidad, aprobar, conflicto, rechazar y cancelar (base limpia antes de cada uno)
cd tools/e2e && CLAVE_PRUEBA="<clave de los usuarios de prueba>" npm run fase7   # ayuda del ambiente y RN-07
cd tools/e2e && CLAVE_PRUEBA="<clave de los usuarios de prueba>" npm run faseai  # etiquetas, regreso y menú del detalle (capturas en docs/evidencias/fase-ai/)

# Todas las fases en orden, cada una con la base recreada y la API reiniciada (arranca y detiene la API y el frontend; los puertos 5263 y 5180 deben estar libres)
cd tools/e2e && PGPASSWORD="<clave de postgres>" CLAVE_PRUEBA="<clave de los usuarios de prueba>" npm run todo   # salida de referencia: docs/evidencias/e2e-completo.txt
```
- **Windows (PowerShell):** los ejemplos con `VAR=valor comando` no existen allí; define antes `$env:PGPASSWORD='…'; $env:CLAVE_PRUEBA='…'` y ejecuta `npm run todo` (o `npm run fase5`…). `recrear-bd.sh` y `rate-limit.sh` necesitan bash (Git Bash); `npm run todo` y `accesibilidad.mjs` no. `CLAVE_PRUEBA` debe ser la misma que el `password_prueba` con el que se creó la base.
- Los e2e y la medición de usabilidad **reescriben** las capturas e informes de `docs/evidencias/` (los archivos versionados): tras una corrida de comprobación, `git status` mostrará cambios; descártalos con `git restore docs/evidencias` si no quieres conservarlos.
- Tiempo de referencia en este equipo: `npm run todo` ≈ 100 s.
- Si no encuentra Edge ni Chrome, indica el ejecutable con `E2E_NAVEGADOR`. Otras variables: `E2E_BASE_URL` (por defecto `http://localhost:5180`) y `E2E_API_URL`.
- El login permite 5 intentos por minuto por IP: los guiones inician sesión una vez por rol y reutilizan la sesión en las capturas móviles.
- `tools/e2e/rate-limit.sh` repite los seis intentos seguidos de login (el sexto debe ser 429) contra una API recién arrancada; su resultado está en `docs/evidencias/fase5-rate-limit.txt`.
