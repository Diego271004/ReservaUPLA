-- Propósito: cargar datos de prueba (3 usuarios, 3 ambientes, reservas e historial de ejemplo).
-- La contraseña llega como variable de psql (password_prueba) y se guarda como hash BCrypt (pgcrypto).
-- Se ejecuta desde la base: ReservaUPLADB (usuario postgres). Es idempotente.
-- Comando:
--   psql -h localhost -p 5432 -U postgres -d ReservaUPLADB -v ON_ERROR_STOP=1 -v password_prueba="<clave de prueba>" -f database/05_datos_prueba.sql

-- Los scripts están en UTF-8: se fija la codificación del cliente para que psql no use la de la consola (en Windows,
-- sin esto, "á" se guardaba como "Ã¡").
\encoding UTF8

\if :{?password_prueba}
\else
    \echo 'Falta la variable password_prueba (use -v password_prueba=...)'
    \quit
\endif

BEGIN;

INSERT INTO usuarios (nombre_completo, correo, rol, contrasena_hash)
SELECT v.nombre, v.correo, v.rol, crypt(:'password_prueba', gen_salt('bf', 11))
FROM (VALUES
    ('Carla Rojas',  'carla.rojas@upla.edu.pe',  'Administrador'),
    ('Ana Torres',   'ana.torres@upla.edu.pe',   'Solicitante'),
    ('Mario Huamán', 'mario.huaman@upla.edu.pe', 'Responsable')
) AS v (nombre, correo, rol)
ON CONFLICT (correo) DO NOTHING;

INSERT INTO ambientes (nombre, tipo, capacidad, ubicacion, estado, responsable_id)
SELECT v.nombre, v.tipo, v.capacidad, v.ubicacion, v.estado,
       (SELECT id FROM usuarios WHERE correo = 'mario.huaman@upla.edu.pe')
FROM (VALUES
    ('Laboratorio de Cómputo 2', 'Laboratorio', 30,  'Pabellón A, piso 2', 'Disponible'),
    ('Auditorio Principal',      'Auditorio',   200, 'Pabellón B, piso 1', 'Disponible'),
    ('Sala de Reuniones A',      'Sala',        12,  'Pabellón A, piso 3', 'En mantenimiento')
) AS v (nombre, tipo, capacidad, ubicacion, estado)
ON CONFLICT (nombre) DO NOTHING;

-- Reservas e historial de ejemplo: solo si la tabla de reservas está vacía (no se duplican al repetir el script).
CREATE TEMP TABLE _reservas_nuevas ON COMMIT DROP AS
SELECT v.fecha::date AS fecha, v.inicio::time AS inicio, v.fin::time AS fin, v.motivo, v.estado, v.ambiente
FROM (VALUES
    ('2026-11-03', '10:00', '12:00', 'Clase de programación',     'Aprobada',  'Laboratorio de Cómputo 2'),
    ('2026-11-05', '10:00', '12:00', 'Taller de bases de datos',  'Pendiente', 'Laboratorio de Cómputo 2'),
    ('2026-11-05', '11:00', '13:00', 'Práctica de redes',         'Pendiente', 'Laboratorio de Cómputo 2'),
    ('2026-11-04', '14:00', '16:00', 'Ceremonia de bienvenida',   'Aprobada',  'Auditorio Principal'),
    ('2026-11-06', '08:00', '10:00', 'Conferencia de ingeniería', 'Rechazada', 'Auditorio Principal'),
    ('2026-11-10', '09:00', '11:00', 'Reunión de coordinación',   'Cancelada', 'Auditorio Principal')
) AS v (fecha, inicio, fin, motivo, estado, ambiente)
WHERE NOT EXISTS (SELECT 1 FROM reservas);

-- Los datos de ejemplo llevan fechas fijas que con el tiempo quedan en el pasado: RN-07 (solo al insertar) se apaga
-- únicamente para esta carga y se vuelve a encender enseguida.
ALTER TABLE reservas DISABLE TRIGGER trg_reservas_validar_fecha;

INSERT INTO reservas (fecha, hora_inicio, hora_fin, motivo, estado, usuario_id, ambiente_id)
SELECT n.fecha, n.inicio, n.fin, n.motivo, n.estado,
       (SELECT id FROM usuarios WHERE correo = 'ana.torres@upla.edu.pe'),
       (SELECT id FROM ambientes WHERE nombre = n.ambiente)
FROM _reservas_nuevas n;

ALTER TABLE reservas ENABLE TRIGGER trg_reservas_validar_fecha;

-- Toda reserva nueva nace Pendiente (historial) y, si cambió de estado, lleva un segundo evento.
INSERT INTO historial_reserva (reserva_id, estado_anterior, estado_nuevo, usuario_id)
SELECT r.id, NULL, 'Pendiente', r.usuario_id
FROM reservas r
WHERE NOT EXISTS (SELECT 1 FROM historial_reserva h WHERE h.reserva_id = r.id);

INSERT INTO historial_reserva (reserva_id, estado_anterior, estado_nuevo, usuario_id)
SELECT r.id, 'Pendiente', r.estado,
       CASE WHEN r.estado = 'Cancelada'
            THEN r.usuario_id
            ELSE (SELECT id FROM usuarios WHERE correo = 'carla.rojas@upla.edu.pe') END
FROM reservas r
WHERE r.estado <> 'Pendiente'
  AND NOT EXISTS (SELECT 1 FROM historial_reserva h WHERE h.reserva_id = r.id AND h.estado_nuevo = r.estado);

COMMIT;
