using System.Globalization;

namespace ReservaUPLA.Application.Common;

/// <summary>Límites del horario de reservas (RN-04) y conversión de los textos de fecha y hora de la API.</summary>
public static class HorarioReserva
{
    public static readonly TimeOnly Apertura = new(7, 0);
    public static readonly TimeOnly Cierre = new(22, 0);

    public static bool TryHora(string? texto, out TimeOnly hora) =>
        TimeOnly.TryParseExact(texto, "HH:mm", CultureInfo.InvariantCulture, DateTimeStyles.None, out hora);

    /// <summary>La API recibe la fecha como aaaa-mm-dd (ISO); el frontend la muestra como dd/mm/aaaa.</summary>
    public static bool TryFecha(string? texto, out DateOnly fecha) =>
        DateOnly.TryParseExact(texto, "yyyy-MM-dd", CultureInfo.InvariantCulture, DateTimeStyles.None, out fecha);

    public static bool EstaDentroDelHorario(TimeOnly hora) => hora >= Apertura && hora <= Cierre;
}
