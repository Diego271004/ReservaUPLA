namespace ReservaUPLA.Application.DTOs;

public sealed record CrearAmbienteDto(
    string? Nombre,
    string? Tipo,
    int? Capacidad,
    string? Ubicacion,
    string? Estado,
    int? ResponsableId);

public sealed record AmbienteDto(
    int Id,
    string Nombre,
    string Tipo,
    int Capacidad,
    string Ubicacion,
    string Estado,
    int? ResponsableId,
    string? ResponsableNombre);
