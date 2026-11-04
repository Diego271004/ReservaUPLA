using ReservaUPLA.Application.Common;
using ReservaUPLA.Application.Interfaces;
using ReservaUPLA.Domain.Entities;

namespace ReservaUPLA.Application.Reglas;

/// <summary>RN-01 en un solo lugar: la usan la creación, la consulta de disponibilidad y la aprobación.</summary>
public sealed class ComprobadorDeHorario
{
    private readonly IReservaRepository _reservas;

    public ComprobadorDeHorario(IReservaRepository reservas)
    {
        _reservas = reservas;
    }

    /// <summary>El mensaje de conflicto (con la hora ocupada) si el ambiente ya tiene una reserva Aprobada que se cruza; si no, null.</summary>
    public async Task<string?> MensajeDeConflictoAsync(Reserva reserva, CancellationToken cancellationToken)
    {
        var propia = reserva.Id == 0 ? (int?)null : reserva.Id; // una reserva no choca con ella misma
        var ocupada = await _reservas.BuscarAprobadaQueSeCruzaAsync(
            reserva.AmbienteId, reserva.Fecha, reserva.HoraInicio, reserva.HoraFin, propia, cancellationToken);

        return ocupada is null ? null : MensajesValidacion.ConflictoDeHorario(ocupada.HoraInicio, ocupada.HoraFin);
    }
}
