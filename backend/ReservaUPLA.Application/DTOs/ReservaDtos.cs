namespace ReservaUPLA.Application.DTOs;

/// <summary>Fecha como aaaa-mm-dd y horas como HH:mm (el frontend muestra la fecha como dd/mm/aaaa).</summary>
public sealed record CrearReservaDto(
    int? AmbienteId,
    string? Fecha,
    string? HoraInicio,
    string? HoraFin,
    string? Motivo);

/// <summary>Reserva con los nombres que muestran las tablas y el detalle.</summary>
public sealed record ReservaDto(
    int Id,
    int AmbienteId,
    string AmbienteNombre,
    int UsuarioId,
    string SolicitanteNombre,
    string Fecha,
    string HoraInicio,
    string HoraFin,
    string Motivo,
    string Estado);

/// <summary>Qué reservas puede ver quien consulta: todas, las de un solicitante o las de los ambientes de un responsable.</summary>
public sealed record FiltroReservas(int? UsuarioId = null, int? ResponsableId = null);
