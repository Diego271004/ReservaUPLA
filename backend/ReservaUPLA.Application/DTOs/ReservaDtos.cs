using ReservaUPLA.Domain.Enums;

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

/// <summary>Un cambio de estado de la reserva, con quién lo hizo.</summary>
public sealed record EventoHistorialDto(
    int Id,
    string? EstadoAnterior,
    string EstadoNuevo,
    string UsuarioNombre,
    DateTimeOffset Fecha);

public sealed record ReservaDetalleDto(ReservaDto Reserva, IReadOnlyList<EventoHistorialDto> Historial);

/// <summary>Consulta de disponibilidad: mismos datos que una reserva, sin el motivo.</summary>
public sealed record ConsultarDisponibilidadDto(int? AmbienteId, string? Fecha, string? HoraInicio, string? HoraFin);

/// <summary>Aviso inmediato de la pantalla Nueva reserva: libre (verde) u ocupado (rojo, con la hora).</summary>
public sealed record DisponibilidadDto(bool Disponible, string Mensaje);

/// <summary>Quién hace la operación (viene del token).</summary>
public sealed record ActorDto(int UsuarioId, RolUsuario Rol);

/// <summary>Qué reservas puede ver quien consulta: todas, las de un solicitante o las de los ambientes de un responsable.</summary>
public sealed record FiltroReservas(int? UsuarioId = null, int? ResponsableId = null);
