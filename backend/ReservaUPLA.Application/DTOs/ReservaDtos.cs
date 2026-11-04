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

/// <summary>Cómo se ordena un listado: por fecha de la reserva o por antigüedad de la solicitud (las pendientes más antiguas).</summary>
public enum OrdenReservas
{
    PorFecha,
    PorAntiguedad,
}

/// <summary>
/// Qué reservas se consultan: el alcance del rol (todas, las de un solicitante o las de los ambientes de un responsable) más
/// los filtros de la pantalla Reservas y la página pedida.
/// </summary>
public sealed record FiltroReservas(
    int? UsuarioId = null,
    int? ResponsableId = null,
    EstadoReserva? Estado = null,
    int? AmbienteId = null,
    DateOnly? Desde = null,
    DateOnly? Hasta = null,
    int Pagina = 1,
    int Tamano = 10,
    OrdenReservas Orden = OrdenReservas.PorFecha);

/// <summary>Filtros tal como llegan en la dirección (?estado=&amp;ambienteId=&amp;desde=&amp;hasta=&amp;pagina=); fechas aaaa-mm-dd.</summary>
public sealed record ConsultaReservasDto(string? Estado, int? AmbienteId, string? Desde, string? Hasta, int? Pagina);

/// <summary>Una página de reservas y cuántas hay en total con esos filtros.</summary>
public sealed record PaginaDeReservasDto(IReadOnlyList<ReservaDto> Elementos, int Total, int Pagina, int Tamano);

/// <summary>Indicadores por estado. <c>Total</c> cuenta todas las reservas, también las Canceladas.</summary>
public sealed record IndicadoresDto(int Total, int Pendientes, int Aprobadas, int Rechazadas);

/// <summary>Un ambiente con sus reservas Aprobadas (el criterio de «más utilizado»).</summary>
public sealed record AmbienteUsoDto(int AmbienteId, string Nombre, int ReservasAprobadas);

/// <summary>
/// Dashboard del Administrador. Las pendientes más antiguas son las 5 solicitudes más viejas (por fecha de creación);
/// su <c>Total</c> es el total de pendientes («Mostrando 5 de 7»).
/// </summary>
public sealed record DashboardDto(
    IndicadoresDto Indicadores,
    IReadOnlyList<AmbienteUsoDto> AmbientesMasUtilizados,
    PaginaDeReservasDto PendientesMasAntiguas);

public sealed record AmbienteResumenDto(int Id, string Nombre, string Ubicacion, int Capacidad, string Estado);

/// <summary>Mi ambiente (Responsable): el ambiente elegido, todos los suyos, sus indicadores y sus reservas (solo lectura).</summary>
public sealed record MiAmbienteDto(
    AmbienteResumenDto? Ambiente,
    IReadOnlyList<AmbienteResumenDto> Ambientes,
    IndicadoresDto Indicadores,
    PaginaDeReservasDto Reservas);
