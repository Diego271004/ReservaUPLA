#!/bin/bash
# Recrea la base ReservaUPLADB desde cero con los scripts de database/ (00 a 06) para empezar una prueba limpia.
# Uso: PGPASSWORD="<clave de postgres>" CLAVE_PRUEBA="<clave de los usuarios de prueba>" bash tools/e2e/recrear-bd.sh
# La clave del rol reservaupla_app se lee de los user-secrets de la API (no se imprime).
set -e
: "${PGPASSWORD:?Falta la variable PGPASSWORD (clave de postgres)}"
: "${CLAVE_PRUEBA:?Falta la variable CLAVE_PRUEBA}"
cd "$(dirname "$0")/../.."
PSQL="psql -h localhost -p 5432 -U postgres -v ON_ERROR_STOP=1 -q"
CLAVE_ROL=$(dotnet user-secrets list --project backend/ReservaUPLA.API/ReservaUPLA.API.csproj | grep -o 'Password=[^;]*' | cut -d= -f2)

$PSQL -d postgres -f database/00_eliminar_bd.sql
$PSQL -d postgres -f database/01_crear_bd.sql
$PSQL -d postgres -v app_password="$CLAVE_ROL" -f database/02_crear_rol.sql
$PSQL -d ReservaUPLADB -f database/03_crear_tablas.sql
$PSQL -d ReservaUPLADB -f database/04_permisos.sql
$PSQL -d ReservaUPLADB -v password_prueba="$CLAVE_PRUEBA" -f database/05_datos_prueba.sql
$PSQL -d ReservaUPLADB -f database/06_verificacion.sql > /dev/null
echo "Base ReservaUPLADB recreada (scripts 00 a 06)."
