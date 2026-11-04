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
  horaInicioVacia: 'Selecciona la hora de inicio.',
  horaFinVacia: 'Selecciona la hora de fin.',
  horaFueraDeHorario: 'El horario permitido es de 07:00 a 22:00.',
  horaFinNoPosterior: 'La hora de fin debe ser posterior a la hora de inicio.',
  motivoVacio: 'Ingresa el motivo de la reserva.',
  motivoDemasiadoLargo: 'El motivo no puede superar los 300 caracteres.',
  reservaRegistrada: 'Solicitud registrada. Quedó Pendiente de aprobación.',
})

/** Mensajes que se construyen con un dato (no viajan por la API). */
export const mensajeDominioNoInstitucional = (dominio) =>
  `Usa tu correo institucional (termina en @${dominio}).`

/** Textos propios de la interfaz. */
export const TEXTOS = Object.freeze({
  nombreProducto: 'ReservaUPLA',
  lemaLogin: 'Reserva laboratorios, auditorios y salas de la UPLA',
  universidad: 'Universidad Peruana Los Andes',
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

  // Usuarios
  tituloUsuarios: 'Usuarios',
  nuevoUsuario: 'Nuevo usuario',
  tituloRegistrarUsuario: 'Registrar usuario',
  guardarUsuario: 'Guardar usuario',
  etiquetaNombreCompleto: 'Nombre completo',
  etiquetaRol: 'Rol',
  etiquetaActivo: 'Activo',
  etiquetaContrasenaInicial: 'Contraseña inicial',
  activo: 'Activo',
  inactivo: 'Inactivo',

  // Ambientes
  tituloAmbientes: 'Ambientes',
  nuevoAmbiente: 'Nuevo ambiente',
  tituloRegistrarAmbiente: 'Registrar ambiente',
  guardarAmbiente: 'Guardar ambiente',
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
  etiquetaMotivo: 'Motivo',
  registrarSolicitud: 'Registrar solicitud',
  ambienteEnMantenimiento: 'En mantenimiento (no disponible)',
  personas: 'personas',

  // Pantallas y errores de ruta
  pantallaEnConstruccion: 'Pantalla en construcción',
  textoEnConstruccion: 'Esta pantalla se construye en una fase posterior.',
  sinPermisoTitulo: 'Sin permiso',
  paginaNoEncontrada: 'No encontramos esa página.',
  volverAlInicio: 'Volver al inicio',
})
