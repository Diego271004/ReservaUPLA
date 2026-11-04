-- Propósito: demostrar que la base hace cumplir RN-01, RN-03 y RN-04. No deja datos (todo termina en ROLLBACK).
-- Si una regla no rechaza lo que debe rechazar, el script falla.
-- Se ejecuta desde la base: ReservaUPLADB (usuario postgres). Es idempotente.
-- Comando:
--   psql -h localhost -p 5432 -U postgres -d ReservaUPLADB -v ON_ERROR_STOP=1 -f database/07_pruebas_reglas.sql

-- Los scripts están en UTF-8: se fija la codificación del cliente para que psql no use la de la consola (en Windows,
-- sin esto, "á" se guardaba como "Ã¡").
\encoding UTF8

BEGIN;

INSERT INTO usuarios (nombre_completo, correo, rol, contrasena_hash)
VALUES ('Usuario de prueba', 'prueba.reglas@upla.edu.pe', 'Solicitante', '$2a$11$' || repeat('x', 53));
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

-- ===================================================================== Fase 6
-- Ayudas: ejecutar una sentencia y comprobar el SQLSTATE (y parte del mensaje) con que la base la rechaza.
CREATE FUNCTION pg_temp.debe_fallar_sql(p_nombre text, p_sentencia text, p_sqlstate text, p_texto text DEFAULT '') RETURNS void
LANGUAGE plpgsql AS $$
BEGIN
    BEGIN
        EXECUTE p_sentencia;
    EXCEPTION WHEN OTHERS THEN
        IF SQLSTATE = p_sqlstate AND SQLERRM LIKE '%' || p_texto || '%' THEN
            RAISE NOTICE 'OK  rechazada: % (SQLSTATE %)', p_nombre, SQLSTATE;
            RETURN;
        END IF;
        RAISE EXCEPTION 'FALLO %: error inesperado (SQLSTATE %): %', p_nombre, SQLSTATE, SQLERRM;
    END;
    RAISE EXCEPTION 'FALLO %: la base aceptó lo que debía rechazar', p_nombre;
END $$;

CREATE FUNCTION pg_temp.debe_pasar_sql(p_nombre text, p_sentencia text) RETURNS void
LANGUAGE plpgsql AS $$
BEGIN
    EXECUTE p_sentencia;
    RAISE NOTICE 'OK  aceptada:  %', p_nombre;
END $$;

INSERT INTO usuarios (nombre_completo, correo, rol, contrasena_hash)
VALUES ('Administrador de prueba', 'admin.reglas@upla.edu.pe', 'Administrador', '$2a$11$' || repeat('x', 53)),
       ('Otra solicitante de prueba', 'otra.reglas@upla.edu.pe', 'Solicitante', '$2a$11$' || repeat('x', 53));

-- Crea una reserva de prueba en una fecha y la identifica por su motivo (etiqueta).
CREATE FUNCTION pg_temp.nueva(p_fecha date, p_inicio time, p_fin time, p_estado text, p_etiqueta text) RETURNS void
LANGUAGE sql AS $$
    INSERT INTO reservas (fecha, hora_inicio, hora_fin, motivo, estado, usuario_id, ambiente_id)
    VALUES (p_fecha, p_inicio, p_fin, p_etiqueta, p_estado,
            (SELECT id FROM usuarios WHERE correo = 'prueba.reglas@upla.edu.pe'),
            (SELECT id FROM ambientes WHERE nombre = 'Ambiente de prueba'));
$$;

-- RN-02: cada campo obligatorio rechaza NULL (NOT NULL, SQLSTATE 23502).
CREATE FUNCTION pg_temp.insertar_con_nulo(p_columna text) RETURNS void
LANGUAGE plpgsql AS $$
DECLARE
    v jsonb := jsonb_build_object(
        'fecha', '2027-02-01', 'hora_inicio', '09:00', 'hora_fin', '10:00', 'motivo', 'Prueba',
        'usuario_id', (SELECT id FROM usuarios WHERE correo = 'prueba.reglas@upla.edu.pe'),
        'ambiente_id', (SELECT id FROM ambientes WHERE nombre = 'Ambiente de prueba'));
BEGIN
    v := jsonb_set(v, ARRAY[p_columna], 'null'::jsonb);
    INSERT INTO reservas (fecha, hora_inicio, hora_fin, motivo, usuario_id, ambiente_id)
    VALUES ((v ->> 'fecha')::date, (v ->> 'hora_inicio')::time, (v ->> 'hora_fin')::time, v ->> 'motivo',
            (v ->> 'usuario_id')::int, (v ->> 'ambiente_id')::int);
END $$;

SELECT pg_temp.debe_fallar_sql('RN-02 ' || columna || ' es obligatorio',
                               format('SELECT pg_temp.insertar_con_nulo(%L)', columna), '23502', columna)
FROM unnest(ARRAY['fecha', 'hora_inicio', 'hora_fin', 'motivo', 'usuario_id', 'ambiente_id']) AS columna;

-- RN-01 con el SQLSTATE exacto (23P01 = exclusion_violation) y por INSERT y por UPDATE.
SELECT pg_temp.debe_pasar_sql('RN-01 Aprobada A1 10:00-12:00 (10/02/2027)',
    $q$SELECT pg_temp.nueva('2027-02-10', '10:00', '12:00', 'Aprobada', 'A1')$q$);
SELECT pg_temp.debe_pasar_sql('RN-01 Pendiente P1 11:00-13:00 que se cruza con A1',
    $q$SELECT pg_temp.nueva('2027-02-10', '11:00', '13:00', 'Pendiente', 'P1')$q$);
SELECT pg_temp.debe_fallar_sql('RN-01 INSERT de otra Aprobada que se cruza (23P01)',
    $q$SELECT pg_temp.nueva('2027-02-10', '11:30', '12:30', 'Aprobada', 'A2')$q$, '23P01');
SELECT pg_temp.debe_fallar_sql('RN-01 UPDATE que aprueba P1 mientras A1 sigue Aprobada (23P01)',
    $q$UPDATE reservas SET estado = 'Aprobada' WHERE motivo = 'P1'$q$, '23P01');
SELECT pg_temp.debe_pasar_sql('Cancelar A1 libera el horario',
    $q$UPDATE reservas SET estado = 'Cancelada' WHERE motivo = 'A1'$q$);
SELECT pg_temp.debe_pasar_sql('RN-01 ahora sí se puede aprobar P1',
    $q$UPDATE reservas SET estado = 'Aprobada' WHERE motivo = 'P1'$q$);

-- RN-06 y transiciones: Rechazada y Cancelada no se modifican; solo Pendiente → Aprobada/Rechazada/Cancelada y Aprobada → Cancelada.
SELECT pg_temp.nueva('2027-02-11', '09:00', '10:00', 'Rechazada', 'R1');
SELECT pg_temp.nueva('2027-02-11', '10:00', '11:00', 'Cancelada', 'C1');
SELECT pg_temp.debe_fallar_sql('RN-06 una Rechazada no pasa a Aprobada',
    $q$UPDATE reservas SET estado = 'Aprobada' WHERE motivo = 'R1'$q$, 'P0001', 'RN-06');
SELECT pg_temp.debe_fallar_sql('RN-06 una Rechazada no vuelve a Pendiente',
    $q$UPDATE reservas SET estado = 'Pendiente' WHERE motivo = 'R1'$q$, 'P0001', 'RN-06');
SELECT pg_temp.debe_fallar_sql('RN-06 una Rechazada no se cancela',
    $q$UPDATE reservas SET estado = 'Cancelada' WHERE motivo = 'R1'$q$, 'P0001', 'RN-06');
SELECT pg_temp.debe_fallar_sql('RN-06 una Rechazada no cambia ningún dato (motivo)',
    $q$UPDATE reservas SET motivo = 'cambiado' WHERE motivo = 'R1'$q$, 'P0001', 'RN-06');
SELECT pg_temp.debe_fallar_sql('RN-06 una Cancelada no pasa a Aprobada',
    $q$UPDATE reservas SET estado = 'Aprobada' WHERE motivo = 'C1'$q$, 'P0001', 'RN-06');
SELECT pg_temp.debe_fallar_sql('transición Aprobada → Rechazada no permitida',
    $q$UPDATE reservas SET estado = 'Rechazada' WHERE motivo = 'P1'$q$, 'P0001', 'Transición');
SELECT pg_temp.debe_fallar_sql('transición Aprobada → Pendiente no permitida',
    $q$UPDATE reservas SET estado = 'Pendiente' WHERE motivo = 'P1'$q$, 'P0001', 'Transición');
SELECT pg_temp.debe_pasar_sql('Aprobada → Cancelada sí se permite',
    $q$UPDATE reservas SET estado = 'Cancelada' WHERE motivo = 'P1'$q$);

-- RN-05: solo un Administrador deja constancia de aprobar o rechazar; cancela el dueño o un Administrador.
SELECT pg_temp.nueva('2027-02-12', '09:00', '10:00', 'Pendiente', 'P2');
SELECT pg_temp.debe_fallar_sql('RN-05 un Solicitante no registra la aprobación',
    $q$INSERT INTO historial_reserva (reserva_id, estado_anterior, estado_nuevo, usuario_id)
       VALUES ((SELECT id FROM reservas WHERE motivo = 'P2'), 'Pendiente', 'Aprobada',
               (SELECT id FROM usuarios WHERE correo = 'prueba.reglas@upla.edu.pe'))$q$, 'P0001', 'RN-05');
SELECT pg_temp.debe_fallar_sql('RN-05 un Solicitante no registra el rechazo',
    $q$INSERT INTO historial_reserva (reserva_id, estado_anterior, estado_nuevo, usuario_id)
       VALUES ((SELECT id FROM reservas WHERE motivo = 'P2'), 'Pendiente', 'Rechazada',
               (SELECT id FROM usuarios WHERE correo = 'prueba.reglas@upla.edu.pe'))$q$, 'P0001', 'RN-05');
SELECT pg_temp.debe_pasar_sql('RN-05 el Administrador sí registra la aprobación',
    $q$INSERT INTO historial_reserva (reserva_id, estado_anterior, estado_nuevo, usuario_id)
       VALUES ((SELECT id FROM reservas WHERE motivo = 'P2'), 'Pendiente', 'Aprobada',
               (SELECT id FROM usuarios WHERE correo = 'admin.reglas@upla.edu.pe'))$q$);
SELECT pg_temp.debe_fallar_sql('otra Solicitante no cancela una reserva ajena',
    $q$INSERT INTO historial_reserva (reserva_id, estado_anterior, estado_nuevo, usuario_id)
       VALUES ((SELECT id FROM reservas WHERE motivo = 'P2'), 'Aprobada', 'Cancelada',
               (SELECT id FROM usuarios WHERE correo = 'otra.reglas@upla.edu.pe'))$q$, 'P0001', 'cancela');
SELECT pg_temp.debe_pasar_sql('el dueño sí cancela su reserva',
    $q$INSERT INTO historial_reserva (reserva_id, estado_anterior, estado_nuevo, usuario_id)
       VALUES ((SELECT id FROM reservas WHERE motivo = 'P2'), 'Aprobada', 'Cancelada',
               (SELECT id FROM usuarios WHERE correo = 'prueba.reglas@upla.edu.pe'))$q$);

-- Ambiente en mantenimiento (decisión 4 del análisis): no admite reservas nuevas.
INSERT INTO ambientes (nombre, tipo, capacidad, ubicacion, estado)
VALUES ('Ambiente en mantenimiento de prueba', 'Sala', 10, 'Ubicación de prueba', 'En mantenimiento');
SELECT pg_temp.debe_fallar_sql('mantenimiento: la base no acepta una reserva nueva en un ambiente en mantenimiento',
    $q$INSERT INTO reservas (fecha, hora_inicio, hora_fin, motivo, usuario_id, ambiente_id)
       VALUES ('2027-03-01', '09:00', '10:00', 'x',
               (SELECT id FROM usuarios WHERE correo = 'prueba.reglas@upla.edu.pe'),
               (SELECT id FROM ambientes WHERE nombre = 'Ambiente en mantenimiento de prueba'))$q$, 'P0001', 'mantenimiento');

-- Contraseñas (U2): la política se valida en la aplicación antes de guardar; la base solo acepta un hash BCrypt, nunca texto.
SELECT pg_temp.debe_fallar_sql('la base no acepta una contraseña en texto plano',
    $q$INSERT INTO usuarios (nombre_completo, correo, rol, contrasena_hash)
       VALUES ('Texto plano', 'texto.plano@upla.edu.pe', 'Solicitante', 'Abcdefg1')$q$, '23514', 'ck_usuarios_hash_bcrypt');
SELECT pg_temp.debe_pasar_sql('la base sí acepta un hash BCrypt',
    $q$INSERT INTO usuarios (nombre_completo, correo, rol, contrasena_hash)
       VALUES ('Con hash', 'con.hash@upla.edu.pe', 'Solicitante', '$2a$11$' || repeat('x', 53))$q$);

ROLLBACK;
