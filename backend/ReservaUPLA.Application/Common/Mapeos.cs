using System.Globalization;
using ReservaUPLA.Application.DTOs;
using ReservaUPLA.Domain.Entities;

namespace ReservaUPLA.Application.Common;

/// <summary>Conversión de entidades a DTOs, en un solo lugar para que el formato de fechas y textos no se repita.</summary>
public static class Mapeos
{
    public static UsuarioDto ADto(this Usuario usuario) =>
        new(usuario.Id, usuario.NombreCompleto, usuario.Correo, usuario.Rol.ToString(), usuario.Activo);

    public static AmbienteDto ADto(this Ambiente ambiente, string? responsableNombre) =>
        new(ambiente.Id, ambiente.Nombre, ambiente.Tipo.ToString(), ambiente.Capacidad, ambiente.Ubicacion,
            TextosDominio.ATexto(ambiente.Estado), ambiente.ResponsableId, responsableNombre);

    public static ReservaDto ADto(this Reserva reserva, string ambienteNombre, string solicitanteNombre) =>
        new(reserva.Id, reserva.AmbienteId, ambienteNombre, reserva.UsuarioId, solicitanteNombre,
            reserva.Fecha.ToString("yyyy-MM-dd", CultureInfo.InvariantCulture),
            reserva.HoraInicio.ToString("HH:mm", CultureInfo.InvariantCulture),
            reserva.HoraFin.ToString("HH:mm", CultureInfo.InvariantCulture),
            reserva.Motivo, reserva.Estado.ToString());
}
