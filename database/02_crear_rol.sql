-- Propósito: crear (o actualizar) el rol de la aplicación, sin privilegios de administración.
-- La clave NO está en este script: llega como variable de psql (app_password).
-- Se ejecuta desde la base: postgres (usuario postgres). Es idempotente.
-- Comando:
--   psql -h localhost -p 5432 -U postgres -d postgres -v ON_ERROR_STOP=1 -v app_password="<clave>" -f database/02_crear_rol.sql

-- Los scripts están en UTF-8: se fija la codificación del cliente para que psql no use la de la consola (en Windows,
-- sin esto, "á" se guardaba como "Ã¡").
\encoding UTF8

\if :{?app_password}
\else
    \echo 'Falta la variable app_password (use -v app_password=...)'
    \quit
\endif

SELECT format(
    '%s ROLE reservaupla_app LOGIN NOSUPERUSER NOCREATEDB NOCREATEROLE PASSWORD %L',
    CASE WHEN EXISTS (SELECT 1 FROM pg_roles WHERE rolname = 'reservaupla_app') THEN 'ALTER' ELSE 'CREATE' END,
    :'app_password')
\gexec

GRANT CONNECT ON DATABASE "ReservaUPLADB" TO reservaupla_app;
