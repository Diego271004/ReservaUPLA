-- Propósito: crear extensiones, tablas, restricciones e índices del esquema (RN-01 a RN-04).
-- Se ejecuta desde la base: ReservaUPLADB (usuario postgres). Es idempotente.
-- Comando:
--   psql -h localhost -p 5432 -U postgres -d ReservaUPLADB -v ON_ERROR_STOP=1 -f database/03_crear_tablas.sql

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
    CONSTRAINT ck_usuarios_rol CHECK (rol IN ('Administrador', 'Solicitante', 'Responsable'))
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
