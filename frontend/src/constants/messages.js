/**
 * Única fuente de los textos de la interfaz. Los mensajes de validación copian carácter por
 * carácter backend/ReservaUPLA.Application/Common/MensajesValidacion.cs (la prueba
 * messages.test.js lo comprueba). Si cambia uno, cambia el otro.
 */

export const DOMINIO_INSTITUCIONAL = import.meta.env?.VITE_DOMINIO_INSTITUCIONAL ?? 'upla.edu.pe'

export const MENSAJES = Object.freeze({
  // Login
  correoVacio: 'Ingresa tu correo institucional.',
  correoFormatoInvalido:
    'El correo no tiene un formato válido. Ejemplo: nombre.apellido@upla.edu.pe',
  correoDemasiadoLargo: 'El correo no puede superar los 254 caracteres.',
  contrasenaVacia: 'Ingresa tu contraseña.',
  contrasenaDemasiadoLarga: 'La contraseña no puede superar los 128 caracteres.',
  credencialesInvalidas:
    'El correo o la contraseña no son correctos. Revisa ambos datos e inténtalo de nuevo.',
  demasiadosIntentos: 'Has realizado demasiados intentos. Espera 1 minuto y vuelve a intentarlo.',

  // Errores generales
  errorConexion: 'No pudimos conectar con ReservaUPLA. Revisa tu conexión e inténtalo nuevamente.',
  errorServidor:
    'ReservaUPLA no está disponible en este momento. Inténtalo de nuevo en unos minutos.',
  sinPermiso: 'No tienes permiso para realizar esta acción.',
  sesionTerminada: 'Tu sesión terminó. Inicia sesión de nuevo.',

  // Usuarios
  nombreCompletoVacio: 'Ingresa el nombre completo.',
  nombreCompletoDemasiadoLargo: 'El nombre no puede superar los 120 caracteres.',
  correoUsuarioVacio: 'Ingresa el correo institucional.',
  correoYaRegistrado: 'Ese correo ya está registrado.',
  rolVacio: 'Selecciona un rol.',
  rolInvalido: 'Selecciona un rol de la lista.',
  contrasenaInicialVacia: 'Ingresa la contraseña inicial.',
  contrasenaInicialDemasiadoLarga: 'La contraseña no puede superar los 72 caracteres.',
  contrasenaInicialRequisitos:
    'La contraseña debe tener entre 8 y 72 caracteres, con al menos una letra y un número.',
  usuarioRegistrado: 'Usuario registrado.',

  // Ambientes
  nombreAmbienteVacio: 'Ingresa el nombre del ambiente.',
  nombreAmbienteDemasiadoLargo: 'El nombre no puede superar los 120 caracteres.',
  nombreAmbienteDuplicado: 'Ya existe un ambiente con ese nombre.',
  tipoVacio: 'Selecciona el tipo de ambiente.',
  tipoInvalido: 'Selecciona un tipo de la lista.',
  capacidadVacia: 'Ingresa la capacidad.',
  capacidadInvalida: 'Ingresa la capacidad como un número, por ejemplo 30.',
  ubicacionVacia: 'Ingresa la ubicación.',
  ubicacionDemasiadoLarga: 'La ubicación no puede superar los 160 caracteres.',
  estadoAmbienteVacio: 'Selecciona el estado del ambiente.',
  estadoAmbienteInvalido: 'Selecciona un estado de la lista.',
  responsableInvalido: 'Selecciona un responsable de la lista.',
  ambienteRegistrado: 'Ambiente registrado.',

  // Reservas
  ambienteVacio: 'Selecciona un ambiente.',
  ambienteInexistente: 'Selecciona un ambiente de la lista.',
  fechaVacia: 'Ingresa la fecha de la reserva.',
  fechaFormatoInvalido: 'Ingresa la fecha con el formato dd/mm/aaaa.',
  fechaPasada: 'No puedes reservar para una fecha anterior a hoy.',
  estadoFiltroInvalido: 'Elige un estado de la lista.',
  rangoDeFechasInvalido: 'La fecha final no puede ser anterior a la inicial.',
  paginaInvalida: 'La página debe ser 1 o mayor.',
  horaInicioVacia: 'Selecciona la hora de inicio.',
  horaFinVacia: 'Selecciona la hora de fin.',
  horaFueraDeHorario: 'El horario permitido es de 07:00 a 22:00.',
  horaFinNoPosterior: 'La hora de fin debe ser posterior a la hora de inicio.',
  motivoVacio: 'Ingresa el motivo de la reserva.',
  motivoDemasiadoLargo: 'El motivo no puede superar los 300 caracteres.',
  reservaRegistrada: 'Solicitud registrada. Quedó Pendiente de aprobación.',

  // Reservas: disponibilidad y reglas de negocio (RN-01, RN-05, RN-06)
  disponible: 'Disponible: no hay reservas aprobadas en ese horario',
  ambienteEnMantenimiento: 'Ese ambiente está en mantenimiento y no admite reservas nuevas.',
  conflictoDeHorarioSinDetalle:
    'Ese ambiente ya tiene una reserva aprobada en ese horario. Elige otro horario u otro ambiente.',
  reservaAprobada: 'Reserva aprobada.',
  reservaRechazada: 'Reserva rechazada.',
  reservaCancelada: 'Reserva cancelada.',
  reservaRechazadaNoSeModifica: 'Una reserva rechazada no se puede modificar.',
  reservaCanceladaNoSeModifica: 'Una reserva cancelada no se puede modificar.',
  soloPendienteSeApruebaORechaza: 'Solo una reserva Pendiente se puede aprobar o rechazar.',
})

/** Mensajes que se construyen con un dato (no viajan por la API). */
/** «Mostrando 5 de 7» (el pie de la tabla de pendientes del Dashboard). */
export const textoMostrando = (mostradas, total) => `Mostrando ${mostradas} de ${total}`

export const textoPagina = (numero) => `Página ${numero}`

export const mensajeDominioNoInstitucional = (dominio) =>
  `Usa tu correo institucional (termina en @${dominio}).`

/** El contador junto a «Reservas» en el menú del Administrador: «1 pendiente», «6 pendientes». */
export const textoPendientes = (cantidad) =>
  cantidad === 1 ? '1 pendiente' : `${cantidad} pendientes`

export const textoSinUsuariosCoincidentes = (termino) =>
  `No se encontraron usuarios que coincidan con «${termino}».`

/** Textos propios de la interfaz. */
export const TEXTOS = Object.freeze({
  nombreProducto: 'ReservaUPLA',
  lemaLogin: 'Reserva laboratorios, auditorios y salas de la UPLA',
  universidad: 'Universidad Peruana Los Andes',
  loginEspacios: 'Espacios que puedes reservar',
  loginLaboratorios: 'Laboratorios',
  loginAuditorios: 'Auditorios',
  loginSalas: 'Salas',
  tituloLogin: 'Iniciar sesión',
  subtituloLogin: 'Accede con tu correo institucional',
  etiquetaCorreo: 'Correo institucional',
  ayudaCorreo: 'Ejemplo: nombre.apellido@upla.edu.pe',
  etiquetaContrasena: 'Contraseña',
  mostrar: 'Mostrar',
  ocultar: 'Ocultar',
  avisoBloqMayus: 'Bloq Mayús está activado.',
  botonIngresar: 'Ingresar',
  verificandoCredenciales: 'Verificando credenciales…',
  cancelar: 'Cancelar',
  olvidasteContrasena: '¿Olvidaste tu contraseña?',
  ayudaSoporte: 'Comunícate con Soporte TI de la universidad',
  cerrarSesion: 'Cerrar sesión',
  seleccionar: 'Selecciona…',
  guardando: 'Guardando…',
  cargando: 'Cargando…',
  volver: 'Volver',
  noHayDatos: 'Todavía no hay registros.',
  menuAbrir: 'Menú',
  menuCerrar: 'Cerrar menú',
  menuContraer: 'Contraer menú',
  menuExpandir: 'Expandir menú',
  migasDePan: 'Migas de pan',
  cerrarAviso: 'Cerrar aviso',
  hoyEs: 'Hoy',

  // Usuarios
  tituloUsuarios: 'Usuarios',
  nuevoUsuario: 'Nuevo usuario',
  tituloRegistrarUsuario: 'Registrar usuario',
  registrarUsuario: 'Registrar usuario',
  buscarUsuarios: 'Buscar usuarios',
  ayudaBuscarUsuarios: 'Filtra por nombre, correo institucional o rol',
  etiquetaNombreCompleto: 'Nombre completo',
  etiquetaRol: 'Rol',
  etiquetaActivo: 'Activo',
  etiquetaContrasenaInicial: 'Contraseña inicial',
  activo: 'Activo',
  inactivo: 'Inactivo',
  ayudaContrasenaInicial: 'Entre 8 y 72 caracteres, con al menos una letra y un número.',

  // Ambientes
  tituloAmbientes: 'Ambientes',
  nuevoAmbiente: 'Nuevo ambiente',
  tituloRegistrarAmbiente: 'Registrar ambiente',
  registrarAmbiente: 'Registrar ambiente',
  etiquetaNombre: 'Nombre',
  etiquetaTipo: 'Tipo',
  etiquetaCapacidad: 'Capacidad',
  etiquetaUbicacion: 'Ubicación',
  etiquetaEstado: 'Estado',
  etiquetaResponsable: 'Responsable',

  // Reservas
  tituloNuevaReserva: 'Nueva reserva',
  etiquetaAmbiente: 'Ambiente',
  etiquetaFecha: 'Fecha',
  etiquetaHoraInicio: 'Hora de inicio',
  etiquetaHoraFin: 'Hora de fin',
  ayudaHorario: 'Horario permitido: 07:00 a 22:00',
  atajosAyudaHoraInicio: 'Elige primero la hora de inicio.',
  etiquetaMotivo: 'Motivo',
  registrarSolicitud: 'Registrar solicitud',
  ambienteEnMantenimiento: 'En mantenimiento (no disponible)',
  personas: 'personas',
  consultandoDisponibilidad: 'Comprobando disponibilidad…',
  verDetalle: 'Ver detalle',
  registrarOtra: 'Registrar otra solicitud',
  limpiarFormulario: 'Limpiar formulario',
  ayudaFecha: 'Formato dd/mm/aaaa (por ejemplo, 05/11/2026).',

  // Detalle de la reserva y sus acciones
  cargandoReserva: 'Cargando la reserva…',
  reservaNoEncontrada: 'No encontramos esa reserva.',
  reintentar: 'Reintentar',
  aprobar: 'Aprobar',
  rechazar: 'Rechazar',
  cancelarReserva: 'Cancelar reserva',
  cancelarSolicitud: 'Cancelar solicitud',
  tituloModalAprobar: '¿Aprobar esta reserva?',
  confirmarAprobar: 'Sí, aprobar',
  tituloModalRechazar: '¿Rechazar esta reserva?',
  confirmarRechazar: 'Sí, rechazar',
  tituloModalCancelar: '¿Cancelar esta reserva?',
  confirmarCancelar: 'Sí, cancelar reserva',
  advertenciaIrreversible: 'Esta acción no se puede deshacer.',

  // Salida de datos: Reservas, Dashboard y Mi ambiente
  tituloReservas: 'Reservas',
  reservarUnAmbiente: 'Reservar un ambiente',
  pestanaTodas: 'Todas',
  pestanaPendientes: 'Pendientes',
  pestanaAprobadas: 'Aprobadas',
  pestanaRechazadas: 'Rechazadas',
  pestanaCanceladas: 'Canceladas',
  tituloDetalleReserva: 'Detalle de la reserva',
  volverAReservas: 'Volver a Reservas',
  volverAlDashboard: 'Volver a Inicio',
  volverAMiAmbiente: 'Volver a Mi ambiente',
  tituloDashboard: 'Inicio',
  tituloMiAmbiente: 'Mi ambiente',
  tituloDisponibilidad: 'Disponibilidad',
  etiquetaFiltroEstado: 'Estado',
  etiquetaFiltroAmbiente: 'Ambiente',
  etiquetaFechaDesde: 'Fecha desde',
  etiquetaFechaHasta: 'Fecha hasta',
  todos: 'Todos',
  filtros: 'Filtros',
  aplicarFiltros: 'Aplicar filtros',
  ayudaFechaFiltro: 'Formato dd/mm/aaaa. Vacía, no filtra.',
  limpiar: 'Limpiar',
  limpiarFiltros: 'Limpiar filtros',
  anterior: 'Anterior',
  siguiente: 'Siguiente',
  paginacion: 'Paginación',
  sinReservas: 'Todavía no hay reservas. Crea la primera con «Reservar un ambiente».',
  sinReservasResponsable: 'Todavía no hay reservas.',
  sinReservasConFiltros: 'No hay reservas con esos filtros.',
  cargandoReservas: 'Cargando las reservas…',
  solicitudesPendientes: 'Solicitudes pendientes de aprobación',
  sinPendientes: 'No hay solicitudes pendientes.',
  verTodas: 'Ver todas las pendientes',
  indicadorTotal: 'Total de reservas',
  incluyeCanceladas: 'Incluye canceladas',
  indicadorPendientes: 'Reservas pendientes',
  indicadorAprobadas: 'Reservas aprobadas',
  indicadorRechazadas: 'Reservas rechazadas',
  indicadorMasUtilizado: 'Ambiente más utilizado',
  empateAmbientes: (n, m) =>
    `Empate: ${n} ambientes con ${m} ${m === 1 ? 'reserva aprobada' : 'reservas aprobadas'}`,
  requierenDecision: 'Requieren tu decisión',
  hoyEnAmbientes: 'Hoy en los ambientes',
  usoPorAmbiente: 'Uso por ambiente',
  distribucionEstados: 'Reservas por estado',
  conflictoAprobada: 'Choca con una reserva ya aprobada.',
  ambienteEnMantenimientoAviso: 'El ambiente está en mantenimiento.',
  usoSinDatos: 'Todavía no hay reservas aprobadas.',
  usoTablaAlternativa: 'Tabla alternativa de uso por ambiente',
  usoDelAmbiente: 'Uso del ambiente',
  sinAmbienteAsignado:
    'Todavía no tienes un ambiente a cargo. Cuando se te asigne uno, aparecerá aquí.',
  columnaFecha: 'Fecha',
  columnaHorario: 'Horario',
  columnaAmbiente: 'Ambiente',
  columnaSolicitante: 'Solicitante',
  columnaEstado: 'Estado',
  columnaAcciones: 'Acciones',

  // Pantallas y errores de ruta
  sinPermisoTitulo: 'Sin permiso',
  paginaNoEncontrada: 'No encontramos esa página.',
  paginaNoEncontradaDetalle: 'Esta página no existe o cambió de dirección.',
  volverAlInicio: 'Volver al inicio',
})
