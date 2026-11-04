# Bitácora de evaluación

Defectos y fallos encontrados al construir y probar, cómo se corrigieron y qué prueba los cubre.

## Fase 4 — Estructura inicial y base de datos (2026-11-03)

| # | Qué falló | Cómo se corrigió | Prueba o comprobación que lo cubre |
|---|---|---|---|
| 1 | `npm install -D eslint ...` falló con `ERESOLVE`: la última versión de ESLint (10) no es compatible con `eslint-plugin-react`. | Se fijó `eslint@9` y `@eslint/js@9`. | `npm run lint` (`--max-warnings 0`) sin errores. |
| 2 | La plantilla de Vite trajo `oxlint` como linter, no ESLint. | Se desinstaló `oxlint`, se agregó `eslint.config.js` y el script `lint` usa ESLint. | `npm run lint`. |
| 3 | La prueba "abre y cierra el menú en móvil" falló: el botón "Menú" está oculto por CSS (`display: none` fuera de móvil) y `getByRole` no lo encuentra. Es un error de la prueba, no del producto (jsdom no evalúa `@media`). | La prueba localiza el botón con `getByText('Menú', { selector: 'button' })`. | `src/App.test.jsx`, prueba del menú móvil. |
| 4 | Al probar la API con `dotnet run --no-build` después de `dotnet user-secrets init`, la API se cerró con "Falta la cadena de conexión 'ReservaUPLADB'": el binario era anterior al `UserSecretsId`, así que no cargaba los secretos. | Se recompiló con `dotnet build` y se volvió a ejecutar. | `GET /api/salud` devuelve 200 con la base real; con una base inexistente devuelve 503 sin detalles internos. |
| 5 | Los scripts SQL y los archivos del backend no se crearon la primera vez: el comando con heredocs largos falló en la terminal y no escribió nada. | Se detectó al listar la carpeta (estaba vacía) y se crearon los archivos uno por uno. | `ls database/` y `dotnet build` sin errores. |

Defecto de la base de datos: ninguno. Las restricciones RN-01, RN-03 y RN-04 se comprobaron con `database/07_pruebas_reglas.sql`, que falla si la base acepta lo que debe rechazar.

## Observaciones sin corregir
- `npm audit` informa 7 vulnerabilidades moderadas, todas en dependencias de desarrollo (cadena `eslint` / `minimatch`). No llegan al paquete que se compila. Se revisan al cierre del proyecto.
