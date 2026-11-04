# 03. Manual de estándares del proyecto (Semana 03)

Reglas breves y comprobables. Si una regla no se puede verificar, no está aquí.

## 1. Nombres

| Elemento | Regla | Ejemplo |
|---|---|---|
| Dominio | En español | `Reserva`, `Ambiente`, `HoraInicio` |
| Términos técnicos | En inglés cuando son convención | `ReservaController`, `ReservaRepository`, `ReservaService`, `CrearReservaDto` |
| Clases y métodos de C# | PascalCase | `ValidarDisponibilidad` |
| Variables y parámetros de C# | camelCase; los campos privados con guion bajo | `horaInicio`, `_repositorio` |
| Interfaces | Prefijo `I` | `IReservaRepository` |
| Componentes de React | PascalCase, un componente por archivo | `TextInput.jsx` |
| Hooks y funciones de JavaScript | `useXxx` para hooks, camelCase para funciones | `useReservaForm`, `validarHoras` |
| Tablas y columnas SQL | snake_case en minúsculas; tablas en plural | `reservas`, `hora_inicio` |
| Nombres | Dicen qué hacen; sin abreviaturas ni `data`, `temp`, `x` | `reservasPendientes`, no `lst2` |

## 2. Carpetas

```
ReservaUPLA/
├── backend/        Domain, Application, Infrastructure, API y pruebas (una carpeta por proyecto)
├── frontend/       src/ con components/ui, pages, hooks, services, utils, constants
├── database/       scripts SQL numerados, ejecutados con psql
└── docs/           análisis, ciclo de vida, estándares e informe
```

Dependencias entre capas del backend: `Application` depende de `Domain`; `Infrastructure` depende de `Application` y `Domain`; `API` depende de `Application` e `Infrastructure`. **`Application` nunca referencia `Infrastructure`.**

## 3. Base de datos

- Se crea **por terminal con `psql`** y scripts numerados (`00` eliminar, `01` crear base, `02` crear rol, `03` tablas, `04` permisos, `05` datos de prueba, `06` verificación). No se usan migraciones ni se crean tablas desde el código.
- Cada script empieza con un comentario: propósito, desde qué base se ejecuta y el comando.
- La aplicación se conecta con un rol de mínimo privilegio, no con `postgres`.
- Los scripts no contienen claves: la contraseña del rol llega como variable de `psql`.

## 4. Commits

Formato: `tipo: descripción en presente y en español`.

| Tipo | Se usa para |
|---|---|
| `feat` | Una funcionalidad nueva |
| `fix` | Corregir un error |
| `refactor` | Reorganizar código sin cambiar lo que hace |
| `test` | Agregar o ajustar pruebas |
| `docs` | Documentación |
| `chore` | Estructura, configuración o dependencias |

Ejemplo: `feat: valida que la hora de fin sea mayor que la de inicio`. Un commit hace una sola cosa y no mezcla cambios de temas distintos.

## 5. Ramas

- `main` siempre funciona: compila y sus pruebas pasan.
- El trabajo se hace en ramas `feature/<tema>` (por ejemplo `feature/formulario-reserva`) o `fix/<tema>`, y se une a `main` cuando las pruebas pasan.

## 6. Calidad

| Verificación | Herramienta | Criterio |
|---|---|---|
| Formato del backend | `dotnet format` | Sin cambios pendientes |
| Estilo del frontend | ESLint y Prettier | ESLint sin advertencias (`--max-warnings 0`), Prettier sin cambios pendientes |
| Pruebas | xUnit (backend) y Vitest (frontend) | Todas aprobadas antes de unir a `main` |
| Duplicación | Revisión al refactorizar | Lo que se repite en dos lugares pasa a un componente o función compartida |
| Tamaño | Revisión | Un archivo hace una sola cosa; si crece sin control, se divide |

## 7. Seguridad y secretos

- Contraseñas siempre como hash BCrypt, nunca en texto plano ni en los registros.
- Cadena de conexión y clave del token en `dotnet user-secrets`, nunca en el repositorio.
- Los mensajes de error no revelan información interna.
