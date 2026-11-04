-- Propósito: eliminar la base ReservaUPLADB y el rol de la aplicación para empezar desde cero.
-- Se ejecuta desde la base: postgres (usuario postgres).
-- Comando:
--   psql -h localhost -p 5432 -U postgres -d postgres -v ON_ERROR_STOP=1 -f database/00_eliminar_bd.sql

-- Los scripts están en UTF-8: se fija la codificación del cliente para que psql no use la de la consola (en Windows,
-- sin esto, "á" se guardaba como "Ã¡").
\encoding UTF8

DROP DATABASE IF EXISTS "ReservaUPLADB" WITH (FORCE);
DROP ROLE IF EXISTS reservaupla_app;
