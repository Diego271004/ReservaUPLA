-- Propósito: dar al rol de la aplicación solo lo necesario (sin DELETE ni DDL).
-- Se ejecuta desde la base: ReservaUPLADB (usuario postgres). Es idempotente.
-- Comando:
--   psql -h localhost -p 5432 -U postgres -d ReservaUPLADB -v ON_ERROR_STOP=1 -f database/04_permisos.sql

-- Los scripts están en UTF-8: se fija la codificación del cliente para que psql no use la de la consola (en Windows,
-- sin esto, "á" se guardaba como "Ã¡").
\encoding UTF8

REVOKE ALL ON ALL TABLES IN SCHEMA public FROM reservaupla_app;
REVOKE CREATE ON SCHEMA public FROM PUBLIC;

GRANT USAGE ON SCHEMA public TO reservaupla_app;
GRANT SELECT, INSERT, UPDATE ON usuarios, ambientes, reservas TO reservaupla_app;
GRANT SELECT, INSERT ON historial_reserva TO reservaupla_app;
GRANT USAGE, SELECT ON ALL SEQUENCES IN SCHEMA public TO reservaupla_app;
