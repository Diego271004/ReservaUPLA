-- Propósito: crear la base ReservaUPLADB con codificación UTF8.
-- Se ejecuta desde la base: postgres (usuario postgres).
-- Comando:
--   psql -h localhost -p 5432 -U postgres -d postgres -v ON_ERROR_STOP=1 -f database/01_crear_bd.sql

-- Los scripts están en UTF-8: se fija la codificación del cliente para que psql no use la de la consola (en Windows,
-- sin esto, "á" se guardaba como "Ã¡").
\encoding UTF8

CREATE DATABASE "ReservaUPLADB"
    WITH ENCODING = 'UTF8'
    TEMPLATE = template0;
