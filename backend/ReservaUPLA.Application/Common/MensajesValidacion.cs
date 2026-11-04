using ReservaUPLA.Domain.Common;

namespace ReservaUPLA.Application.Common;

/// <summary>
/// Única fuente de los mensajes mostrados al usuario. Deben ser idénticos a
/// frontend/src/constants/messages.js (una prueba del frontend lo comprueba).
/// Cada mensaje dice qué corregir; no hay mensajes ambiguos como "Error".
/// Los mensajes de reglas del dominio viven en MensajesDominio y aquí solo se reexponen.
/// </summary>
public static class MensajesValidacion
{
    // Login
    public const string CorreoVacio = "Ingresa tu correo institucional.";
    public const string CorreoFormatoInvalido =
        "El correo no tiene un formato válido. Ejemplo: nombre.apellido@upla.edu.pe";
    public const string CorreoDemasiadoLargo = "El correo no puede superar los 254 caracteres.";
    public const string ContrasenaVacia = "Ingresa tu contraseña.";
    public const string ContrasenaDemasiadoLarga = "La contraseña no puede superar los 128 caracteres.";
    public const string CredencialesInvalidas =
        "El correo o la contraseña no son correctos. Revisa ambos datos e inténtalo de nuevo.";
    public const string DemasiadosIntentos =
        "Has realizado demasiados intentos. Espera 1 minuto y vuelve a intentarlo.";

    // Errores generales
    public const string ErrorConexion =
        "No pudimos conectar con ReservaUPLA. Revisa tu conexión e inténtalo nuevamente.";
    public const string ErrorServidor =
        "ReservaUPLA no está disponible en este momento. Inténtalo de nuevo en unos minutos.";
    public const string SinPermiso = "No tienes permiso para realizar esta acción.";
    public const string SesionTerminada = "Tu sesión terminó. Inicia sesión de nuevo.";

    // Usuarios
    public const string NombreCompletoVacio = "Ingresa el nombre completo.";
    public const string NombreCompletoDemasiadoLargo = "El nombre no puede superar los 120 caracteres.";
    public const string CorreoUsuarioVacio = "Ingresa el correo institucional.";
    public const string CorreoYaRegistrado = "Ese correo ya está registrado.";
    public const string RolVacio = "Selecciona un rol.";
    public const string RolInvalido = "Selecciona un rol de la lista.";
    public const string ContrasenaInicialVacia = "Ingresa la contraseña inicial.";
    public const string ContrasenaInicialDemasiadoLarga = "La contraseña no puede superar los 72 caracteres.";
    public const string ContrasenaInicialRequisitos =
        "La contraseña debe tener entre 8 y 72 caracteres, con al menos una letra y un número.";
    public const string UsuarioRegistrado = "Usuario registrado.";

    // Ambientes
    public const string NombreAmbienteVacio = "Ingresa el nombre del ambiente.";
    public const string NombreAmbienteDemasiadoLargo = "El nombre no puede superar los 120 caracteres.";
    public const string NombreAmbienteDuplicado = "Ya existe un ambiente con ese nombre.";
    public const string TipoVacio = "Selecciona el tipo de ambiente.";
    public const string TipoInvalido = "Selecciona un tipo de la lista.";
    public const string CapacidadVacia = "Ingresa la capacidad.";
    public const string CapacidadInvalida = "Ingresa la capacidad como un número, por ejemplo 30.";
    public const string UbicacionVacia = "Ingresa la ubicación.";
    public const string UbicacionDemasiadoLarga = "La ubicación no puede superar los 160 caracteres.";
    public const string EstadoAmbienteVacio = "Selecciona el estado del ambiente.";
    public const string EstadoAmbienteInvalido = "Selecciona un estado de la lista.";
    public const string ResponsableInvalido = "Selecciona un responsable de la lista.";
    public const string AmbienteRegistrado = "Ambiente registrado.";

    // Reservas: campos (RN-02, RN-03, RN-04)
    public const string AmbienteVacio = "Selecciona un ambiente.";
    public const string AmbienteInexistente = "Selecciona un ambiente de la lista.";
    public const string FechaVacia = "Ingresa la fecha de la reserva.";
    public const string FechaFormatoInvalido = "Ingresa la fecha con el formato dd/mm/aaaa.";
    public const string FechaPasada = "No puedes reservar para una fecha anterior a hoy.";
    public const string HoraInicioVacia = "Selecciona la hora de inicio.";
    public const string HoraFinVacia = "Selecciona la hora de fin.";
    public const string HoraFueraDeHorario = "El horario permitido es de 07:00 a 22:00.";
    public const string HoraFinNoPosterior = "La hora de fin debe ser posterior a la hora de inicio.";
    public const string MotivoVacio = "Ingresa el motivo de la reserva.";
    public const string MotivoDemasiadoLargo = "El motivo no puede superar los 300 caracteres.";
    // Reservas: filtros del listado
    public const string EstadoFiltroInvalido = "Elige un estado de la lista.";
    public const string RangoDeFechasInvalido = "La fecha final no puede ser anterior a la inicial.";
    public const string PaginaInvalida = "La página debe ser 1 o mayor.";
    public const string ReservaRegistrada = "Solicitud registrada. Quedó Pendiente de aprobación.";

    // Reservas: disponibilidad y reglas de negocio (RN-01, RN-05, RN-06)
    public const string Disponible = "Disponible: no hay reservas aprobadas en ese horario";
    public const string AmbienteEnMantenimiento = "Ese ambiente está en mantenimiento y no admite reservas nuevas.";
    public const string ConflictoDeHorarioSinDetalle =
        "Ese ambiente ya tiene una reserva aprobada en ese horario. Elige otro horario u otro ambiente.";
    public const string ReservaAprobada = "Reserva aprobada.";
    public const string ReservaRechazada = "Reserva rechazada.";
    public const string ReservaCancelada = "Reserva cancelada.";
    public const string ReservaRechazadaNoSeModifica = MensajesDominio.ReservaRechazadaNoSeModifica;
    public const string ReservaCanceladaNoSeModifica = MensajesDominio.ReservaCanceladaNoSeModifica;
    public const string SoloPendienteSeApruebaORechaza = MensajesDominio.SoloPendienteSeApruebaORechaza;

    /// <summary>El dominio es configurable, por eso este mensaje se construye.</summary>
    public static string CorreoDominioNoInstitucional(string dominio) =>
        $"Usa tu correo institucional (termina en @{dominio}).";

    /// <summary>RN-01: dice a qué hora está ocupado el ambiente (pantalla 04e).</summary>
    public static string ConflictoDeHorario(TimeOnly horaInicio, TimeOnly horaFin) =>
        $"Ese ambiente ya tiene una reserva aprobada de {horaInicio:HH:mm} a {horaFin:HH:mm}. Elige otro horario u otro ambiente.";
}
