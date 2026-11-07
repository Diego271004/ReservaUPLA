-- Propósito: Carga opcional e idempotente de datos para demostración en vivo.
-- Utiliza fechas relativas (CURRENT_DATE y días siguientes) para que siempre existan
-- reservas activas en el presente y futuro, sin violar RN-07 ni requerir contraseñas.
--
-- Ejecución con psql:
--   psql -h localhost -p 5432 -U postgres -d ReservaUPLADB -v ON_ERROR_STOP=1 -f database/07_datos_demo.sql

\encoding UTF8

DO $$
DECLARE
    v_admin_id integer;
    v_solic_id integer;
    v_resp_id  integer;
    v_lab_id   integer;
    v_aud_id   integer;
    v_res1_id  integer;
    v_res2_id  integer;
    v_res3_id  integer;
    v_res4_id  integer;
    v_hoy      date;
BEGIN
    SELECT id INTO v_admin_id FROM usuarios WHERE correo = 'carla.rojas@upla.edu.pe';
    SELECT id INTO v_solic_id FROM usuarios WHERE correo = 'ana.torres@upla.edu.pe';
    SELECT id INTO v_resp_id  FROM usuarios WHERE correo = 'mario.huaman@upla.edu.pe';

    SELECT id INTO v_lab_id FROM ambientes WHERE nombre = 'Laboratorio de Cómputo 2';
    SELECT id INTO v_aud_id FROM ambientes WHERE nombre = 'Auditorio Principal';

    IF v_admin_id IS NULL OR v_solic_id IS NULL OR v_resp_id IS NULL OR v_lab_id IS NULL OR v_aud_id IS NULL THEN
        RAISE EXCEPTION 'Faltan los usuarios o ambientes de semilla en la base de datos.';
    END IF;

    v_hoy := (now() AT TIME ZONE 'America/Lima')::date;

    -- 1. Reserva Aprobada en Auditorio Principal (mañana 09:00 a 12:00)
    IF NOT EXISTS (SELECT 1 FROM reservas WHERE motivo = 'Demostración: Conferencia de Bienvenida Estudiantil') THEN
        INSERT INTO reservas (fecha, hora_inicio, hora_fin, motivo, estado, usuario_id, ambiente_id)
        VALUES (v_hoy + 1, '09:00', '12:00', 'Demostración: Conferencia de Bienvenida Estudiantil', 'Aprobada', v_solic_id, v_aud_id)
        RETURNING id INTO v_res1_id;

        INSERT INTO historial_reserva (reserva_id, estado_anterior, estado_nuevo, usuario_id)
        VALUES (v_res1_id, NULL, 'Pendiente', v_solic_id),
               (v_res1_id, 'Pendiente', 'Aprobada', v_admin_id);
    END IF;

    -- 2. Reserva Pendiente en Auditorio Principal (pasado mañana 14:00 a 17:00)
    IF NOT EXISTS (SELECT 1 FROM reservas WHERE motivo = 'Demostración: Taller de Robótica Universitaria') THEN
        INSERT INTO reservas (fecha, hora_inicio, hora_fin, motivo, estado, usuario_id, ambiente_id)
        VALUES (v_hoy + 2, '14:00', '17:00', 'Demostración: Taller de Robótica Universitaria', 'Pendiente', v_resp_id, v_aud_id)
        RETURNING id INTO v_res2_id;

        INSERT INTO historial_reserva (reserva_id, estado_anterior, estado_nuevo, usuario_id)
        VALUES (v_res2_id, NULL, 'Pendiente', v_resp_id);
    END IF;

    -- 3. Conflicto - Reserva Aprobada en Laboratorio de Cómputo 2 (mañana 10:00 a 12:00)
    IF NOT EXISTS (SELECT 1 FROM reservas WHERE motivo = 'Demostración: Clase de Programación Avanzada') THEN
        INSERT INTO reservas (fecha, hora_inicio, hora_fin, motivo, estado, usuario_id, ambiente_id)
        VALUES (v_hoy + 1, '10:00', '12:00', 'Demostración: Clase de Programación Avanzada', 'Aprobada', v_solic_id, v_lab_id)
        RETURNING id INTO v_res3_id;

        INSERT INTO historial_reserva (reserva_id, estado_anterior, estado_nuevo, usuario_id)
        VALUES (v_res3_id, NULL, 'Pendiente', v_solic_id),
               (v_res3_id, 'Pendiente', 'Aprobada', v_admin_id);
    END IF;

    -- 4. Conflicto - Solicitud Pendiente en Laboratorio de Cómputo 2 solapada (mañana 11:00 a 13:00)
    -- Se solapa 11:00 a 12:00 con la reserva 3 aprobada; permite demostrar la advertencia y el error 409 al aprobar.
    IF NOT EXISTS (SELECT 1 FROM reservas WHERE motivo = 'Demostración: Práctica de Base de Datos Solapada') THEN
        INSERT INTO reservas (fecha, hora_inicio, hora_fin, motivo, estado, usuario_id, ambiente_id)
        VALUES (v_hoy + 1, '11:00', '13:00', 'Demostración: Práctica de Base de Datos Solapada', 'Pendiente', v_resp_id, v_lab_id)
        RETURNING id INTO v_res4_id;

        INSERT INTO historial_reserva (reserva_id, estado_anterior, estado_nuevo, usuario_id)
        VALUES (v_res4_id, NULL, 'Pendiente', v_resp_id);
    END IF;

    RAISE NOTICE 'Datos de demostración cargados exitosamente (fechas relativas desde %)', v_hoy;
END $$;

