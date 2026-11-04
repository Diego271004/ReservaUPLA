using ReservaUPLA.Domain.Entities;

namespace ReservaUPLA.Application.Interfaces;

public interface IHistorialReservaRepository
{
    Task<IReadOnlyList<HistorialReserva>> ListarPorReservaAsync(int reservaId, CancellationToken cancellationToken);
    Task AgregarAsync(HistorialReserva evento, CancellationToken cancellationToken);
}
