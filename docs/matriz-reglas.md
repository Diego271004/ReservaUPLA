# Matriz de reglas de negocio

Cada regla (docs/01-analisis.md, sección 5) se valida en tres capas: el frontend ayuda al usuario, el backend decide y la base de datos es la última barrera. Cada celda nombra **la prueba que rompe la regla a propósito** en esa capa, con el nombre exacto que aparece en la ejecución.

- **Frontend:** `frontend/src/…` (Vitest). El nombre es el texto del `it(...)`.
- **Backend:** clase y método de xUnit. `Application.Tests` usa repositorios falsos; `API.Tests` levanta la API en memoria; `Infrastructure.Tests` y `ConcurrenciaAprobacionTests` usan la base real (variables `RESERVAUPLA_PRUEBAS_BD_ADMIN` y `RESERVAUPLA_PRUEBAS_BD_APP`; ver README).
- **Base de datos:** el texto que imprime `database/07_pruebas_reglas.sql` en cada comprobación (`OK  rechazada: …`). Si una regla no se rechaza, el script falla.

## RN-01 Una sola reserva Aprobada por ambiente, fecha y horario (las Pendientes pueden coexistir)

| Frontend | Backend | Base de datos |
|---|---|---|
| `pages/formulariosRegistro.test.jsx`: «04e: si el ambiente está ocupado muestra el aviso rojo con la hora que dice el servidor»; «RN-01: aunque el aviso diga ocupado, registrar deja decidir al servidor y un 409 muestra su mensaje»; `pages/DetalleReservaPage.test.jsx`: «error 0 : cierra el modal y muestra el mensaje sin cambiar el estado» (con el 409) | `ReservaServiceTests.RN01_una_reserva_que_se_cruza_con_una_Aprobada_se_rechaza_con_la_hora_ocupada`, `RN01_todo_cruce_con_una_Aprobada_es_conflicto`, `RN01_las_reservas_Pendientes_pueden_coexistir`; `ReservaCambioDeEstadoTests.RN01_no_se_aprueba_una_reserva_que_se_cruza_con_otra_Aprobada`; `ReservasEndpointsTests.RN01_aprobar_una_reserva_que_se_cruza_con_otra_Aprobada_da_409_con_la_hora` y `RN01_registrar_una_reserva_que_se_cruza_con_una_Aprobada_da_409_con_la_hora`; **concurrencia con la base real:** `ConcurrenciaAprobacionTests.RN01_dos_aprobaciones_simultaneas_que_se_cruzan_dan_un_200_y_un_409_y_una_sola_Aprobada` y `ReservaRepositorioConBaseRealTests.RN01_la_base_rechaza_la_segunda_aprobacion_que_se_cruza_y_se_traduce_a_conflicto` | «RN-01 segunda Aprobada que se cruza 11:00-13:00»; «RN-01 INSERT de otra Aprobada que se cruza (23P01)»; «RN-01 UPDATE que aprueba P1 mientras A1 sigue Aprobada (23P01)» |

## RN-02 Fecha, inicio, fin, ambiente, solicitante y motivo son obligatorios

| Frontend | Backend | Base de datos |
|---|---|---|
| `utils/validators.test.js`: «reserva vacía da un error en cada campo obligatorio»; `pages/formulariosRegistro.test.jsx`: «campos vacíos: no envía y marca ambiente, horas y motivo; la fecha ya tiene valor» | `ReservaServiceTests.RN02_campos_vacios_devuelven_un_error_por_campo` | «RN-02 fecha es obligatorio», «RN-02 hora_inicio es obligatorio», «RN-02 hora_fin es obligatorio», «RN-02 motivo es obligatorio», «RN-02 usuario_id es obligatorio», «RN-02 ambiente_id es obligatorio» (todas SQLSTATE 23502) |

## RN-03 La hora de fin es posterior a la de inicio

| Frontend | Backend | Base de datos |
|---|---|---|
| `utils/validators.test.js`: «hora de fin: vacía, fuera de horario y no posterior al inicio (RN-03)»; `utils/fechas.test.js`: «horasPosterioresA (RN-03)» › «solo ofrece horas posteriores a la de inicio»; `pages/formulariosRegistro.test.jsx`: «RN-03 (N1): la hora de fin solo ofrece horas posteriores a la de inicio» | `ReservaServiceTests.RN03_hora_de_fin_no_posterior_al_inicio_se_rechaza`; `ReservaConsultaTests.Datos_incompletos_o_invalidos_devuelven_errores_por_campo`; `AutorizacionTests.Una_reserva_con_horas_invalidas_devuelve_400_con_el_mensaje_de_RN03` | «RN-03 hora_fin igual a hora_inicio»; «RN-03 hora_fin menor que hora_inicio» |

## RN-04 Solo entre 07:00 y 22:00

| Frontend | Backend | Base de datos |
|---|---|---|
| `utils/validators.test.js`: «hora de inicio: vacía, fuera de horario (RN-04) y válida»; `utils/fechas.test.js`: «HORAS (lista cerrada, RN-04)» › «va de 07:00 a 22:00 cada 30 minutos (31 opciones)»; `pages/formulariosRegistro.test.jsx`: «RN-04: la hora de inicio solo ofrece de 07:00 a 22:00 cada 30 minutos» | `ReservaServiceTests.RN04_hora_de_inicio_antes_de_las_0700_se_rechaza`, `RN04_hora_de_fin_despues_de_las_2200_se_rechaza`, `Los_limites_exactos_0700_y_2200_son_validos` | «RN-04 inicio antes de las 07:00»; «RN-04 fin después de las 22:00»; «RN-04 límites exactos 07:00-22:00» (aceptada) |

## RN-05 Solo el Administrador aprueba o rechaza

| Frontend | Backend | Base de datos |
|---|---|---|
| `utils/reservas.test.js`: «nadie ve Aprobar ni Rechazar salvo el Administrador», «RN-05: una Solicitante que no es la dueña no ve acciones», «RN-05: la Responsable nunca ve acciones (%s)»; `pages/DetalleReservaPage.test.jsx`: «05f RN-05: la Solicitante no ve Aprobar ni Rechazar; solo Cancelar solicitud», «RN-05: la Responsable no ve ninguna acción ni aviso, solo la información» | `ReservaCambioDeEstadoTests.RN05_quien_no_es_Administrador_no_puede_aprobar` y `RN05_quien_no_es_Administrador_no_puede_rechazar` (servicio); `ReservasEndpointsTests.RN05_solo_el_Administrador_aprueba_o_rechaza_los_demas_reciben_403` (HTTP 403) | «RN-05 un Solicitante no registra la aprobación»; «RN-05 un Solicitante no registra el rechazo»; «RN-05 el Administrador sí registra la aprobación» (aceptada). Además, «otra Solicitante no cancela una reserva ajena» y «el dueño sí cancela su reserva» |

## RN-06 Una reserva Rechazada no se modifica (y Cancelada es final)

| Frontend | Backend | Base de datos |
|---|---|---|
| `utils/reservas.test.js`: «RN-06: Administrador con una reserva %s: todo deshabilitado y con aviso»; `pages/DetalleReservaPage.test.jsx`: «05c RN-06: una reserva Rechazada muestra las acciones deshabilitadas y el aviso informativo», «RN-06: una reserva Cancelada muestra su aviso y las acciones deshabilitadas», «05g RN-06: tras rechazar, la reserva queda sin acciones y con el aviso informativo» | Dominio: `ReservaTests.RN06_los_estados_finales_no_admiten_ninguna_transicion`; servicio: `ReservaCambioDeEstadoTests.RN06_aprobar_una_reserva_que_ya_no_esta_Pendiente_da_conflicto_con_el_mensaje_del_dominio`, `RN06_rechazar_una_reserva_que_ya_no_esta_Pendiente_da_conflicto`, `RN06_cancelar_una_reserva_en_estado_final_da_conflicto`; HTTP 409: `ReservasEndpointsTests.RN06_modificar_una_reserva_Rechazada_o_Cancelada_da_409_con_el_mensaje`; con la base real: `ConcurrenciaAprobacionTests.Una_reserva_rechazada_no_se_puede_aprobar_ni_por_la_API_con_la_base_real` | «RN-06 una Rechazada no pasa a Aprobada»; «RN-06 una Rechazada no vuelve a Pendiente»; «RN-06 una Rechazada no se cancela»; «RN-06 una Rechazada no cambia ningún dato (motivo)»; «RN-06 una Cancelada no pasa a Aprobada»; «transición Aprobada → Rechazada no permitida»; «transición Aprobada → Pendiente no permitida» |

## Otras reglas del análisis y de la fase

| Regla | Frontend | Backend | Base de datos |
|---|---|---|---|
| **RN-07 (regla agregada, propuesta)**: no se reserva para una fecha anterior a hoy; vale solo al registrar, no al cambiar de estado | `utils/validators.test.js`: «RN-07: la fecha %s (hoy es 03/11/2026)»; `pages/formulariosRegistro.test.jsx`: «RN-07: una fecha anterior a hoy se avisa junto al campo y no se envía» (la fecha mínima es hoy, que además es el valor por defecto del campo) | `ReservaServiceTests.RN07_una_fecha_anterior_a_hoy_se_rechaza`, `RN07_la_fecha_de_hoy_es_valida`; `ReservasEndpointsTests.RN07_reservar_para_una_fecha_anterior_a_hoy_da_400_en_la_fecha` (400 con `MensajesValidacion.FechaPasada`); «hoy» es la fecha de Lima (UTC-5) | `07_pruebas_reglas.sql`: «RN-07: la base no acepta una reserva con fecha anterior a hoy», «la base sí acepta una reserva para hoy», «una reserva antigua sí puede cambiar de estado (el control es solo al insertar)»; disparador `trg_reservas_validar_fecha` solo `BEFORE INSERT` |
| Un ambiente en mantenimiento no admite reservas nuevas (decisión 4 del análisis) | `pages/formulariosRegistro.test.jsx`: «las opciones del ambiente muestran solo el nombre; el que está en mantenimiento no se puede elegir», «al elegir un ambiente, su capacidad y ubicación aparecen como ayuda bajo el campo», «04f: el error del servidor sobre el ambiente en mantenimiento aparece bajo el campo Ambiente» | `ReservaServiceTests.Un_ambiente_en_mantenimiento_no_admite_reservas_nuevas`; `ReservaConsultaTests.Un_ambiente_en_mantenimiento_no_esta_disponible`; `ReservasEndpointsTests.Reservar_en_un_ambiente_en_mantenimiento_da_400_en_el_ambiente` | «mantenimiento: la base no acepta una reserva nueva en un ambiente en mantenimiento» |
| Cancelar: el solicitante dueño o el Administrador, solo Pendiente o Aprobada | `utils/reservas.test.js`: «RN-05: una Solicitante que no es la dueña no ve acciones» | `ReservaCambioDeEstadoTests.Otra_solicitante_no_puede_cancelar_una_reserva_ajena`, `La_Responsable_no_cancela_reservas`, `El_solicitante_dueño_cancela_su_reserva_Pendiente_o_Aprobada`; `ReservasEndpointsTests.El_solicitante_dueño_y_el_Administrador_cancelan_la_otra_solicitante_y_la_Responsable_reciben_403` | «otra Solicitante no cancela una reserva ajena»; «Aprobada → Cancelada sí se permite» |
| Contraseña inicial (U2): de 8 a 72 caracteres, con una letra y un número | `utils/validators.test.js`: «inicial (U2): "%s" no cumple 8 a 72 caracteres con una letra y un número»; `pages/formulariosRegistro.test.jsx`: «U2: la contraseña inicial "%s" no cumple los requisitos y lo dice bajo el campo» | `UsuarioServiceTests.U2_la_contrasena_inicial_exige_8_caracteres_con_al_menos_una_letra_y_un_numero`, `U2_una_contrasena_inicial_que_cumple_se_acepta`, `U2_el_limite_superior_es_72_caracteres` | «la base no acepta una contraseña en texto plano» (solo guarda un hash BCrypt; la política se valida antes de hashear) |

## Cómo se ejecuta cada capa
```bash
# Frontend
cd frontend && npm run test

# Backend (las pruebas con la base real se omiten si faltan las dos variables de entorno)
cd backend && dotnet test ReservaUPLA.sln

# Base de datos (desde la raíz, con la base ya creada por los scripts 00 a 06)
psql -h localhost -p 5432 -U postgres -d ReservaUPLADB -v ON_ERROR_STOP=1 -f database/07_pruebas_reglas.sql
```

## Nota sobre lo que esta matriz no prueba
- El frontend **ayuda**, no decide: ocultar o deshabilitar un botón no impide una llamada directa a la API; por eso cada regla tiene su prueba en el backend (403 y 409) y en la base de datos.
- RN-01 en el frontend es un aviso inmediato (consulta de disponibilidad); no impide enviar la solicitud, porque entre el aviso y el envío otra persona puede haber aprobado una reserva.
- El nombre de una prueba parametrizada (`%s`, `%#`) aparece una vez por caso en la ejecución.
