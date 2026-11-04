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
- `07_pruebas_reglas.sql` comprueba RN-01, RN-03 y RN-04 y no deja datos (termina en `ROLLBACK`).
- Si PostgreSQL pide clave en cada comando, define `PGPASSWORD` como arriba (solo en esa sesión de terminal).

## Secretos (`dotnet user-secrets`)
La cadena de conexión y la clave JWT no están en el repositorio. Desde `backend/`:

```bash
dotnet user-secrets set "ConnectionStrings:ReservaUPLADB" "Host=localhost;Port=5432;Database=ReservaUPLADB;Username=reservaupla_app;Password=<clave del rol reservaupla_app>" --project ReservaUPLA.API/ReservaUPLA.API.csproj
dotnet user-secrets set "Jwt:Key" "<clave aleatoria de 64 caracteres o más>" --project ReservaUPLA.API/ReservaUPLA.API.csproj
```

La clave del rol debe ser la misma que se pasó en `02_crear_rol.sql`.

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

El frontend reenvía `/api` a `http://localhost:5263`. Si la API usa otra dirección, define `VITE_API_URL` antes de `npm run dev`. La página inicial muestra el resultado de `GET /api/salud`.

## Datos de prueba
Los scripts crean tres usuarios con el mismo correo institucional de ejemplo (`@upla.edu.pe`, por confirmar). La contraseña de los tres es la que se pasó en `password_prueba`; con los valores de desarrollo de este equipo:

| Persona | Correo | Rol | Contraseña |
|---|---|---|---|
| Carla Rojas | carla.rojas@upla.edu.pe | Administrador | `Prueba#2026Upla` |
| Ana Torres | ana.torres@upla.edu.pe | Solicitante | `Prueba#2026Upla` |
| Mario Huamán | mario.huaman@upla.edu.pe | Responsable | `Prueba#2026Upla` |

Son datos de desarrollo: no se usan fuera de este equipo. Ambientes: "Laboratorio de Cómputo 2", "Auditorio Principal" y "Sala de Reuniones A" (en mantenimiento). Hay seis reservas de ejemplo en noviembre de 2026.

## Pruebas
```bash
cd backend  && dotnet build ReservaUPLA.sln && dotnet test ReservaUPLA.sln && dotnet format ReservaUPLA.sln --verify-no-changes
cd frontend && npm run build && npm run lint && npm run test
```
Reglas de la base de datos: `database/07_pruebas_reglas.sql` (ver arriba).
