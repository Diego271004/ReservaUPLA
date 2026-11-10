import { PageBreak, Paragraph } from 'docx'
import { figuras, h1, h2, p, tabla, vinetas } from '../lib/word.js'
import { CUENTAS } from '../lib/datos.js'

const salto = () => new Paragraph({ children: [new PageBreak()] })

/** Anexo A: cómo levantar el sistema, las cuentas de prueba y los documentos de evidencia. */
export function anexoEjecucion() {
  return [
    salto(),
    h1('Anexo A. Cómo ejecutar el sistema'),
    h2('A.1 Requisitos'),
    ...vinetas([
      '.NET 8, Node.js 20 o superior, PostgreSQL 16 o superior (con `psql`) y Git. En este equipo, PostgreSQL 18 escucha en `localhost:5432`.',
    ]),
    h2('A.2 Base de datos (por terminal, desde la raíz del repositorio)'),
    p('En PowerShell. La clave de `postgres` se define solo para la sesión; la del rol de la aplicación debe tener 24 caracteres o más y guardarse solo en `user-secrets`.'),
    p('`$env:PGPASSWORD = \'<clave de postgres>\'`'),
    p('`$psql = @(\'-h\',\'localhost\',\'-p\',\'5432\',\'-U\',\'postgres\',\'-v\',\'ON_ERROR_STOP=1\')`'),
    p('`psql @psql -d postgres -f database/00_eliminar_bd.sql`'),
    p('`psql @psql -d postgres -f database/01_crear_bd.sql`'),
    p('`psql @psql -d postgres -v app_password="<clave del rol>" -f database/02_crear_rol.sql`'),
    p('`psql @psql -d ReservaUPLADB -f database/03_crear_tablas.sql`'),
    p('`psql @psql -d ReservaUPLADB -f database/04_permisos.sql`'),
    p('`psql @psql -d ReservaUPLADB -v password_prueba="<clave de prueba>" -f database/05_datos_prueba.sql`'),
    p('`psql @psql -d ReservaUPLADB -f database/06_verificacion.sql`'),
    p('`psql @psql -d ReservaUPLADB -f database/07_datos_demo.sql` (opcional: reservas con fechas de hoy para la demostración)'),
    h2('A.3 Secretos'),
    p('Desde `backend/`:'),
    p('`dotnet user-secrets set "ConnectionStrings:ReservaUPLADB" "Host=localhost;Port=5432;Database=ReservaUPLADB;Username=reservaupla_app;Password=<clave del rol>" --project ReservaUPLA.API/ReservaUPLA.API.csproj`'),
    p('`dotnet user-secrets set "Jwt:Key" "<cadena aleatoria de 64 caracteres o más>" --project ReservaUPLA.API/ReservaUPLA.API.csproj`'),
    h2('A.4 Backend y frontend'),
    p('Terminal 1 (API en `http://localhost:5263`): `cd backend` y luego `$env:ASPNETCORE_ENVIRONMENT=\'Development\'; dotnet run --project ReservaUPLA.API/ReservaUPLA.API.csproj --urls http://localhost:5263`.'),
    p('Terminal 2 (frontend en `http://localhost:5180`): `cd frontend`, `npm install` y `npm run dev`.'),
    h2('A.5 Cuentas de prueba'),
    p('La contraseña de las tres cuentas está en la sección «Datos de prueba» del README del repositorio (no se repite aquí: son datos de prueba solo para el entorno de desarrollo). El inicio de sesión permite cinco intentos por minuto.'),
    ...tabla(['Rol', 'Correo', 'Nombre'], CUENTAS.map(([rol, correo, nombre]) => [rol, `\`${correo}\``, nombre]), [0.3, 0.45, 0.25]),
    h2('A.6 Pruebas'),
    p('Frontend: `cd frontend; npm run lint; npm test; npm run build`. Backend: `cd backend; dotnet test ReservaUPLA.sln` (las pruebas con base real necesitan las variables `RESERVAUPLA_PRUEBAS_BD_ADMIN` y `RESERVAUPLA_PRUEBAS_BD_APP`). Base de datos: `psql @psql -d ReservaUPLADB -f database/07_pruebas_reglas.sql`. Extremo a extremo y accesibilidad: `cd tools/e2e; npm run todo` y `cd tools/usabilidad; node accesibilidad.mjs`.'),
    h2('A.7 Documentos de evidencia en el repositorio'),
    ...tabla(
      ['Documento', 'Contenido'],
      [
        ['`docs/01-analisis.md`, `02-ciclo-de-vida.md`, `03-estandares.md`', 'Semanas 01 a 03'],
        ['`docs/matriz-reglas.md`', 'Cada regla, en cada capa, con el nombre exacto de la prueba que la rompe a propósito'],
        ['`docs/reutilizacion.md`', 'Duplicación antes y después y componentes por pantalla'],
        ['`docs/bitacora-evaluacion.md`', 'Cada defecto hallado, su corrección y la prueba que lo cubre'],
        ['`docs/diseno/` y `docs/usabilidad/`', 'Identidad visual, experiencia, componentes, matriz de principios y plan de prueba de usabilidad'],
        ['`docs/evidencias/`', 'Capturas, informes de accesibilidad y de peso'],
      ],
      [0.4, 0.6],
    ),
  ]
}

/** Anexo B: índice de figuras (lo arma el registro de figuras, con su sección y si la captura existe). */
export function anexoFiguras() {
  return [
    salto(),
    h1('Anexo B. Índice de figuras'),
    p('Las capturas son del sistema real en marcha (con la base cargada con `database/07_datos_demo.sql`) y las genera `tools/generar-informe/capturas.mjs`; los archivos están en `docs/evidencias/informe/`.'),
    ...tabla(
      ['Figura', 'Título', 'Sección', 'Archivo'],
      figuras.map((f) => [String(f.n), f.titulo, f.seccion, `\`${f.archivo}\`${f.hecha ? '' : ' **(falta)**'}`]),
      [0.09, 0.51, 0.1, 0.3],
    ),
  ]
}
