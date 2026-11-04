-- Propósito: crear la base ReservaUPLADB con codificación UTF8.
-- Se ejecuta desde la base: postgres (usuario postgres).
-- Comando:
--   psql -h localhost -p 5432 -U postgres -d postgres -v ON_ERROR_STOP=1 -f database/01_crear_bd.sql

CREATE DATABASE "ReservaUPLADB"
    WITH ENCODING = 'UTF8'
    TEMPLATE = template0;
