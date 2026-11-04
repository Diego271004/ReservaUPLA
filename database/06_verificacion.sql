-- Propósito: comprobar que el esquema, las restricciones, los permisos y los datos de prueba están completos.
-- No muestra hashes de contraseña. Se ejecuta desde la base: ReservaUPLADB (usuario postgres).
-- Comando:
--   psql -h localhost -p 5432 -U postgres -d ReservaUPLADB -v ON_ERROR_STOP=1 -f database/06_verificacion.sql

\echo '== Tablas =='
SELECT table_name FROM information_schema.tables WHERE table_schema = 'public' ORDER BY table_name;

\echo '== Restricciones de reservas (RN-01, RN-03, RN-04) =='
SELECT conname, contype FROM pg_constraint
WHERE conrelid = 'reservas'::regclass AND contype IN ('c', 'x') ORDER BY conname;

\echo '== Cantidades =='
SELECT 'usuarios' AS tabla, count(*) AS filas FROM usuarios
UNION ALL SELECT 'ambientes', count(*) FROM ambientes
UNION ALL SELECT 'reservas', count(*) FROM reservas
UNION ALL SELECT 'historial_reserva', count(*) FROM historial_reserva;

\echo '== Usuarios (sin hash) =='
SELECT nombre_completo, correo, rol, activo, (contrasena_hash LIKE '$2%') AS hash_bcrypt FROM usuarios ORDER BY id;

\echo '== Reservas por estado =='
SELECT estado, count(*) FROM reservas GROUP BY estado ORDER BY estado;

\echo '== Permisos del rol reservaupla_app =='
SELECT t.table_name,
       has_table_privilege('reservaupla_app', t.table_name, 'SELECT') AS select_,
       has_table_privilege('reservaupla_app', t.table_name, 'INSERT') AS insert_,
       has_table_privilege('reservaupla_app', t.table_name, 'UPDATE') AS update_,
       has_table_privilege('reservaupla_app', t.table_name, 'DELETE') AS delete_
FROM information_schema.tables t WHERE t.table_schema = 'public' ORDER BY t.table_name;
