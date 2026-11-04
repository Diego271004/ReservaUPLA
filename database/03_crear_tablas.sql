-- Propósito: crear extensiones, tablas, restricciones e índices del esquema (RN-01 a RN-04).
-- Se ejecuta desde la base: ReservaUPLADB (usuario postgres). Es idempotente.
-- Comando:
--   psql -h localhost -p 5432 -U postgres -d ReservaUPLADB -v ON_ERROR_STOP=1 -f database/03_crear_tablas.sql

-- Los scripts están en UTF-8: se fija la codificación del cliente para que psql no use la de la consola (en Windows,
-- sin esto, "á" se guardaba como "Ã¡").
\encoding UTF8

CREATE EXTENSION IF NOT EXISTS btree_gist;
CREATE EXTENSION IF NOT EXISTS pgcrypto;

CREATE TABLE IF NOT EXISTS usuarios (
    id              integer GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
    nombre_completo varchar(120) NOT NULL,
    correo          varchar(160) NOT NULL,
    rol             varchar(20)  NOT NULL,
    activo          boolean      NOT NULL DEFAULT true,
    contrasena_hash varchar(100) NOT NULL,
    CONSTRAINT uq_usuarios_correo UNIQUE (correo),
    CONSTRAINT ck_usuarios_correo_normalizado CHECK (correo = LOWER(TRIM(correo))),
    CONSTRAINT ck_usuarios_rol CHECK (rol IN ('Administrador', 'Solicitante', 'Responsable')),
    -- Solo se guarda un hash BCrypt (la política de la contraseña se valida en la aplicación, antes de hashear): nunca texto plano.
    CONSTRAINT ck_usuarios_hash_bcrypt CHECK (contrasena_hash ~ '^\$2[abxy]\$[0-9]{2}\$.{53}$')
);

CREATE TABLE IF NOT EXISTS ambientes (
    id             integer GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
    nombre         varchar(120) NOT NULL,
    tipo           varchar(30)  NOT NULL,
    capacidad      integer      NOT NULL,
    ubicacion      varchar(160) NOT NULL,
    estado         varchar(30)  NOT NULL DEFAULT 'Disponible',
    responsable_id integer      NULL REFERENCES usuarios (id),
    CONSTRAINT uq_ambientes_nombre UNIQUE (nombre),
    CONSTRAINT ck_ambientes_capacidad CHECK (capacidad > 0),
    CONSTRAINT ck_ambientes_tipo CHECK (tipo IN ('Laboratorio', 'Auditorio', 'Sala')),
    CONSTRAINT ck_ambientes_estado CHECK (estado IN ('Disponible', 'En mantenimiento'))
);

CREATE TABLE IF NOT EXISTS reservas (
    id             integer GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
    fecha          date         NOT NULL,                            -- RN-02
    hora_inicio    time         NOT NULL,                            -- RN-02
    hora_fin       time         NOT NULL,                            -- RN-02
    motivo         varchar(300) NOT NULL,                            -- RN-02
    estado         varchar(20)  NOT NULL DEFAULT 'Pendiente',
    usuario_id     integer      NOT NULL REFERENCES usuarios (id),   -- RN-02
    ambiente_id    integer      NOT NULL REFERENCES ambientes (id),  -- RN-02
    fecha_creacion timestamptz  NOT NULL DEFAULT now(),
    CONSTRAINT ck_reservas_estado CHECK (estado IN ('Pendiente', 'Aprobada', 'Rechazada', 'Cancelada')),
    -- RN-03
    CONSTRAINT ck_reservas_fin_mayor_que_inicio CHECK (hora_fin > hora_inicio),
    -- RN-04
    CONSTRAINT ck_reservas_horario_permitido CHECK (hora_inicio >= TIME '07:00' AND hora_fin <= TIME '22:00'),
    -- RN-01: dos reservas Aprobadas del mismo ambiente no pueden cruzarse (rango [inicio, fin)).
    CONSTRAINT ex_reservas_aprobadas_sin_cruce EXCLUDE USING gist (
        ambiente_id WITH =,
        tsrange(fecha + hora_inicio, fecha + hora_fin) WITH &&
    ) WHERE (estado = 'Aprobada')
);

CREATE TABLE IF NOT EXISTS historial_reserva (
    id              integer GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
    reserva_id      integer     NOT NULL REFERENCES reservas (id),
    estado_anterior varchar(20) NULL,
    estado_nuevo    varchar(20) NOT NULL,
    usuario_id      integer     NOT NULL REFERENCES usuarios (id),
    fecha           timestamptz NOT NULL DEFAULT now(),
    CONSTRAINT ck_historial_estado_nuevo CHECK (estado_nuevo IN ('Pendiente', 'Aprobada', 'Rechazada', 'Cancelada')),
    CONSTRAINT ck_historial_estado_anterior CHECK (estado_anterior IS NULL OR estado_anterior IN ('Pendiente', 'Aprobada', 'Rechazada', 'Cancelada'))
);

CREATE INDEX IF NOT EXISTS ix_reservas_usuario ON reservas (usuario_id);
CREATE INDEX IF NOT EXISTS ix_reservas_ambiente_fecha ON reservas (ambiente_id, fecha);
CREATE INDEX IF NOT EXISTS ix_historial_reserva ON historial_reserva (reserva_id);

-- RN-06 y transiciones de estado: Rechazada y Cancelada son finales (no cambia ningún dato de la reserva) y solo
-- se permite Pendiente → Aprobada, Rechazada o Cancelada, y Aprobada → Cancelada. (Hallazgo de la Fase 6: sin esto,
-- un UPDATE directo podía reabrir una reserva rechazada.)
CREATE OR REPLACE FUNCTION fn_reservas_validar_transicion() RETURNS trigger
LANGUAGE plpgsql AS $$
BEGIN
    IF OLD.estado IN ('Rechazada', 'Cancelada') THEN
        RAISE EXCEPTION 'RN-06: una reserva % no se puede modificar.', lower(OLD.estado);
    END IF;

    IF NEW.estado <> OLD.estado AND NOT (
           (OLD.estado = 'Pendiente' AND NEW.estado IN ('Aprobada', 'Rechazada', 'Cancelada'))
        OR (OLD.estado = 'Aprobada'  AND NEW.estado = 'Cancelada')) THEN
        RAISE EXCEPTION 'Transición de estado no permitida: % a %.', OLD.estado, NEW.estado;
    END IF;

    RETURN NEW;
END $$;

DROP TRIGGER IF EXISTS trg_reservas_validar_transicion ON reservas;
CREATE TRIGGER trg_reservas_validar_transicion
    BEFORE UPDATE ON reservas
    FOR EACH ROW EXECUTE FUNCTION fn_reservas_validar_transicion();

-- Ambiente en mantenimiento (decisión 4 del análisis): no admite reservas nuevas. Se comprueba al insertar; las reservas
-- que ya existían no se tocan si el ambiente pasa a mantenimiento después.
CREATE OR REPLACE FUNCTION fn_reservas_validar_ambiente() RETURNS trigger
LANGUAGE plpgsql AS $$
BEGIN
    IF (SELECT estado FROM ambientes WHERE id = NEW.ambiente_id) <> 'Disponible' THEN
        RAISE EXCEPTION 'Un ambiente en mantenimiento no admite reservas nuevas.';
    END IF;
    RETURN NEW;
END $$;

DROP TRIGGER IF EXISTS trg_reservas_validar_ambiente ON reservas;
CREATE TRIGGER trg_reservas_validar_ambiente
    BEFORE INSERT ON reservas
    FOR EACH ROW EXECUTE FUNCTION fn_reservas_validar_ambiente();

-- RN-07 (regla agregada): no se reserva para una fecha anterior a hoy ("hoy" = la fecha de Lima). Solo al INSERTAR: un
-- UPDATE de estado sobre una reserva que ya pasó (aprobar, cancelar) sigue funcionando. Mismo texto que MensajesValidacion.FechaPasada.
CREATE OR REPLACE FUNCTION fn_reservas_validar_fecha() RETURNS trigger
LANGUAGE plpgsql AS $$
BEGIN
    IF NEW.fecha < (now() AT TIME ZONE 'America/Lima')::date THEN
        RAISE EXCEPTION 'No puedes reservar para una fecha anterior a hoy.';
    END IF;
    RETURN NEW;
END $$;

DROP TRIGGER IF EXISTS trg_reservas_validar_fecha ON reservas;
CREATE TRIGGER trg_reservas_validar_fecha
    BEFORE INSERT ON reservas
    FOR EACH ROW EXECUTE FUNCTION fn_reservas_validar_fecha();

-- RN-05: solo un Administrador deja constancia de aprobar o rechazar una reserva; cancelar lo hace el solicitante
-- dueño de la reserva o un Administrador. Cada cambio de estado escribe una fila en historial_reserva.
CREATE OR REPLACE FUNCTION fn_historial_validar_autor() RETURNS trigger
LANGUAGE plpgsql AS $$
DECLARE
    v_es_administrador boolean;
BEGIN
    SELECT rol = 'Administrador' INTO v_es_administrador FROM usuarios WHERE id = NEW.usuario_id;

    IF NEW.estado_nuevo IN ('Aprobada', 'Rechazada') AND NOT COALESCE(v_es_administrador, false) THEN
        RAISE EXCEPTION 'RN-05: solo el Administrador aprueba o rechaza una reserva.';
    END IF;

    IF NEW.estado_nuevo = 'Cancelada' AND NOT COALESCE(v_es_administrador, false)
       AND NOT EXISTS (SELECT 1 FROM reservas WHERE id = NEW.reserva_id AND usuario_id = NEW.usuario_id) THEN
        RAISE EXCEPTION 'Solo el solicitante dueño o el Administrador cancela una reserva.';
    END IF;

    RETURN NEW;
END $$;

DROP TRIGGER IF EXISTS trg_historial_validar_autor ON historial_reserva;
CREATE TRIGGER trg_historial_validar_autor
    BEFORE INSERT ON historial_reserva
    FOR EACH ROW EXECUTE FUNCTION fn_historial_validar_autor();
