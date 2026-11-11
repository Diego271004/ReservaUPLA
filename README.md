# ReservaUPLA

Sistema web de reservas de ambientes de la Universidad Peruana Los Andes (caso práctico del curso Construcción de Software). Backend en ASP.NET Core (.NET 8), base de datos PostgreSQL y frontend en React + Vite.

```
backend/    ReservaUPLA.Domain · .Application · .Infrastructure · .API · .Application.Tests
frontend/   React + Vite (JavaScript)
database/   scripts SQL numerados, ejecutados con psql
tools/      pruebas de extremo a extremo (e2e)
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
- `07_datos_demo.sql` (opcional): puebla la base con reservas activas en fechas relativas (`CURRENT_DATE` y días siguientes) para Solicitante, Responsable y Administrador (aprobadas, pendientes y un conflicto 409 de prueba). Es idempotente y no requiere contraseñas:
  ```powershell
  psql @psql -d ReservaUPLADB -f database/07_datos_demo.sql
  ```
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

## Qué incluye el sistema
- **Roles:** Administrador (gestiona ambientes y usuarios, aprueba y rechaza reservas), Solicitante (pide y cancela sus reservas) y Responsable de ambiente (solo consulta).
- **Pantallas:** inicio de sesión, inicio con indicadores, listado de reservas con filtros, detalle con historial, disponibilidad diaria, nueva reserva, ambientes y usuarios (listado y alta), y «Mi ambiente».
- **Reglas de negocio RN-01 a RN-07:** se validan en frontend, backend y base de datos. Los mensajes son los mismos en `MensajesValidacion.cs` y en `frontend/src/constants/messages.js`.
- **Seguridad:** contraseñas con hash BCrypt, JWT, máximo 5 intentos de inicio de sesión por minuto y por IP (el sexto recibe 429), mismo mensaje para correo inexistente, inactivo o clave incorrecta, y rol de PostgreSQL de mínimo privilegio.
- **Componentes reutilizables** (`frontend/src/components/ui`): TextInput, SelectInput, DateInput, TimeInput, Button, AlertMessage, ModalConfirmacion, TableList y CardIndicador.
- **Endpoints principales:** `POST /api/auth/login`, `GET /api/auth/me`, `GET|POST /api/usuarios`, `GET|POST /api/ambientes`, `GET|POST /api/reservas`, `GET /api/reservas/{id}`, `GET /api/reservas/disponibilidad`, `POST /api/reservas/{id}/aprobar|rechazar|cancelar`, `GET /api/dashboard`, `GET /api/mi-ambiente` y `GET /api/salud`. Errores: 400 con errores por campo, 401, 403, 404, 409 y 429.

## Datos de prueba
`database/05_datos_prueba.sql` crea tres usuarios de ejemplo; la contraseña de los tres es la que se pasa en `password_prueba` al ejecutar el script (elige la tuya, no se guarda en el repositorio). Los correos son de ejemplo (`@upla.edu.pe`, dominio por confirmar).

| Persona | Correo | Rol |
|---|---|---|
| Carla Rojas | carla.rojas@upla.edu.pe | Administrador |
| Ana Torres | ana.torres@upla.edu.pe | Solicitante |
| Mario Huamán | mario.huaman@upla.edu.pe | Responsable |

Ambientes de ejemplo: «Laboratorio de Cómputo 2», «Auditorio Principal» y «Sala de Reuniones A» (en mantenimiento). Para tener reservas de muestra, ejecuta `database/07_datos_demo.sql`.

## Pruebas
```bash
cd backend  && dotnet build ReservaUPLA.sln && dotnet test ReservaUPLA.sln && dotnet format ReservaUPLA.sln --verify-no-changes
cd frontend && npm run build && npm run lint && npm run test
```
- `ReservaUPLA.Application.Tests`: servicios, validadores y arquitectura (Application no referencia Infrastructure), con repositorios falsos.
- `ReservaUPLA.Infrastructure.Tests`: BCrypt (incluye un hash `$2a$` de pgcrypto) y token JWT.
- `ReservaUPLA.API.Tests`: login (400, 401, 200, 429), autorización por rol, ProblemDetails y CORS, con la API en memoria.
- `frontend`: Vitest y React Testing Library; campos, botones, mensajes, modales, estados y navegación con teclado.
- `database/07_pruebas_reglas.sql`: prueba RN-01, RN-03 y RN-04 directamente en PostgreSQL y no deja datos.
- **Pruebas con la base real** (se omiten si faltan las variables): con la base creada por los scripts 00 a 06, define `RESERVAUPLA_PRUEBAS_BD_ADMIN` y `RESERVAUPLA_PRUEBAS_BD_APP` (cadenas de conexión del superusuario y del rol de la aplicación) y ejecuta `dotnet test`.

### Pruebas de extremo a extremo (`tools/e2e/`)
Manejan la interfaz real con Edge o Chrome (Playwright) contra la API y la base reales. Las contraseñas llegan por variables de entorno.
```bash
cd tools/e2e && npm install
PGPASSWORD="<clave de postgres>" CLAVE_PRUEBA="<clave de los usuarios de prueba>" npm run todo   # arranca API y frontend (puertos 5263 y 5180 libres)
```
`CLAVE_PRUEBA` debe ser la misma `password_prueba` con la que se creó la base. Si no encuentra Edge ni Chrome, indica el ejecutable con `E2E_NAVEGADOR`.

