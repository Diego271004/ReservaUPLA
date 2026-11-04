using ReservaUPLA.Domain.Entities;

namespace ReservaUPLA.Application.Interfaces;

public interface IReservaRepository
{
    Task<Reserva?> ObtenerPorIdAsync(int id, CancellationToken cancellationToken);
    Task<IReadOnlyList<Reserva>> ListarPorUsuarioAsync(int usuarioId, CancellationToken cancellationToken);
    Task<bool> ExisteAprobadaQueSeCruzaAsync(
        int ambienteId, DateOnly fecha, TimeOnly horaInicio, TimeOnly horaFin, CancellationToken cancellationToken);
    Task AgregarAsync(Reserva reserva, CancellationToken cancellationToken);
}
