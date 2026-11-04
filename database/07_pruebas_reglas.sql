-- Propósito: demostrar que la base hace cumplir RN-01, RN-03 y RN-04. No deja datos (todo termina en ROLLBACK).
-- Si una regla no rechaza lo que debe rechazar, el script falla.
-- Se ejecuta desde la base: ReservaUPLADB (usuario postgres). Es idempotente.
-- Comando:
--   psql -h localhost -p 5432 -U postgres -d ReservaUPLADB -v ON_ERROR_STOP=1 -f database/07_pruebas_reglas.sql

BEGIN;

INSERT INTO usuarios (nombre_completo, correo, rol, contrasena_hash)
VALUES ('Usuario de prueba', 'prueba.reglas@upla.edu.pe', 'Solicitante', 'hash-de-prueba');
INSERT INTO ambientes (nombre, tipo, capacidad, ubicacion)
VALUES ('Ambiente de prueba', 'Sala', 10, 'Ubicación de prueba');

-- Intenta crear una reserva de prueba en el ambiente de prueba (el 15/01/2027).
CREATE FUNCTION pg_temp.insertar(p_estado text, p_inicio time, p_fin time) RETURNS void
LANGUAGE sql AS $$
    INSERT INTO reservas (fecha, hora_inicio, hora_fin, motivo, estado, usuario_id, ambiente_id)
    VALUES ('2027-01-15', p_inicio, p_fin, 'Prueba', p_estado,
            (SELECT id FROM usuarios WHERE correo = 'prueba.reglas@upla.edu.pe'),
            (SELECT id FROM ambientes WHERE nombre = 'Ambiente de prueba'));
$$;

-- La base debe rechazarla por la restricción indicada.
CREATE FUNCTION pg_temp.debe_fallar(p_nombre text, p_estado text, p_inicio time, p_fin time, p_restriccion text) RETURNS void
LANGUAGE plpgsql AS $$
BEGIN
    BEGIN
        PERFORM pg_temp.insertar(p_estado, p_inicio, p_fin);
    EXCEPTION WHEN OTHERS THEN
        IF SQLERRM LIKE '%' || p_restriccion || '%' THEN
            RAISE NOTICE 'OK  rechazada: %', p_nombre;
            RETURN;
        END IF;
        RAISE EXCEPTION 'FALLO %: error inesperado: %', p_nombre, SQLERRM;
    END;
    RAISE EXCEPTION 'FALLO %: la base aceptó lo que debía rechazar', p_nombre;
END $$;

-- La base debe aceptarla.
CREATE FUNCTION pg_temp.debe_pasar(p_nombre text, p_estado text, p_inicio time, p_fin time) RETURNS void
LANGUAGE plpgsql AS $$
BEGIN
    PERFORM pg_temp.insertar(p_estado, p_inicio, p_fin);
    RAISE NOTICE 'OK  aceptada:  %', p_nombre;
END $$;

-- RN-01
SELECT pg_temp.debe_pasar('primera Aprobada 10:00-12:00', 'Aprobada', '10:00', '12:00');
SELECT pg_temp.debe_fallar('RN-01 segunda Aprobada que se cruza 11:00-13:00', 'Aprobada', '11:00', '13:00', 'ex_reservas_aprobadas_sin_cruce');
SELECT pg_temp.debe_pasar('Aprobada contigua 12:00-14:00 (no se cruza)', 'Aprobada', '12:00', '14:00');
SELECT pg_temp.debe_pasar('Pendiente 10:30-11:30 que se cruza con una Aprobada', 'Pendiente', '10:30', '11:30');
SELECT pg_temp.debe_pasar('otra Pendiente 10:30-11:30 que se cruza con la anterior', 'Pendiente', '10:30', '11:30');
-- RN-03
SELECT pg_temp.debe_fallar('RN-03 hora_fin igual a hora_inicio', 'Pendiente', '09:00', '09:00', 'ck_reservas_fin_mayor_que_inicio');
SELECT pg_temp.debe_fallar('RN-03 hora_fin menor que hora_inicio', 'Pendiente', '10:00', '09:00', 'ck_reservas_fin_mayor_que_inicio');
-- RN-04
SELECT pg_temp.debe_fallar('RN-04 inicio antes de las 07:00', 'Pendiente', '06:30', '08:00', 'ck_reservas_horario_permitido');
SELECT pg_temp.debe_fallar('RN-04 fin después de las 22:00', 'Pendiente', '21:00', '22:30', 'ck_reservas_horario_permitido');
SELECT pg_temp.debe_pasar('RN-04 límites exactos 07:00-22:00', 'Pendiente', '07:00', '22:00');

ROLLBACK;
