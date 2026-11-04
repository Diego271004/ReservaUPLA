using ReservaUPLA.Application.DTOs;
using ReservaUPLA.Domain.Entities;

namespace ReservaUPLA.Application.Interfaces;

public interface IReservaRepository
{
    Task<Reserva?> ObtenerPorIdAsync(int id, CancellationToken cancellationToken);
    Task<IReadOnlyList<ReservaDto>> ListarAsync(FiltroReservas filtro, CancellationToken cancellationToken);

    /// <summary>Hay una reserva Aprobada del ambiente que se cruza con el rango (RN-01). La usa la Fase 6.</summary>
    Task<bool> ExisteAprobadaQueSeCruzaAsync(
        int ambienteId, DateOnly fecha, TimeOnly horaInicio, TimeOnly horaFin, CancellationToken cancellationToken);

    /// <summary>
    /// Guarda la reserva y su primer evento de historial (estado Pendiente, hecho por el solicitante)
    /// en una sola transacción. Completa el Id de la reserva.
    /// </summary>
    Task CrearAsync(Reserva reserva, CancellationToken cancellationToken);
}
